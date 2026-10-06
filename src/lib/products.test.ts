import { describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { Types } from "mongoose";
import { AppError } from "@/lib/errors";
import { createProduct } from "@/lib/products";
import CategoryModel from "@/db/models/Category";
import SupplierModel from "@/db/models/Supplier";
import ProductModel, { type Product } from "@/db/models/Product";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

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

  it("rechaza un categoryId con formato inválido", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-4",
        price: 100,
        categoryId: "no-es-un-objectid",
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
        path: "categoryId",
        message: "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
      },
    ]);
  });

  it("rechaza un minimumStock no entero", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-5",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
        minimumStock: 1.5,
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
        path: "minimumStock",
        message: "minimumStock debe ser un número entero",
      },
    ]);
  });

  it("rechaza un sku vacío", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "",
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
        path: "sku",
        message: "El SKU es obligatorio",
      },
    ]);
  });

  it("rechaza una categoría inexistente con NOT_FOUND", async () => {
    const existsSpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue(null);

    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-7",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("La categoría no existe");
    expect(result.issues).toEqual([
      {
        path: "categoryId",
        message: "La categoría no existe",
      },
    ]);
    expect(existsSpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      deletedAt: null,
    });

    existsSpy.mockRestore();
  });

  it("crea un producto con currentStock inicial en 0", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const created = {
      _id: "64b000000000000000000001",
      name: "Producto de prueba",
      sku: "SKU-TEST-8",
      price: 100,
      currentStock: 0,
      minimumStock: 0,
      categoryId: "507f1f77bcf86cd799439011",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Product;
    const createSpy = vi.spyOn(ProductModel, "create") as unknown as MockInstance<
      (doc: Partial<Product>) => Promise<Product>
    >;
    createSpy.mockResolvedValue(created);

    const result = await createProduct({
      name: "Producto de prueba",
      sku: "SKU-TEST-8",
      price: 100,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: "",
    });

    expect(result).toBe(created);
    expect(createSpy).toHaveBeenCalledWith({
      name: "Producto de prueba",
      sku: "SKU-TEST-8",
      description: undefined,
      price: 100,
      minimumStock: undefined,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: undefined,
      currentStock: 0,
    });

    categorySpy.mockRestore();
    createSpy.mockRestore();
  });

  it("rechaza un proveedor inexistente con NOT_FOUND", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const supplierSpy = vi
      .spyOn(SupplierModel, "exists")
      .mockResolvedValue(null);

    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-9",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
        supplierId: "507f1f77bcf86cd799439012",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El proveedor no existe");
    expect(result.issues).toEqual([
      {
        path: "supplierId",
        message: "El proveedor no existe",
      },
    ]);
    expect(supplierSpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439012",
      deletedAt: null,
    });

    categorySpy.mockRestore();
    supplierSpy.mockRestore();
  });

  it("rechaza un supplierId con formato inválido", async () => {
    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-10",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
        supplierId: "no-es-un-oid",
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
        path: "supplierId",
        message: "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
      },
    ]);
  });
});
