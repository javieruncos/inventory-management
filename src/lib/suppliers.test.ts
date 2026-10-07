import { describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import mongoose, { Types } from "mongoose";
import { AppError, normalizeError } from "@/lib/errors";
import { connectDB } from "@/db/connection";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from "@/lib/suppliers";
import SupplierModel, { type Supplier } from "@/db/models/Supplier";
import ProductModel from "@/db/models/Product";
import { createSupplierSchema } from "@/schemas/supplier";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

describe("createSupplierSchema", () => {
  it("hace trim del name", () => {
    const result = createSupplierSchema.safeParse({ name: "  Acme  " });

    expect(result.success).toBe(true);
    expect(result.success && result.data.name).toBe("Acme");
  });

  it("rechaza un name vacío", () => {
    const result = createSupplierSchema.safeParse({ name: "" });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["name"],
        message: "El nombre es obligatorio",
      }),
    ]);
  });

  it("rechaza un name de 101 caracteres", () => {
    const result = createSupplierSchema.safeParse({ name: "a".repeat(101) });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["name"],
        message: "El nombre no puede superar 100 caracteres",
      }),
    ]);
  });

  it("acepta un name de 100 caracteres", () => {
    const result = createSupplierSchema.safeParse({ name: "a".repeat(100) });

    expect(result.success).toBe(true);
  });

  it("hace trim del email", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      email: "  user@example.com  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("user@example.com");
  });

  it("convierte un email vacío en undefined", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      email: "",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBeUndefined();
  });

  it("rechaza un email inválido", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      email: "no-email",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["email"],
        message: "Debe ser un email válido",
      }),
    ]);
  });

  it("rechaza un email de 255 caracteres", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      email: "a".repeat(250) + "@x.co",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["email"],
        message: "El email no puede superar 254 caracteres",
      }),
    ]);
  });

  it("conserva y trimea un phone válido", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      phone: "  +34 600 111 222  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.phone).toBe("+34 600 111 222");
  });

  it("convierte un phone vacío en undefined", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      phone: "",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.phone).toBeUndefined();
  });

  it("rechaza un campo desconocido active", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
      active: true,
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        code: "unrecognized_keys",
        keys: ["active"],
        path: [],
      }),
    ]);
    expect(normalizeError(result.error).issues).toEqual([
      {
        path: "",
        message: "Campo no permitido: active",
      },
    ]);
  });

  it("rechaza un campo desconocido deletedAt", () => {
    const result = createSupplierSchema.safeParse({
      name: "Acme",
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

describe("createSupplier", () => {
  it("crea un proveedor con solo name", async () => {
    const created = {
      _id: "64b000000000000000000010",
      name: "Acme",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Supplier;
    const createSpy = vi.spyOn(
      SupplierModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Supplier>) => Promise<Supplier>>;
    createSpy.mockResolvedValue(created);

    const result = await createSupplier({ name: "Acme" });

    expect(result).toBe(created);
    expect(createSpy).toHaveBeenCalledWith({
      name: "Acme",
      email: undefined,
      phone: undefined,
    });

    createSpy.mockRestore();
  });

  it("crea un proveedor con email y phone trimeados", async () => {
    const created = {
      _id: "64b000000000000000000010",
      name: "Acme SA",
      email: "contact@acme.com",
      phone: "+34 600 111 222",
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Supplier;
    const createSpy = vi.spyOn(
      SupplierModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Supplier>) => Promise<Supplier>>;
    createSpy.mockResolvedValue(created);

    const result = await createSupplier({
      name: "  Acme SA  ",
      email: "  contact@acme.com  ",
      phone: "  +34 600 111 222  ",
    });

    expect(result).toBe(created);
    expect(createSpy).toHaveBeenCalledWith({
      name: "Acme SA",
      email: "contact@acme.com",
      phone: "+34 600 111 222",
    });

    createSpy.mockRestore();
  });

  it("rechaza deletedAt antes de conectar a la base de datos", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await createSupplier({ name: "Acme", deletedAt: new Date() });
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
        message: "Campo no permitido: deletedAt",
      },
    ]);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un nombre duplicado con CONFLICT", async () => {
    const createSpy = vi.spyOn(
      SupplierModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Supplier>) => Promise<Supplier>>;
    createSpy.mockRejectedValue({
      code: 11000,
      keyPattern: { name: "Acme" },
    });

    let thrown: unknown;

    try {
      await createSupplier({ name: "Acme" });
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

  it("convierte una validación de Mongoose en VALIDATION", async () => {
    const invalidSupplier = new SupplierModel({});

    let validationError: unknown;

    try {
      await invalidSupplier.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const createSpy = vi.spyOn(
      SupplierModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Supplier>) => Promise<Supplier>>;
    createSpy.mockRejectedValue(validationError);

    let thrown: unknown;

    try {
      await createSupplier({ name: "Acme" });
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

  it("devuelve INTERNAL ante un error inesperado", async () => {
    const createSpy = vi.spyOn(
      SupplierModel,
      "create",
    ) as unknown as MockInstance<(doc: Partial<Supplier>) => Promise<Supplier>>;
    createSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await createSupplier({ name: "Acme" });
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

describe("listSuppliers", () => {
  it("lista proveedores activos ordenados por name ascendente", async () => {
    const docs = [{ _id: "64b000000000000000000017" } as unknown as Supplier];
    const sortSpy = vi.fn().mockResolvedValue(docs);
    const findSpy = vi.spyOn(SupplierModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Supplier[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    const result = await listSuppliers();

    expect(result).toBe(docs);
    expect(findSpy).toHaveBeenCalledWith({ deletedAt: null });
    expect(sortSpy).toHaveBeenCalledWith({ name: 1 });

    findSpy.mockRestore();
  });

  it("devuelve INTERNAL cuando la consulta de listado falla", async () => {
    const sortSpy = vi.fn().mockRejectedValue(new Error("db down"));
    const findSpy = vi.spyOn(SupplierModel, "find") as unknown as MockInstance<
      (filter?: unknown) => { sort: (order?: unknown) => Promise<Supplier[]> }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    let thrown: unknown;

    try {
      await listSuppliers();
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

describe("getSupplier", () => {
  it("obtiene un proveedor existente", async () => {
    const supplier = {
      _id: "64b000000000000000000011",
      name: "Acme",
      deletedAt: null,
    } as unknown as Supplier;
    const findOneSpy = vi.spyOn(
      SupplierModel,
      "findOne",
    ) as unknown as MockInstance<(filter?: unknown) => Promise<Supplier | null>>;
    findOneSpy.mockResolvedValue(supplier);

    const result = await getSupplier("64b000000000000000000011");

    expect(result).toBe(supplier);
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000011",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando el proveedor no existe o está eliminado", async () => {
    const findOneSpy = vi.spyOn(SupplierModel, "findOne").mockResolvedValue(null);

    let thrown: unknown;

    try {
      await getSupplier("64b000000000000000000012");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El proveedor no existe");
    expect(findOneSpy).toHaveBeenCalledWith({
      _id: "64b000000000000000000012",
      deletedAt: null,
    });

    findOneSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await getSupplier(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await getSupplier("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve INTERNAL cuando la consulta de getSupplier falla", async () => {
    const findOneSpy = vi
      .spyOn(SupplierModel, "findOne")
      .mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await getSupplier("64b000000000000000000012");
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

describe("updateSupplier", () => {
  it("actualiza name, email y phone con filtros y runValidators", async () => {
    const supplier = {
      _id: "64b000000000000000000013",
      name: "Acme SA",
      email: "contact@acme.com",
      phone: "+34 600 111 222",
    } as unknown as Supplier;
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(supplier);

    const result = await updateSupplier("64b000000000000000000013", {
      name: "  Acme SA  ",
      email: "  contact@acme.com  ",
      phone: "  +34 600 111 222  ",
    });

    expect(result).toBe(supplier);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000013", deletedAt: null },
      {
        name: "Acme SA",
        email: "contact@acme.com",
        phone: "+34 600 111 222",
      },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo el name", async () => {
    const supplier = {
      _id: "64b000000000000000000013",
      name: "Solo Nombre",
    } as unknown as Supplier;
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(supplier);

    const result = await updateSupplier("64b000000000000000000013", {
      name: "  Solo Nombre  ",
    });

    expect(result).toBe(supplier);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000013", deletedAt: null },
      { name: "Solo Nombre" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo el email", async () => {
    const supplier = {
      _id: "64b000000000000000000013",
      email: "a@b.co",
    } as unknown as Supplier;
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(supplier);

    const result = await updateSupplier("64b000000000000000000013", {
      email: "  a@b.co  ",
    });

    expect(result).toBe(supplier);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000013", deletedAt: null },
      { email: "a@b.co" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("actualiza parcialmente solo el phone", async () => {
    const supplier = {
      _id: "64b000000000000000000013",
      phone: "600 111 222",
    } as unknown as Supplier;
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(supplier);

    const result = await updateSupplier("64b000000000000000000013", {
      phone: "  600 111 222  ",
    });

    expect(result).toBe(supplier);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000013", deletedAt: null },
      { phone: "600 111 222" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un ID que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await updateSupplier(1 as unknown as string, { name: "Acme" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await updateSupplier("no-es-un-id", { name: "Acme" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve NOT_FOUND cuando el proveedor no existe o está eliminado", async () => {
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000014", { name: "Nuevo nombre" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El proveedor no existe");
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000014", deletedAt: null },
      { name: "Nuevo nombre" },
      { new: true, runValidators: true },
    );

    updateSpy.mockRestore();
  });

  it("rechaza un objeto vacío", async () => {
    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", {});
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
      await updateSupplier("64b000000000000000000013", { active: true });
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

  it("rechaza un email vacío sin poder limpiar el campo", async () => {
    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", { email: "" });
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

  it("rechaza un phone vacío sin poder limpiar el campo", async () => {
    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", { phone: "" });
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

  it("rechaza un nombre duplicado con CONFLICT", async () => {
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockRejectedValue({
      code: 11000,
      keyPattern: { name: "Acme" },
    });

    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", { name: "Acme" });
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

  it("convierte una validación de Mongoose en VALIDATION", async () => {
    const invalidSupplier = new SupplierModel({});

    let validationError: unknown;

    try {
      await invalidSupplier.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockRejectedValue(validationError);

    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", { name: "Acme" });
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

  it("devuelve INTERNAL ante un error inesperado", async () => {
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await updateSupplier("64b000000000000000000013", { name: "Acme" });
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

describe("deleteSupplier", () => {
  it("realiza un soft delete con deletedAt", async () => {
    const supplier = {
      _id: "64b000000000000000000015",
      name: "Acme",
      deletedAt: new Date(),
    } as unknown as Supplier;
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(supplier);

    const result = await deleteSupplier("64b000000000000000000015");

    expect(result).toBe(supplier);
    expect(existsSpy).toHaveBeenCalledWith({
      supplierId: "64b000000000000000000015",
      deletedAt: null,
    });
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000015", deletedAt: null },
      { deletedAt: expect.any(Date) },
      { new: true },
    );

    existsSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("devuelve NOT_FOUND cuando el proveedor no existe o está eliminado", async () => {
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockResolvedValue(null);
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteSupplier("64b000000000000000000016");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El proveedor no existe");
    expect(existsSpy).toHaveBeenCalledWith({
      supplierId: "64b000000000000000000016",
      deletedAt: null,
    });
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "64b000000000000000000016", deletedAt: null },
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
      await deleteSupplier(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un ID malformado", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await deleteSupplier("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve CONFLICT cuando el proveedor está en uso por productos", async () => {
    const existsSpy = vi.spyOn(ProductModel, "exists").mockResolvedValue({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    });
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteSupplier("64b000000000000000000015");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("El proveedor está en uso por productos");
    expect(existsSpy).toHaveBeenCalledWith({
      supplierId: "64b000000000000000000015",
      deletedAt: null,
    });
    expect(updateSpy).not.toHaveBeenCalled();

    existsSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it("da precedencia al guard de productos antes del NOT_FOUND", async () => {
    const existsSpy = vi.spyOn(ProductModel, "exists").mockResolvedValue({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    });
    const updateSpy = vi.spyOn(
      SupplierModel,
      "findOneAndUpdate",
    ) as unknown as MockInstance<
      (
        filter?: unknown,
        update?: unknown,
        options?: unknown,
      ) => Promise<Supplier | null>
    >;
    updateSpy.mockResolvedValue(null);

    let thrown: unknown;

    try {
      await deleteSupplier("64b000000000000000000016");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe("El proveedor está en uso por productos");
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
      await deleteSupplier("64b000000000000000000015");
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
