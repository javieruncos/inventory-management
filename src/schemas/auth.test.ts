import { describe, expect, it } from "vitest";
import { loginSchema } from "@/schemas/auth";

describe("loginSchema", () => {
  it("normaliza el email y conserva la contraseña exactamente", () => {
    const result = loginSchema.parse({
      email: "  ADMIN@Example.COM  ",
      password: "  secreta con espacios  ",
    });

    expect(result).toEqual({
      email: "admin@example.com",
      password: "  secreta con espacios  ",
    });
  });

  it("rechaza un email inválido", () => {
    const result = loginSchema.safeParse({
      email: "no-es-un-email",
      password: "secreto",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["email"],
          message: "El email no es válido",
        }),
      ]);
    }
  });

  it("rechaza una contraseña vacía", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["password"],
          message: "La contraseña es obligatoria",
        }),
      ]);
    }
  });

  it("rechaza campos adicionales", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "secreto",
      role: "admin",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          code: "unrecognized_keys",
          keys: ["role"],
        }),
      ]);
    }
  });

  it("rechaza emails que superan el máximo permitido", () => {
    const result = loginSchema.safeParse({
      email: `${"a".repeat(245)}@example.com`,
      password: "secreto",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["email"],
          message: "El email no puede superar 254 caracteres",
        }),
      ]);
    }
  });

  it("rechaza contraseñas excesivamente largas", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "a".repeat(1025),
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["password"],
          message: "La contraseña es demasiado larga",
        }),
      ]);
    }
  });

  it("rechaza valores que no son strings", () => {
    const result = loginSchema.safeParse({
      email: 123,
      password: null,
    });

    expect(result.success).toBe(false);
  });
});
