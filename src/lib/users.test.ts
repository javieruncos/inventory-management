import * as bcrypt from "bcrypt";
import { Types } from "mongoose";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { connectDB } from "@/db/connection";
import UserModel, { type User } from "@/db/models/User";
import { AppError } from "@/lib/errors";
import { createUser, deactivateUser, listUsers } from "@/lib/users";
import { createUserSchema } from "@/schemas/user";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("bcrypt", () => ({
  hash: vi.fn(),
}));

const USER_ID = "507f1f77bcf86cd799439011";
const OTHER_ID = "507f1f77bcf86cd799439012";
const PASSWORD_HASH =
  "$2b$12$8kumSJsTlcmqL998gb8Kk.zHMfFXisenPUw8UD9AZsBVjhiuOFZTy";
const CREATED_AT = new Date("2026-01-01T10:00:00.000Z");
const hashMock = vi.mocked(bcrypt.hash) as unknown as MockInstance<
  (password: string, salt: number) => Promise<string>
>;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    _id: new Types.ObjectId(USER_ID),
    email: "user@example.com",
    passwordHash: PASSWORD_HASH,
    role: "user",
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

type FindManyChain = {
  select: (projection: string) => {
    sort: (sort: unknown) => {
      lean: () => Promise<User[]>;
    };
  };
};

function mockFindMany(users: User[]) {
  const lean = vi.fn().mockResolvedValue(users);
  const sort = vi.fn().mockReturnValue({ lean });
  const select = vi.fn().mockReturnValue({ sort });
  const find = vi.spyOn(UserModel, "find") as unknown as MockInstance<
    () => FindManyChain
  >;
  find.mockReturnValue({ select });

  return { find, select, sort, lean };
}

type FindOneChain = {
  select: (projection: string) => {
    lean: () => Promise<User | null>;
  };
};

function mockFindOne(user: User | null) {
  const lean = vi.fn().mockResolvedValue(user);
  const select = vi.fn().mockReturnValue({ lean });
  const findOne = vi.spyOn(UserModel, "findOne") as unknown as MockInstance<
    (filter?: unknown) => FindOneChain
  >;
  findOne.mockReturnValue({ select });

  return { findOne, select, lean };
}

function mockFindOneAndUpdate(user: User | null) {
  const lean = vi.fn().mockResolvedValue(user);
  const select = vi.fn().mockReturnValue({ lean });
  const findOneAndUpdate = vi.spyOn(
    UserModel,
    "findOneAndUpdate",
  ) as unknown as MockInstance<
    (filter?: unknown, update?: unknown, options?: unknown) => FindOneChain
  >;
  findOneAndUpdate.mockReturnValue({ select });

  return { findOneAndUpdate, select, lean };
}

function mockCountDocuments(count: number) {
  return vi
    .spyOn(UserModel, "countDocuments")
    .mockResolvedValue(count) as unknown as MockInstance<
    (filter?: unknown) => Promise<number>
  >;
}

function mockCreate(user: User) {
  const create = vi.spyOn(UserModel, "create") as unknown as MockInstance<
    (doc: Partial<User>) => Promise<User>
  >;
  create.mockResolvedValue(user);

  return create;
}

async function getThrownError(promise: Promise<unknown>): Promise<AppError> {
  let thrown: unknown;

  try {
    await promise;
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(AppError);
  return thrown as AppError;
}

beforeEach(() => {
  vi.clearAllMocks();
  hashMock.mockResolvedValue(PASSWORD_HASH);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createUserSchema", () => {
  it("normaliza el email y acepta una contraseña de 12 caracteres", () => {
    const result = createUserSchema.safeParse({
      email: "  New.User@Example.COM  ",
      password: "a".repeat(12),
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("new.user@example.com");
  });

  it("rechaza una contraseña de 11 caracteres", () => {
    const result = createUserSchema.safeParse({
      email: "new.user@example.com",
      password: "a".repeat(11),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["password"],
        message: "La contraseña debe tener al menos 12 caracteres",
      }),
    ]);
  });

  it("acepta una contraseña de 72 bytes UTF-8", () => {
    const result = createUserSchema.safeParse({
      email: "new.user@example.com",
      password: "á".repeat(36),
    });

    expect(result.success).toBe(true);
  });

  it("rechaza una contraseña que supera 72 bytes UTF-8", () => {
    const result = createUserSchema.safeParse({
      email: "new.user@example.com",
      password: "á".repeat(37),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["password"],
        message: "La contraseña no puede superar 72 bytes UTF-8",
      }),
    ]);
  });

  it("rechaza un email inválido", () => {
    const result = createUserSchema.safeParse({
      email: "no-es-un-email",
      password: "a".repeat(12),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["email"],
        message: "El email no es válido",
      }),
    ]);
  });

  it("rechaza campos no permitidos como role o isActive", () => {
    const result = createUserSchema.safeParse({
      email: "new.user@example.com",
      password: "a".repeat(12),
      role: "admin",
      isActive: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        code: "unrecognized_keys",
        keys: ["role", "isActive"],
      }),
    ]);
  });
});

describe("listUsers", () => {
  it("devuelve usuarios activos e inactivos sin passwordHash", async () => {
    const active = makeUser();
    const inactive = makeUser({
      _id: new Types.ObjectId(OTHER_ID),
      email: "inactive@example.com",
      role: "admin",
      isActive: false,
    });
    const { select, sort } = mockFindMany([active, inactive]);

    const result = await listUsers();

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith("email role isActive createdAt");
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([
      {
        id: USER_ID,
        email: "user@example.com",
        role: "user",
        isActive: true,
        createdAt: CREATED_AT.toISOString(),
      },
      {
        id: OTHER_ID,
        email: "inactive@example.com",
        role: "admin",
        isActive: false,
        createdAt: CREATED_AT.toISOString(),
      },
    ]);
    expect(result[0]).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
  });
});

describe("createUser", () => {
  it("hashea con costo 12, normaliza el email y crea siempre un usuario activo", async () => {
    const created = makeUser({ email: "new.user@example.com" });
    const create = mockCreate(created);

    const result = await createUser({
      email: "  New.User@Example.COM  ",
      password: "a".repeat(12),
    });

    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(bcrypt.hash).toHaveBeenCalledWith("a".repeat(12), 12);
    expect(create).toHaveBeenCalledWith({
      email: "new.user@example.com",
      passwordHash: PASSWORD_HASH,
      role: "user",
      isActive: true,
    });
    expect(result).toEqual({
      id: USER_ID,
      email: "new.user@example.com",
      role: "user",
      isActive: true,
      createdAt: CREATED_AT.toISOString(),
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(result)).not.toContain(PASSWORD_HASH);
  });

  it("rechaza role aunque venga en el body antes de acceder a la base", async () => {
    const error = await getThrownError(
      createUser({
        email: "new.user@example.com",
        password: "a".repeat(12),
        role: "admin",
      }),
    );

    expect(error.kind).toBe("VALIDATION");
    expect(error.message).toBe("Datos inválidos");
    expect(error.issues).toEqual([
      { path: "", message: "Campo no permitido: role" },
    ]);
    expect(connectDB).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("devuelve CONFLICT claro cuando el email ya existe", async () => {
    const create = vi.spyOn(UserModel, "create") as unknown as MockInstance<
      (doc: Partial<User>) => Promise<User>
    >;
    create.mockRejectedValue({ code: 11000, keyPattern: { email: 1 } });

    const error = await getThrownError(
      createUser({
        email: "existing@example.com",
        password: "a".repeat(12),
      }),
    );

    expect(error.kind).toBe("CONFLICT");
    expect(error.message).toBe("El email ya está en uso");
    expect(error.issues).toEqual([
      { path: "email", message: "El email ya está en uso" },
    ]);
  });
});

describe("deactivateUser", () => {
  it("rechaza la auto-desactivación sin consultar la base", async () => {
    const error = await getThrownError(deactivateUser(USER_ID, USER_ID));

    expect(error.kind).toBe("FORBIDDEN");
    expect(error.message).toBe("No puedes desactivar tu propia cuenta");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve NOT_FOUND cuando el usuario no existe", async () => {
    mockFindOne(null);

    const error = await getThrownError(deactivateUser(OTHER_ID, USER_ID));

    expect(error.kind).toBe("NOT_FOUND");
    expect(error.message).toBe("El usuario no existe");
  });

  it("es idempotente cuando el usuario ya está inactivo", async () => {
    const inactive = makeUser({ isActive: false });
    mockFindOne(inactive);
    const update = mockFindOneAndUpdate(null);
    const count = mockCountDocuments(1);

    const first = await deactivateUser(USER_ID, OTHER_ID);
    const second = await deactivateUser(USER_ID, OTHER_ID);

    expect(first).toEqual({
      id: USER_ID,
      email: "user@example.com",
      role: "user",
      isActive: false,
      createdAt: CREATED_AT.toISOString(),
    });
    expect(second).toEqual(first);
    expect(count).not.toHaveBeenCalled();
    expect(update.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("impide desactivar al último administrador activo", async () => {
    const admin = makeUser({ role: "admin" });
    mockFindOne(admin);
    const count = mockCountDocuments(1);
    const update = mockFindOneAndUpdate(null);

    const error = await getThrownError(deactivateUser(USER_ID, OTHER_ID));

    expect(error.kind).toBe("CONFLICT");
    expect(error.message).toBe(
      "No se puede desactivar al último administrador activo",
    );
    expect(count).toHaveBeenCalledWith({ role: "admin", isActive: true });
    expect(update.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("desactiva un usuario regular sin contar administradores", async () => {
    const user = makeUser();
    const inactive = makeUser({ isActive: false });
    mockFindOne(user);
    const count = mockCountDocuments(1);
    const { findOneAndUpdate } = mockFindOneAndUpdate(inactive);

    const result = await deactivateUser(USER_ID, OTHER_ID);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    );
    expect(count).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: USER_ID,
      email: "user@example.com",
      role: "user",
      isActive: false,
      createdAt: CREATED_AT.toISOString(),
    });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("permite desactivar a un administrador si queda otro activo", async () => {
    const admin = makeUser({ role: "admin" });
    const inactiveAdmin = makeUser({ role: "admin", isActive: false });
    mockFindOne(admin);
    const count = mockCountDocuments(2);
    mockFindOneAndUpdate(inactiveAdmin);

    const result = await deactivateUser(USER_ID, OTHER_ID);

    expect(count).toHaveBeenCalledWith({ role: "admin", isActive: true });
    expect(result.isActive).toBe(false);
    expect(result.role).toBe("admin");
  });
});
