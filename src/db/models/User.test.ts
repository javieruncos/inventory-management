import mongoose, { type HydratedDocument } from "mongoose";
import { describe, expect, it } from "vitest";
import UserModel, { type User } from "@/db/models/User";

const PASSWORD_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K5Oa2";

async function getValidationError(
  user: HydratedDocument<User>,
): Promise<mongoose.Error.ValidationError> {
  try {
    await user.validate();
  } catch (error) {
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    return error as mongoose.Error.ValidationError;
  }

  throw new Error("Se esperaba un error de validación");
}

describe("User schema", () => {
  it("acepta un usuario válido", async () => {
    const user = new UserModel({
      email: "admin@example.com",
      passwordHash: PASSWORD_HASH,
      role: "admin",
    });

    await expect(user.validate()).resolves.toBeUndefined();
    expect(user.email).toBe("admin@example.com");
    expect(user.passwordHash).toBe(PASSWORD_HASH);
    expect(user.role).toBe("admin");
    expect(user.isActive).toBe(true);
  });

  it("exige email", async () => {
    const user = new UserModel({ passwordHash: PASSWORD_HASH });
    const error = await getValidationError(user);

    expect(error.errors.email).toBeDefined();
  });

  it("normaliza el email eliminando espacios y pasando a minúsculas", () => {
    const user = new UserModel({
      email: "  Admin@Example.COM  ",
      passwordHash: PASSWORD_HASH,
    });

    expect(user.email).toBe("admin@example.com");
  });

  it("exige passwordHash", async () => {
    const user = new UserModel({ email: "user@example.com" });
    const error = await getValidationError(user);

    expect(error.errors.passwordHash).toBeDefined();
  });

  it("aplica los valores predeterminados de role e isActive", () => {
    const user = new UserModel({
      email: "user@example.com",
      passwordHash: PASSWORD_HASH,
    });

    expect(user.role).toBe("user");
    expect(user.isActive).toBe(true);
  });

  it("rechaza un rol inválido", async () => {
    const user = new UserModel({
      email: "user@example.com",
      passwordHash: PASSWORD_HASH,
      role: "superadmin" as unknown as User["role"],
    });
    const error = await getValidationError(user);

    expect(error.errors.role).toBeDefined();
  });

  it("configura timestamps y excluye passwordHash de las consultas por defecto", () => {
    expect(UserModel.schema.options.timestamps).toBe(true);
    expect(UserModel.schema.path("passwordHash")?.options.select).toBe(false);
  });
});

describe("User schema indexes", () => {
  it("declara un único índice único sobre email", () => {
    const emailIndexes = UserModel.schema
      .indexes()
      .filter(([fields]) => "email" in fields);

    expect(UserModel.schema.indexes()).toHaveLength(1);
    expect(emailIndexes).toHaveLength(1);

    const [fields, options] = emailIndexes[0];

    expect(fields).toEqual({ email: 1 });
    expect(options.unique).toBe(true);
    expect(options.name).toBe("email_unique");
  });
});
