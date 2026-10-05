import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createProductSchema } from "@/schemas/product";
import { AppError, normalizeError } from "@/lib/errors";

describe("normalizeError", () => {
  it("convierte un ZodError en AppError kind VALIDATION", () => {
    let thrown: unknown;

    try {
      createProductSchema.parse({
        name: "Producto",
        sku: "SKU-TEST-1",
        price: -1,
        categoryId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(z.ZodError);

    const result = normalizeError(thrown);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      { path: "price", message: "El precio no puede ser negativo" },
    ]);
    expect(result.cause).toBe(thrown);
  });

  it("convierte un error E11000 de SKU duplicado en AppError kind CONFLICT", () => {
    const duplicateKeyError = {
      code: 11000,
      keyPattern: { sku: 1 },
    };

    const result = normalizeError(duplicateKeyError);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("El SKU ya existe");
    expect(result.issues).toEqual([
      { path: "sku", message: "El SKU ya existe" },
    ]);
    expect(result.cause).toBe(duplicateKeyError);
  });
});
