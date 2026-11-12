import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { z } from "zod";
import { createProductSchema } from "@/schemas/product";
import ProductModel from "@/db/models/Product";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { InvalidCredentialsError } from "@/lib/auth/auth-service";
import { JwtConfigurationError } from "@/lib/auth/jwt";
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

  it("convierte un mongoose.CastError en AppError kind VALIDATION", () => {
    let thrown: unknown;

    try {
      ProductModel.findOne({ _id: "no-es-un-id" }).cast(ProductModel);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(mongoose.Error.CastError);

    const result = normalizeError(thrown);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Valor con formato inválido");
    expect(result.issues).toEqual([
      { path: "_id", message: "El valor de _id no es válido" },
    ]);
    expect(result.cause).toBe(thrown);
  });

  it("conserva AuthenticationRequiredError como UNAUTHORIZED", () => {
    const error = new AuthenticationRequiredError();

    expect(normalizeError(error)).toBe(error);
    expect(error).toMatchObject({
      kind: "UNAUTHORIZED",
      status: 401,
      message: "No autenticado",
    });
  });

  it("conserva ForbiddenError como FORBIDDEN", () => {
    const error = new ForbiddenError();

    expect(normalizeError(error)).toBe(error);
    expect(error).toMatchObject({
      kind: "FORBIDDEN",
      status: 403,
      message: "No autorizado",
    });
  });

  it("conserva InvalidCredentialsError como UNAUTHORIZED", () => {
    const error = new InvalidCredentialsError();

    expect(normalizeError(error)).toBe(error);
    expect(error).toMatchObject({
      kind: "UNAUTHORIZED",
      status: 401,
      message: "Credenciales inválidas",
    });
  });

  it("convierte un error desconocido en AppError kind INTERNAL", () => {
    const unknownError = new Error("Algo inesperado ocurrió");

    const result = normalizeError(unknownError);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");
    expect(result.cause).toBe(unknownError);
  });

  it("convierte JwtConfigurationError en INTERNAL sin exponer el secreto", () => {
    const configError = new JwtConfigurationError(
      "JWT_SECRET debe tener al menos 32 caracteres",
    );

    const result = normalizeError(configError);

    expect(result).toBeInstanceOf(AppError);
    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");
    expect(result.cause).toBe(configError);
  });
});
