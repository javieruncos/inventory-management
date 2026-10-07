import { describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { Types } from "mongoose";
import { AppError, normalizeError } from "@/lib/errors";
import { connectDB } from "@/db/connection";
import { createMovement, listMovements } from "@/lib/stock";
import ProductModel, { type Product } from "@/db/models/Product";
import StockMovementModel, {
  type StockMovement,
} from "@/db/models/StockMovement";
import { createStockMovementSchema } from "@/schemas/stockMovement";

vi.mock("@/db/connection", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

describe("createStockMovementSchema", () => {
  it("acepta un movimiento IN válido con productId y reason con espacios", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "  507f1f77bcf86cd799439011  ",
      type: "IN",
      quantity: 5,
      reason: "  Reposición de mercadería  ",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.productId).toBe(
      "507f1f77bcf86cd799439011",
    );
    expect(result.success && result.data.type).toBe("IN");
    expect(result.success && result.data.reason).toBe(
      "Reposición de mercadería",
    );
  });

  it("acepta un movimiento OUT válido", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "OUT",
      quantity: 2,
      reason: "Venta en tienda",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.type).toBe("OUT");
  });

  it("rechaza un productId malformado", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "no-es-un-id",
      type: "IN",
      quantity: 5,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["productId"],
        message: "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
      }),
    ]);
  });

  it("rechaza un productId ausente con el mensaje default de Zod", () => {
    const result = createStockMovementSchema.safeParse({
      type: "IN",
      quantity: 5,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["productId"],
        message: "Invalid input: expected string, received undefined",
      }),
    ]);
  });

  it("rechaza un type inválido", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "X",
      quantity: 5,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["type"],
        message: "El tipo debe ser IN o OUT",
      }),
    ]);
  });

  it("rechaza un type ausente con el mensaje del enum", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      quantity: 5,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["type"],
        message: "El tipo debe ser IN o OUT",
      }),
    ]);
  });

  it("rechaza una quantity de 0", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 0,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["quantity"],
        message: "quantity debe ser mayor que 0",
      }),
    ]);
  });

  it("rechaza una quantity no entera", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 1.5,
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["quantity"],
        message: "quantity debe ser un número entero",
      }),
    ]);
  });

  it("rechaza una quantity ausente con el mensaje default de Zod", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      reason: "Compra",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["quantity"],
        message: "Invalid input: expected number, received undefined",
      }),
    ]);
  });

  it("rechaza un reason vacío o de solo espacios", () => {
    const empty = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "",
    });

    expect(empty.success).toBe(false);

    if (empty.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(empty.error.issues).toEqual([
      expect.objectContaining({
        path: ["reason"],
        message: "El motivo es obligatorio",
      }),
    ]);

    const spaces = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "   ",
    });

    expect(spaces.success).toBe(false);

    if (spaces.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(spaces.error.issues).toEqual([
      expect.objectContaining({
        path: ["reason"],
        message: "El motivo es obligatorio",
      }),
    ]);
  });

  it("rechaza un reason ausente con el mensaje default de Zod", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(result.error.issues).toEqual([
      expect.objectContaining({
        path: ["reason"],
        message: "Invalid input: expected string, received undefined",
      }),
    ]);
  });

  it("rechaza un reason de 501 caracteres y acepta 500", () => {
    const over = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "r".repeat(501),
    });

    expect(over.success).toBe(false);

    if (over.success) {
      throw new Error("Se esperaba un error de validación");
    }

    expect(over.error.issues).toEqual([
      expect.objectContaining({
        path: ["reason"],
        message: "El motivo no puede superar 500 caracteres",
      }),
    ]);

    const boundary = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "r".repeat(500),
    });

    expect(boundary.success).toBe(true);
  });

  it("rechaza un campo desconocido active", () => {
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "Compra",
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
    const result = createStockMovementSchema.safeParse({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "Compra",
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

describe("createMovement", () => {
  it("registra una entrada IN actualizando el stock del producto", async () => {
    const product = {
      _id: "507f1f77bcf86cd799439011",
      currentStock: 15,
    } as unknown as Product;
    const movement = {
      _id: "64b000000000000000000020",
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "Reposición",
      createdAt: new Date(),
    } as unknown as StockMovement;
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockResolvedValue(movement);

    const result = await createMovement({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "Reposición",
    });

    expect(result).toBe(movement);
    expect(updateSpy).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011", deletedAt: null },
      { $inc: { currentStock: 5 } },
      { new: true },
    );
    expect(createSpy).toHaveBeenCalledWith({
      productId: "507f1f77bcf86cd799439011",
      type: "IN",
      quantity: 5,
      reason: "Reposición",
    });

    updateSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("registra una salida OUT con guard de stock mínimo", async () => {
    const product = {
      _id: "507f1f77bcf86cd799439011",
      currentStock: 5,
    } as unknown as Product;
    const movement = {
      _id: "64b000000000000000000021",
      productId: "507f1f77bcf86cd799439011",
      type: "OUT",
      quantity: 5,
      reason: "Venta",
      createdAt: new Date(),
    } as unknown as StockMovement;
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockResolvedValue(movement);

    const result = await createMovement({
      productId: "507f1f77bcf86cd799439011",
      type: "OUT",
      quantity: 5,
      reason: "Venta",
    });

    expect(result).toBe(movement);
    expect(updateSpy).toHaveBeenCalledWith(
      {
        _id: "507f1f77bcf86cd799439011",
        deletedAt: null,
        currentStock: { $gte: 5 },
      },
      { $inc: { currentStock: -5 } },
      { new: true },
    );
    expect(createSpy).toHaveBeenCalledWith({
      productId: "507f1f77bcf86cd799439011",
      type: "OUT",
      quantity: 5,
      reason: "Venta",
    });

    updateSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("devuelve NOT_FOUND en una entrada cuando el producto no existe", async () => {
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockResolvedValue({
      _id: "64b000000000000000000020",
    } as unknown as StockMovement);

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "IN",
        quantity: 5,
        reason: "Reposición",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El producto no existe");
    expect(createSpy).not.toHaveBeenCalled();

    updateSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("devuelve CONFLICT en una salida sin stock suficiente", async () => {
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
    const existsSpy = vi.spyOn(ProductModel, "exists").mockResolvedValue({
      _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    });
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockResolvedValue({
      _id: "64b000000000000000000021",
    } as unknown as StockMovement);

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "OUT",
        quantity: 100,
        reason: "Venta",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("CONFLICT");
    expect(result.message).toBe(
      "El stock es insuficiente para realizar la salida",
    );
    expect(result.issues).toBeUndefined();
    expect(existsSpy).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      deletedAt: null,
    });
    expect(createSpy).not.toHaveBeenCalled();

    updateSpy.mockRestore();
    existsSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("devuelve NOT_FOUND en una salida con producto inexistente o eliminado", async () => {
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
    const existsSpy = vi
      .spyOn(ProductModel, "exists")
      .mockResolvedValue(null);
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockResolvedValue({
      _id: "64b000000000000000000021",
    } as unknown as StockMovement);

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "OUT",
        quantity: 5,
        reason: "Venta",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("NOT_FOUND");
    expect(result.message).toBe("El producto no existe");
    expect(createSpy).not.toHaveBeenCalled();

    updateSpy.mockRestore();
    existsSpy.mockRestore();
    createSpy.mockRestore();
  });

  it("rechaza un input inválido antes de conectar a la base de datos", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "IN",
        quantity: 0,
        reason: "Reposición",
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
        path: "quantity",
        message: "quantity debe ser mayor que 0",
      },
    ]);
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve INTERNAL cuando findOneAndUpdate falla", async () => {
    const updateSpy = vi
      .spyOn(ProductModel, "findOneAndUpdate")
      .mockRejectedValue(new Error("db down"));

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "IN",
        quantity: 5,
        reason: "Reposición",
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

  it("compensa el stock de una salida cuando la creación del movimiento falla", async () => {
    const product = {
      _id: "507f1f77bcf86cd799439011",
      currentStock: 5,
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockRejectedValue(new Error("db down"));
    const updateOneSpy = vi.spyOn(
      ProductModel,
      "updateOne",
    ) as unknown as MockInstance<
      (filter?: unknown, update?: unknown) => Promise<unknown>
    >;
    updateOneSpy.mockResolvedValue({});

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "OUT",
        quantity: 5,
        reason: "Venta",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $inc: { currentStock: 5 } },
    );

    updateSpy.mockRestore();
    createSpy.mockRestore();
    updateOneSpy.mockRestore();
  });

  it("compensa el stock de una entrada cuando la creación del movimiento falla", async () => {
    const product = {
      _id: "507f1f77bcf86cd799439011",
      currentStock: 5,
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockRejectedValue(new Error("db down"));
    const updateOneSpy = vi.spyOn(
      ProductModel,
      "updateOne",
    ) as unknown as MockInstance<
      (filter?: unknown, update?: unknown) => Promise<unknown>
    >;
    updateOneSpy.mockResolvedValue({});

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "IN",
        quantity: 5,
        reason: "Reposición",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $inc: { currentStock: -5 } },
    );

    updateSpy.mockRestore();
    createSpy.mockRestore();
    updateOneSpy.mockRestore();
  });

  it("documenta que el error de la compensación reemplaza al error original", async () => {
    const product = {
      _id: "507f1f77bcf86cd799439011",
      currentStock: 5,
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
    const createSpy = vi.spyOn(
      StockMovementModel,
      "create",
    ) as unknown as MockInstance<
      (doc: Partial<StockMovement>) => Promise<StockMovement>
    >;
    createSpy.mockRejectedValue({
      code: 11000,
      keyPattern: { sku: "SKU-TEST-30" },
    });
    const updateOneSpy = vi.spyOn(
      ProductModel,
      "updateOne",
    ) as unknown as MockInstance<
      (filter?: unknown, update?: unknown) => Promise<unknown>
    >;
    updateOneSpy.mockRejectedValue(new Error("compensation down"));

    let thrown: unknown;

    try {
      await createMovement({
        productId: "507f1f77bcf86cd799439011",
        type: "OUT",
        quantity: 5,
        reason: "Venta",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("INTERNAL");
    expect(result.message).toBe("Error interno del servidor");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439011" },
      { $inc: { currentStock: 5 } },
    );

    updateSpy.mockRestore();
    createSpy.mockRestore();
    updateOneSpy.mockRestore();
  });
});

describe("listMovements", () => {
  it("lista todos los movimientos ordenados por createdAt descendente", async () => {
    const docs = [
      { _id: "64b000000000000000000022" } as unknown as StockMovement,
    ];
    const sortSpy = vi.fn().mockResolvedValue(docs);
    const findSpy = vi.spyOn(
      StockMovementModel,
      "find",
    ) as unknown as MockInstance<
      (filter?: unknown) => {
        sort: (order?: unknown) => Promise<StockMovement[]>;
      }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    const result = await listMovements();

    expect(result).toBe(docs);
    expect(findSpy).toHaveBeenCalledWith({});
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });

    findSpy.mockRestore();
  });

  it("filtra los movimientos por productId", async () => {
    const docs = [
      { _id: "64b000000000000000000023" } as unknown as StockMovement,
    ];
    const sortSpy = vi.fn().mockResolvedValue(docs);
    const findSpy = vi.spyOn(
      StockMovementModel,
      "find",
    ) as unknown as MockInstance<
      (filter?: unknown) => {
        sort: (order?: unknown) => Promise<StockMovement[]>;
      }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    const result = await listMovements("507f1f77bcf86cd799439011");

    expect(result).toBe(docs);
    expect(findSpy).toHaveBeenCalledWith({
      productId: "507f1f77bcf86cd799439011",
    });
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });

    findSpy.mockRestore();
  });

  it("rechaza un productId que no es string", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await listMovements(1 as unknown as string);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("rechaza un productId malformado", async () => {
    vi.mocked(connectDB).mockClear();

    let thrown: unknown;

    try {
      await listMovements("no-es-un-id");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El ID no es válido");
    expect(connectDB).not.toHaveBeenCalled();
  });

  it("devuelve INTERNAL cuando la consulta de listado falla", async () => {
    const sortSpy = vi.fn().mockRejectedValue(new Error("db down"));
    const findSpy = vi.spyOn(
      StockMovementModel,
      "find",
    ) as unknown as MockInstance<
      (filter?: unknown) => {
        sort: (order?: unknown) => Promise<StockMovement[]>;
      }
    >;
    findSpy.mockReturnValue({ sort: sortSpy });

    let thrown: unknown;

    try {
      await listMovements();
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
