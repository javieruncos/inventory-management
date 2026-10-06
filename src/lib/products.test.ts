import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { createProduct } from "@/lib/products";

describe("createProduct", () => {
  it("rechaza currentStock como campo no permitido", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-1",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
        currentStock: 5,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "",
        message: "Campo no permitido: currentStock",
      },
    ]);
  });

  it("rechaza un precio negativo", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-2",
        price: -1,
        categoryId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "price",
        message: "El precio no puede ser negativo",
      },
    ]);
  });

  it("rechaza un nombre vacío", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "",
        sku: "SKU-TEST-3",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "name",
        message: "El nombre es obligatorio",
      },
    ]);
  });
});
