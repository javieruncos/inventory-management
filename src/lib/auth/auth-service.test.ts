import * as bcrypt from "bcrypt";
import { Types } from "mongoose";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { MockInstance } from "vitest";
import { connectDB } from "@/db/connection";
import UserModel, { type User } from "@/db/models/User";
import { AppError } from "@/lib/errors";
import { signAccessToken } from "@/lib/auth/jwt";
import {
  authenticateUser,
  InvalidCredentialsError,
} from "@/lib/auth/auth-service";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/auth/jwt", () => ({
  signAccessToken: vi.fn(),
}));

const USER_ID = "507f1f77bcf86cd799439011";
const EMAIL = "admin@example.com";
const PASSWORD = "correct-password";
const TOKEN = "signed-token";

let passwordHash = "";

beforeAll(async () => {
  passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signAccessToken).mockReturnValue(TOKEN);
});

afterEach(() => {
  vi.restoreAllMocks();
});

type QueryChain = {
  select: (projection: string) => {
    lean: () => Promise<User | null>;
  };
};

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: new Types.ObjectId(USER_ID),
    email: EMAIL,
    passwordHash,
    role: "admin",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function mockUser(user: User | null) {
  const lean = vi.fn().mockResolvedValue(user);
  const select = vi.fn().mockReturnValue({ lean });
  const findOne = vi.spyOn(UserModel, "findOne") as unknown as MockInstance<
    (filter?: unknown) => QueryChain
  >;
  findOne.mockReturnValue({ select });

  return { findOne, select, lean };
}

async function getThrownError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error("Se esperaba un error");
}

describe("authenticateUser", () => {
  it("autentica credenciales válidas y genera el token con el helper existente", async () => {
    const { findOne, select } = mockUser(makeUser());

    const result = await authenticateUser({
      email: "  ADMIN@Example.COM  ",
      password: PASSWORD,
    });

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ email: EMAIL });
    expect(select).toHaveBeenCalledWith("+passwordHash");
    expect(signAccessToken).toHaveBeenCalledWith(USER_ID);
    expect(result).toEqual({
      token: TOKEN,
      user: {
        id: USER_ID,
        email: EMAIL,
        role: "admin",
      },
    });
  });

  it("no expone el hash ni el token dentro del usuario público", async () => {
    mockUser(makeUser());

    const result = await authenticateUser({
      email: EMAIL,
      password: PASSWORD,
    });

    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("token");
    expect(JSON.stringify(result.user)).not.toContain(passwordHash);
  });

  it("rechaza un email inexistente con el mismo error genérico", async () => {
    mockUser(null);

    const error = await getThrownError(
      authenticateUser({
        email: "missing@example.com",
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect((error as Error).message).toBe("Credenciales inválidas");
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  it("rechaza una contraseña incorrecta sin generar token", async () => {
    mockUser(makeUser());

    const error = await getThrownError(
      authenticateUser({
        email: EMAIL,
        password: "wrong-password",
      }),
    );

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect((error as Error).message).toBe("Credenciales inválidas");
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  it("rechaza un usuario desactivado aunque la contraseña sea correcta", async () => {
    mockUser(makeUser({ isActive: false }));

    const error = await getThrownError(
      authenticateUser({
        email: EMAIL,
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect((error as Error).message).toBe("Credenciales inválidas");
    expect(signAccessToken).not.toHaveBeenCalled();
  });

  it("no registra credenciales ni datos personales en fallos de autenticación", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUser(null);

    const error = await getThrownError(
      authenticateUser({
        email: "missing@example.com",
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect((error as Error).message).not.toContain("missing@example.com");
    expect((error as Error).message).not.toContain(PASSWORD);
    expect((error as Error).message).not.toContain(passwordHash);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("convierte un error de MongoDB en INTERNAL sin filtrar detalles", async () => {
    const findOne = vi.spyOn(UserModel, "findOne") as unknown as MockInstance<
      (filter?: unknown) => QueryChain
    >;
    findOne.mockImplementation(() => {
      throw new Error("db down");
    });

    const error = await getThrownError(
      authenticateUser({
        email: EMAIL,
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect((error as Error).message).not.toContain("db down");
  });

  it("convierte un hash almacenado inválido en INTERNAL", async () => {
    mockUser(makeUser({ passwordHash: "not-a-bcrypt-hash" }));

    const error = await getThrownError(
      authenticateUser({
        email: EMAIL,
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
  });

  it("convierte un fallo al firmar el JWT en INTERNAL", async () => {
    mockUser(makeUser());
    vi.mocked(signAccessToken).mockImplementation(() => {
      throw new Error("jwt down");
    });

    const error = await getThrownError(
      authenticateUser({
        email: EMAIL,
        password: PASSWORD,
      }),
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
  });
});
