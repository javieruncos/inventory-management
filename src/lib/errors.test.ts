import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { z } from "zod";
import { createProductSchema } from "@/schemas/product";
import ProductModel from "@/db/models/Product";
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

  it("convierte un mongoose.ValidationError en AppError kind VALIDATION", async () => {
    const product = new ProductModel({
      name: "Producto",
      sku: "SKU-TEST-1",
      price: -1,
      categoryId: "507f1f77bcf86cd799439011",
    });

    let thrown: unknown;

    try {
      await product.validate();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(mongoose.Error.ValidationError);

    const result = normalizeError(thrown);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "price",
        message:
          "Path `price` (-1) is less than minimum allowed value (0).",
      },
    ]);
    expect(result.cause).toBe(thrown);
  });
});
