import { describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import mongoose, { Types } from "mongoose";
import { AppError } from "@/lib/errors";
import { connectDB } from "@/db/connection";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "@/lib/products";
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

  it("rechaza un SKU duplicado con CONFLICT", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const createSpy = vi.spyOn(
      ProductModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Product>) => Promise<Product>>;
    createSpy.mockRejectedValue({
      code: 11000,
      keyPattern: { sku: "SKU-TEST-11" },
    });

    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-11",
        price: 100,
        categoryId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("El SKU ya existe");
    expect(result.issues).toEqual([
      {
        path: "sku",
        message: "El SKU ya existe",
      },
    ]);

    categorySpy.mockRestore();
    createSpy.mockRestore();
  });

  it("convierte una validación de Mongoose en VALIDATION", async () => {
    const invalidProduct = new ProductModel({
      name: "Producto de prueba",
      sku: "SKU-TEST-12",
      price: -1,
      categoryId: "507f1f77bcf86cd799439011",
    });

    let validationError: unknown;

    try {
      await invalidProduct.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const createSpy = vi.spyOn(
      ProductModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Product>) => Promise<Product>>;
    createSpy.mockRejectedValue(validationError);

    let thrown: unknown;

    try {
      await createProduct({
        name: "Producto de prueba",
        sku: "SKU-TEST-12",
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
        path: "price",
        message: "Path `price` (-1) is less than minimum allowed value (0).",
      },
    ]);

    categorySpy.mockRestore();
    createSpy.mockRestore();
  });

  it("crea un producto con supplierId de proveedor existente", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const supplierSpy = vi
      .spyOn(SupplierModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439012") });
    const created = {
      _id: "64b000000000000000000002",
      name: "Producto de prueba",
      sku: "SKU-TEST-13",
      price: 100,
      currentStock: 0,
      minimumStock: 0,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: "507f1f77bcf86cd799439012",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Product;
    const createSpy = vi.spyOn(
      ProductModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Product>) => Promise<Product>>;
    createSpy.mockResolvedValue(created);

    const result = await createProduct({
      name: "Producto de prueba",
      sku: "SKU-TEST-13",
      price: 100,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: "507f1f77bcf86cd799439012",
    });

    expect(result).toBe(created);
    expect(supplierSpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439012",
      deletedAt: null,
    });
    expect(createSpy).toHaveBeenCalledWith({
      name: "Producto de prueba",
      sku: "SKU-TEST-13",
      description: undefined,
      price: 100,
      minimumStock: undefined,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: "507f1f77bcf86cd799439012",
      currentStock: 0,
    });

    categorySpy.mockRestore();
    supplierSpy.mockRestore();
    createSpy.mockRestore();
  });
});

describe("listProducts", () => {
  it("lista productos activos ordenados por createdAt descendente", async () => {
    const docs = [{ _id: "64b000000000000000000003" } as unknown as Product];
    const sortSpy = vi.fn().mockResolvedValue(docs);
    const findSpy = vi.spyOn(ProductModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Product[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    const result = await listProducts();

    expect(result).toBe(docs);
    expect(findSpy).toHaveBeenCalledWith({ deletedAt: null });
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });

    findSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la consulta de listado falla", async () => {
    const sortSpy = vi.fn().mockRejectedValue(new Error("db down"));
    const findSpy = vi.spyOn(ProductModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Product[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    let thrown: unknown;

    try {
      await listProducts();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    findSpy.mockRestore();
  });
});

describe("getProduct", () => {
  it("obtiene un producto existente", async () => {
    const product = {
      _id: "64b000000000000000000004",
      name: "Producto",
      sku: "SKU-GET-1",
      price: 100,
    } as unknown as Product;
    const findOneSpy = vi.spyOn(
      ProductModel,
      "findOne",
    ) as unknown as MockInstance<(filter?: unknown) => Promise<Product | null>>;
    findOneSpy.mockResolvedValue(product);

    const result = await getProduct("64b000000000000000000004");

    expect(result).toBe(product);
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000004",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando el producto no existe o está eliminado", async () => {
    const findOneSpy = vi
      .spyOn(ProductModel, "findOne")
      .mockResolvedValue(null);

    let thrown: unknown;

    try {
      await getProduct("64b000000000000000000005");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El producto no existe");
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000005",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await getProduct(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID string malformado con CastError", async () => {
    let thrown: unknown;

    try {
      await getProduct("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Valor con formato inválido");
    expect(result.issues).toEqual([
      {
        path: "_id",
        message: "El valor de _id no es válido",
      },
    ]);
  });

  it("devuelve INTERNAL cuando la consulta de getProduct falla", async () => {
    const findOneSpy = vi
      .spyOn(ProductModel, "findOne")
      .mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await getProduct("64b000000000000000000006");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    findOneSpy.mockRestore();
  });
});

describe("updateProduct", () => {
  it("actualiza todos los campos con filtros y runValidators", async () => {
    const product = {
      _id: "64b000000000000000000007",
      name: "Producto actualizado",
    } as unknown as Product;
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const supplierSpy = vi
      .spyOn(SupplierModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439012") });
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue(product);

    const result = await updateProduct("64b000000000000000000007", {
      name: "  Producto actualizado  ",
      sku: "  sku-new-1  ",
      description: "  Descripción nueva  ",
      price: 150,
      minimumStock: 5,
      categoryId: "507f1f77bcf86cd799439011",
      supplierId: "507f1f77bcf86cd799439012",
    });

    expect(result).toBe(product);
    expect(categorySpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      deletedAt: null,
    });
    expect(supplierSpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439012",
      deletedAt: null,
    });
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000007", deletedAt: null },
      {
        name: "Producto actualizado",
        sku: "SKU-NEW-1",
        description: "Descripción nueva",
        price: 150,
        minimumStock: 5,
        categoryId: "507f1f77bcf86cd799439011",
        supplierId: "507f1f77bcf86cd799439012",
      },
      { new: true, runValidators: true },
    );

    categorySpy.mockRestore();
    supplierSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo el nombre", async () => {
    const product = {
      _id: "64b000000000000000000007",
      name: "Solo nombre",
    } as unknown as Product;
    const categorySpy = vi.spyOn(CategoryModel, "exists");
    const supplierSpy = vi.spyOn(SupplierModel, "exists");
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue(product);

    const result = await updateProduct("64b000000000000000000007", {
      name: "  Solo nombre  ",
    });

    expect(result).toBe(product);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000007", deletedAt: null },
      { name: "Solo nombre" },
      { new: true, runValidators: true },
    );
    expect(categorySpy).not.toHaveBeenCalled();
    expect(supplierSpy).not.toHaveBeenCalled();

    categorySpy.mockRestore();
    supplierSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    let thrown: unknown;

    try {
      await updateProduct(1 as unknown as string, { name: "Nuevo nombre" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
  });

  it("rechaza un ID string malformado con CastError", async () => {
    let thrown: unknown;

    try {
      await updateProduct("no-es-un-id", { name: "  Nuevo nombre  " });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Valor con formato inválido");
    expect(result.issues).toEqual([
      {
        path: "_id",
        message: "El valor de _id no es válido",
      },
    ]);
  });

  it("devuelve NOT_FOUND cuando el producto no existe o está eliminado", async () => {
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000009", { name: "Nuevo nombre" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El producto no existe");
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000009", deletedAt: null },
      { name: "Nuevo nombre" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un objeto vacío", async () => {
    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", {});
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
        message: "Debe enviar al menos un campo a actualizar",
      },
    ]);
  });

  it("rechaza un campo desconocido", async () => {
    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", { active: true });
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
        message: "Campo no permitido: active",
      },
      {
        path: "",
        message: "Debe enviar al menos un campo a actualizar",
      },
    ]);
  });

  it("devuelve NOT_FOUND cuando la categoría no existe", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;

    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", {
        name: "Nuevo nombre",
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
    expect(updateSpy).not.toHaveBeenCalled();

    categorySpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando el proveedor no existe", async () => {
    const categorySpy = vi
      .spyOn(CategoryModel, "exists")
      .mockResolvedValue({ _id: new Types.ObjectId("507f1f77bcf86cd799439011") });
    const supplierSpy = vi
      .spyOn(SupplierModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;

    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", {
        name: "Nuevo nombre",
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
    expect(updateSpy).not.toHaveBeenCalled();

    categorySpy.mockRestore();
    supplierSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("ignora un supplierId vacío", async () => {
    const supplierSpy = vi.spyOn(SupplierModel, "exists");
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue({
      _id: "64b000000000000000000007",
      name: "Nuevo nombre",
    } as unknown as Product);

    const result = await updateProduct("64b000000000000000000007", {
      name: "  Nuevo nombre  ",
      supplierId: "",
    });

    expect(result).not.toBeNull();
    expect(supplierSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000007", deletedAt: null },
      { name: "Nuevo nombre" },
      { new: true, runValidators: true },
    );

    supplierSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("rechaza un SKU duplicado con CONFLICT", async () => {
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockRejectedValue({
      code: 11000,
      keyPattern: { sku: "SKU-TEST-23" },
    });

    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", {
        sku: "SKU-TEST-23",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("El SKU ya existe");
    expect(result.issues).toEqual([
      {
        path: "sku",
        message: "El SKU ya existe",
      },
    ]);

    updateSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la actualización falla", async () => {
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await updateProduct("64b000000000000000000007", { name: "Nuevo nombre" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    updateSpy.mockRestore();
  });
});

describe("deleteProduct", () => {
  it("realiza un soft delete con deletedAt", async () => {
    const product = {
      _id: "64b000000000000000000008",
      name: "Producto eliminado",
    } as unknown as Product;
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue(product);

    const result = await deleteProduct("64b000000000000000000008");

    expect(result).toBe(product);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000008", deletedAt: null },
      { deletedAt: expect.any(Date) },
      { new: true },
    );

    updateSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando el producto no existe o está eliminado", async () => {
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteProduct("64b000000000000000000009");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El producto no existe");
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000009", deletedAt: null },
      { deletedAt: expect.any(Date) },
      { new: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    let thrown: unknown;

    try {
      await deleteProduct(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
  });

  it("rechaza un ID string malformado con CastError", async () => {
    let thrown: unknown;

    try {
      await deleteProduct("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Valor con formato inválido");
    expect(result.issues).toEqual([
      {
        path: "_id",
        message: "El valor de _id no es válido",
      },
    ]);
  });

  it("devuelve INTERNAL cuando la eliminación falla", async () => {
    const updateSpy = vi.spyOn(
      ProductModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Product | null>
    >;
    updateSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await deleteProduct("64b000000000000000000008");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    updateSpy.mockRestore();
  });
});
