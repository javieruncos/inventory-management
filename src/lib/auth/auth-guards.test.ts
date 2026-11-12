import * as jwt from "jsonwebtoken";
import { Types } from "mongoose";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { MockInstance } from "vitest";
import { cookies } from "next/headers";
import { connectDB } from "@/db/connection";
import UserModel, { type User } from "@/db/models/User";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import {
  getOptionalUser,
  requireAdmin,
  requireUser,
} from "@/lib/auth/auth-guards";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
  signAccessToken,
} from "@/lib/auth/jwt";
import { AppError } from "@/lib/errors";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

const TEST_SECRET = "test-only-jwt-secret-with-more-than-32-characters";
const OTHER_SECRET = "other-test-only-jwt-secret-with-32-characters";
const USER_ID = "507f1f77bcf86cd799439011";
const EMAIL = "admin@example.com";
const PASSWORD_HASH =
  "$2b$12$8kumSJsTlcmqL998gb8Kk.zHMfFXisenPUw8UD9AZsBVjhiuOFZTy";

const getCookie = vi.fn();

function mockCookie(value?: string): void {
  getCookie.mockImplementation((name: string) =>
    value !== undefined && name === AUTH_COOKIE_NAME
      ? { name, value }
      : undefined,
  );

  vi.mocked(cookies).mockResolvedValue({
    get: getCookie,
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

function makeToken({
  secret = TEST_SECRET,
  options = {},
}: {
  secret?: string;
  options?: jwt.SignOptions;
} = {}): string {
  return jwt.sign({ tokenType: "access" }, secret, {
    subject: USER_ID,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    algorithm: "HS256",
    ...options,
  });
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: new Types.ObjectId(USER_ID),
    email: EMAIL,
    passwordHash: PASSWORD_HASH,
    role: "admin",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

type QueryChain = {
  select: (projection: string) => {
    lean: () => Promise<User | null>;
  };
};

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

async function expectAuthenticationRequired(
  promise: Promise<unknown>,
): Promise<AuthenticationRequiredError> {
  const error = await getThrownError(promise);

  expect(error).toBeInstanceOf(AuthenticationRequiredError);
  expect(error).toMatchObject({
    kind: "UNAUTHORIZED",
    status: 401,
    message: "No autenticado",
  });

  return error as AuthenticationRequiredError;
}

async function expectForbidden(
  promise: Promise<unknown>,
): Promise<ForbiddenError> {
  const error = await getThrownError(promise);

  expect(error).toBeInstanceOf(ForbiddenError);
  expect(error).toMatchObject({
    kind: "FORBIDDEN",
    status: 403,
    message: "No autorizado",
  });

  return error as ForbiddenError;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("JWT_SECRET", TEST_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("requireUser", () => {
  it("rechaza una cookie ausente sin consultar MongoDB", async () => {
    mockCookie();

    await expectAuthenticationRequired(requireUser());

    expect(getCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza una cookie vacía sin consultar MongoDB", async () => {
    mockCookie("");

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un JWT malformado", async () => {
    mockCookie("esto-no-es-un-jwt");

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un JWT expirado", async () => {
    mockCookie(makeToken({ options: { expiresIn: -1 } }));

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un JWT firmado con otro secreto", async () => {
    mockCookie(makeToken({ secret: OTHER_SECRET }));

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ObjectId inválido sin consultar MongoDB", async () => {
    mockCookie(signAccessToken("no-es-un-object-id"));

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un usuario inexistente", async () => {
    const { findOne, select } = mockUser(null);
    mockCookie(signAccessToken(USER_ID));

    await expectAuthenticationRequired(requireUser());

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      _id: USER_ID,
      isActive: true,
    });
    expect(select).toHaveBeenCalledWith("email role");
  });

  it("rechaza un usuario inactivo mediante el filtro isActive", async () => {
    const { findOne } = mockUser(null);
    mockCookie(signAccessToken(USER_ID));

    await expectAuthenticationRequired(requireUser());

    expect(findOne).toHaveBeenCalledWith({
      _id: USER_ID,
      isActive: true,
    });
  });

  it("devuelve solo los datos públicos del usuario activo", async () => {
    const { findOne, select } = mockUser(makeUser({ role: "user" }));
    mockCookie(signAccessToken(USER_ID));

    const user = await requireUser();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      _id: USER_ID,
      isActive: true,
    });
    expect(select).toHaveBeenCalledWith("email role");
    expect(user).toEqual({
      id: USER_ID,
      email: EMAIL,
      role: "user",
    });
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("isActive");
    expect(user).not.toHaveProperty("token");
    expect(user).not.toHaveProperty("createdAt");
    expect(user).not.toHaveProperty("updatedAt");
  });

  it("convierte un error de MongoDB en INTERNAL", async () => {
    const findOne = vi.spyOn(UserModel, "findOne") as unknown as MockInstance<
      (filter?: unknown) => QueryChain
    >;
    findOne.mockImplementation(() => {
      throw new Error("db down");
    });
    mockCookie(signAccessToken(USER_ID));

    const error = await getThrownError(requireUser());

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect((error as Error).message).not.toContain("db down");
  });

  it("convierte un JWT_SECRET inválido en INTERNAL, no en 401", async () => {
    const token = signAccessToken(USER_ID);
    mockCookie(token);
    vi.stubEnv("JWT_SECRET", "secreto-corto");

    const error = await getThrownError(requireUser());

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(connectDB).not.toHaveBeenCalled();
  });
});

describe("getOptionalUser", () => {
  it("devuelve el usuario cuando hay una sesión válida", async () => {
    const { findOne } = mockUser(makeUser({ role: "user" }));
    mockCookie(signAccessToken(USER_ID));

    const user = await getOptionalUser();

    expect(user).toEqual({
      id: USER_ID,
      email: EMAIL,
      role: "user",
    });
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("devuelve null sin cookie sin consultar MongoDB", async () => {
    mockCookie();

    const user = await getOptionalUser();

    expect(user).toBeNull();
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve null ante un JWT inválido", async () => {
    mockCookie("esto-no-es-un-jwt");

    const user = await getOptionalUser();

    expect(user).toBeNull();
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve null cuando el usuario no existe o está inactivo", async () => {
    const { findOne } = mockUser(null);
    mockCookie(signAccessToken(USER_ID));

    const user = await getOptionalUser();

    expect(user).toBeNull();
    expect(findOne).toHaveBeenCalledWith({
      _id: USER_ID,
      isActive: true,
    });
  });

  it("propaga un error de MongoDB como INTERNAL", async () => {
    const findOne = vi.spyOn(UserModel, "findOne") as unknown as MockInstance<
      (filter?: unknown) => QueryChain
    >;
    findOne.mockImplementation(() => {
      throw new Error("db down");
    });
    mockCookie(signAccessToken(USER_ID));

    const error = await getThrownError(getOptionalUser());

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
  });

  it("propaga una configuración JWT inválida como INTERNAL", async () => {
    const token = signAccessToken(USER_ID);
    mockCookie(token);
    vi.stubEnv("JWT_SECRET", "secreto-corto");

    const error = await getThrownError(getOptionalUser());

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(connectDB).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("autoriza a un administrador", async () => {
    const { findOne } = mockUser(makeUser({ role: "admin" }));
    mockCookie(signAccessToken(USER_ID));

    const user = await requireAdmin();

    expect(user).toEqual({
      id: USER_ID,
      email: EMAIL,
      role: "admin",
    });
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("rechaza a un usuario normal con 403", async () => {
    const { findOne } = mockUser(makeUser({ role: "user" }));
    mockCookie(signAccessToken(USER_ID));

    await expectForbidden(requireAdmin());

    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("rechaza sin sesión con 401", async () => {
    mockCookie();

    await expectAuthenticationRequired(requireAdmin());

    expect(connectDB).not.toHaveBeenCalled();
  });

  it("reutiliza requireUser sin duplicar consultas", async () => {
    const { findOne } = mockUser(makeUser({ role: "admin" }));
    mockCookie(signAccessToken(USER_ID));

    await requireAdmin();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(cookies).toHaveBeenCalledTimes(1);
  });

  it("no registra logs al rechazar autenticación o autorización", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockCookie();
    await getThrownError(requireUser());

    mockCookie(signAccessToken(USER_ID));
    mockUser(makeUser({ role: "user" }));
    await getThrownError(requireAdmin());

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
