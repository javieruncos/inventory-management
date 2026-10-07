import { describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import mongoose, { Types } from "mongoose";
import { AppError, normalizeError } from "@/lib/errors";
import { connectDB } from "@/db/connection";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "@/lib/categories";
import CategoryModel, { type Category } from "@/db/models/Category";
import ProductModel from "@/db/models/Product";
import { createCategorySchema } from "@/schemas/category";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

describe("createCategorySchema", () => {
  it("hace trim del name", () => {
    const result = createCategorySchema.safeParse({
      name: "  Tecnología  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.name).toBe("Tecnología");
  });

  it("acepta un name de 100 caracteres", () => {
    const result = createCategorySchema.safeParse({ name: "a".repeat(100) });

    expect(result.success).toBe(true);
  });

  it("hace trim de la description", () => {
    const result = createCategorySchema.safeParse({
      name: "Tecnología",
      description: "  Una descripción  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.description).toBe(
      "Una descripción",
    );
  });

  it("acepta una description de 2000 caracteres", () => {
    const result = createCategorySchema.safeParse({
      name: "Tecnología",
      description: "d".repeat(2000),
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un campo desconocido deletedAt", () => {
    const result = createCategorySchema.safeParse({
      name: "Tecnología",
      deletedAt: new Date(),
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        code: "unrecognized_keys",
        keys: ["deletedAt"],
        path: [],
      }),
    ]);
    expect(normalizeError(result.error).issues).toEqual([
      {
        path: "",
        message: "Campo no permitido: deletedAt",
      },
    ]);
  });
});

describe("createCategory", () => {
  it("rechaza un campo no permitido", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "Tecnología",
        active: true,
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
        message: "Campo no permitido: active",
      },
    ]);
  });

  it("rechaza un nombre vacío", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "",
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

  it("rechaza un nombre mayor a 100 caracteres", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "a".repeat(101),
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
        message: "El nombre no puede superar 100 caracteres",
      },
    ]);
  });

  it("rechaza una descripción mayor a 2000 caracteres", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "Tecnología",
        description: "d".repeat(2001),
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
        path: "description",
        message: "La descripción no puede superar 2000 caracteres",
      },
    ]);
  });

  it("crea una categoría con payload mínimo", async () => {
    const created = {
      _id: "64b000000000000000000040",
      name: "Tecnología",
      deletedAt: null,
    } as unknown as Category;
    const createSpy = vi.spyOn(
      CategoryModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Category>) => Promise<Category>>;
    createSpy.mockResolvedValue(created);

    const result = await createCategory({ name: "Tecnología" });

    expect(result).toBe(created);
    expect(createSpy).toHaveBeenCalledWith({
      name: "Tecnología",
      description: undefined,
    });

    createSpy.mockRestore();
  });

  it("crea una categoría con description trimeada", async () => {
    const created = {
      _id: "64b000000000000000000040",
      name: "Tecnología",
      description: "Electrónica y más",
      deletedAt: null,
    } as unknown as Category;
    const createSpy = vi.spyOn(
      CategoryModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Category>) => Promise<Category>>;
    createSpy.mockResolvedValue(created);

    const result = await createCategory({
      name: "  Tecnología  ",
      description: "  Electrónica y más  ",
    });

    expect(result).toBe(created);
    expect(createSpy).toHaveBeenCalledWith({
      name: "Tecnología",
      description: "Electrónica y más",
    });

    createSpy.mockRestore();
  });

  it("devuelve CONFLICT cuando el nombre ya está en uso", async () => {
    const createSpy = vi.spyOn(
      CategoryModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Category>) => Promise<Category>>;
    createSpy.mockRejectedValue({ code: 11000, keyPattern: { name: 1 } });

    let thrown: unknown;

    try {
      await createCategory({ name: "Tecnología" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("Ese nombre ya está en uso");
    expect(result.issues).toEqual([
      {
        path: "name",
        message: "Ese nombre ya está en uso",
      },
    ]);

    createSpy.mockRestore();
  });

  it("devuelve VALIDATION cuando Mongoose rechaza el documento", async () => {
    const invalidCategory = new CategoryModel({});
    let validationError: unknown;

    try {
      await invalidCategory.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const createSpy = vi.spyOn(
      CategoryModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Category>) => Promise<Category>>;
    createSpy.mockRejectedValue(validationError);

    let thrown: unknown;

    try {
      await createCategory({ name: "Tecnología" });
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
        message: "Path `name` is required.",
      },
    ]);

    createSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la creación falla", async () => {
    const createSpy = vi.spyOn(
      CategoryModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Category>) => Promise<Category>>;
    createSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await createCategory({ name: "Tecnología" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    createSpy.mockRestore();
  });
});

describe("listCategories", () => {
  it("lista categorías activas ordenadas por name ascendente", async () => {
    const docs = [
      { _id: "64b000000000000000000041" } as unknown as Category,
    ];
    const sortSpy = vi.fn().mockResolvedValue(docs);
    const findSpy = vi.spyOn(CategoryModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Category[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    const result = await listCategories();

    expect(result).toBe(docs);
    expect(findSpy).toHaveBeenCalledWith({ deletedAt: null });
    expect(sortSpy).toHaveBeenCalledWith({ name: 1 });

    findSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la consulta de listado falla", async () => {
    const sortSpy = vi.fn().mockRejectedValue(new Error("db down"));
    const findSpy = vi.spyOn(CategoryModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Category[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    let thrown: unknown;

    try {
      await listCategories();
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

describe("getCategory", () => {
  it("obtiene una categoría existente", async () => {
    const category = {
      _id: "64b000000000000000000042",
      name: "Tecnología",
      deletedAt: null,
    } as unknown as Category;
    const findOneSpy = vi.spyOn(
      CategoryModel,
      "findOne",
    ) as unknown as MockInstance<(filter?: unknown) => Promise<Category | null>>;
    findOneSpy.mockResolvedValue(category);

    const result = await getCategory("64b000000000000000000042");

    expect(result).toBe(category);
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000042",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando la categoría no existe o está eliminada", async () => {
    const findOneSpy = vi.spyOn(CategoryModel, "findOne").mockResolvedValue(null);

    let thrown: unknown;

    try {
      await getCategory("64b000000000000000000042");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("La categoría no existe");
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000042",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await getCategory(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado con CastError de la query real", async () => {
    let thrown: unknown;

    try {
      await getCategory("no-es-un-id");
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

  it("devuelve INTERNAL cuando la consulta de getCategory falla", async () => {
    const findOneSpy = vi
      .spyOn(CategoryModel, "findOne")
      .mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await getCategory("64b000000000000000000042");
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

describe("updateCategory", () => {
  it("actualiza name y description con trim y filtros completos", async () => {
    const category = {
      _id: "64b000000000000000000043",
      name: "Tecnología",
      description: "Nueva descripción",
      deletedAt: null,
    } as unknown as Category;
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(category);

    const result = await updateCategory("64b000000000000000000043", {
      name: "  Tecnología  ",
      description: "  Nueva descripción  ",
    });

    expect(result).toBe(category);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000043", deletedAt: null },
      { name: "Tecnología", description: "Nueva descripción" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo name", async () => {
    const category = {
      _id: "64b000000000000000000043",
      name: "Solo nombre",
      deletedAt: null,
    } as unknown as Category;
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(category);

    const result = await updateCategory("64b000000000000000000043", {
      name: "Solo nombre",
    });

    expect(result).toBe(category);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000043", deletedAt: null },
      { name: "Solo nombre" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo description con trim", async () => {
    const category = {
      _id: "64b000000000000000000043",
      description: "Solo descripción",
      deletedAt: null,
    } as unknown as Category;
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(category);

    const result = await updateCategory("64b000000000000000000043", {
      description: "  Solo descripción  ",
    });

    expect(result).toBe(category);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000043", deletedAt: null },
      { description: "Solo descripción" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await updateCategory(1 as unknown as string, { name: "Tecnología" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado con CastError de la query real", async () => {
    let thrown: unknown;

    try {
      await updateCategory("no-es-un-id", { name: "Tecnología" });
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

  it("devuelve NOT_FOUND cuando la categoría no existe o está eliminada", async () => {
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", {
        name: "Solo nombre",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("La categoría no existe");
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000043", deletedAt: null },
      { name: "Solo nombre" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un payload vacío con una sola issue del refine", async () => {
    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", {});
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

  it("rechaza un campo desconocido con dos issues", async () => {
    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", { active: true });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toHaveLength(2);
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

  it("devuelve CONFLICT cuando el nombre ya está en uso", async () => {
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockRejectedValue({ code: 11000, keyPattern: { name: 1 } });

    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", {
        name: "Tecnología",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("Ese nombre ya está en uso");
    expect(result.issues).toEqual([
      {
        path: "name",
        message: "Ese nombre ya está en uso",
      },
    ]);

    updateSpy.mockRestore();
  });

  it("devuelve VALIDATION cuando Mongoose rechaza el documento", async () => {
    const invalidCategory = new CategoryModel({});
    let validationError: unknown;

    try {
      await invalidCategory.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockRejectedValue(validationError);

    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", {
        name: "Tecnología",
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
        message: "Path `name` is required.",
      },
    ]);

    updateSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la actualización falla", async () => {
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await updateCategory("64b000000000000000000043", {
        name: "Tecnología",
      });
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

describe("deleteCategory", () => {
  it("realiza un soft delete con deletedAt verificando ambos filtros", async () => {
    const category = {
      _id: "64b000000000000000000044",
      name: "Tecnología",
      deletedAt: new Date(),
    } as unknown as Category;
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(category);

    const result = await deleteCategory("64b000000000000000000044");

    expect(result).toBe(category);
    expect(existsSpy).toHaveBeenCalledWith({
      categoryId: "64b000000000000000000044",
      deletedAt: null,
    });
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000044", deletedAt: null },
      { deletedAt: expect.any(Date) },
      { new: true },
    );

    existsSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando la categoría no existe o está eliminada", async () => {
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteCategory("64b000000000000000000044");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("La categoría no existe");
    expect(existsSpy).toHaveBeenCalledWith({
      categoryId: "64b000000000000000000044",
      deletedAt: null,
    });
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000044", deletedAt: null },
      { deletedAt: expect.any(Date) },
      { new: true },
    );

    existsSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await deleteCategory(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID debe ser una cadena de texto");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado con CastError sobre categoryId", async () => {
    let thrown: unknown;

    try {
      await deleteCategory("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Valor con formato inválido");
    expect(result.issues).toEqual([
      {
        path: "categoryId",
        message: "El valor de categoryId no es válido",
      },
    ]);
  });

  it("devuelve CONFLICT cuando la categoría está en uso por productos", async () => {
    const existsSpy = vi.spyOn(ProductModel, "exists").mockResolvedValue({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    });
    const updateSpy = vi.spyOn(
      CategoryModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Category | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteCategory("64b000000000000000000044");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("La categoría está en uso por productos");
    expect(result.issues).toBeUndefined();
    expect(existsSpy).toHaveBeenCalledWith({
      categoryId: "64b000000000000000000044",
      deletedAt: null,
    });
    expect(updateSpy).not.toHaveBeenCalled();

    existsSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la verificación de productos falla", async () => {
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await deleteCategory("64b000000000000000000044");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");

    existsSpy.mockRestore();
  });
});
