import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";
import { ApiError, getMovements, getProducts } from "@/lib/api";
import {
  DEFAULT_LOW_STOCK_LIMIT,
  DEFAULT_RECENT_MOVEMENTS_LIMIT,
  attachProducts,
  filterMovements,
  getLowStockAlerts,
  getRecentMovements,
  getStockStatus,
  recentMovementsCountLabel,
  sortByCriticality,
  summarizeInventory,
} from "@/lib/dashboard";

const CATEGORY_ID = "64b000000000000000000031";

function makeId(n: number): string {
  return `64b0000000000000000000${n.toString(16).padStart(2, "0")}`;
}

function makeProduct(overrides: Partial<ProductDTO> = {}): ProductDTO {
  return {
    _id: makeId(0x41),
    name: "Teclado mecánico",
    sku: "SKU-001",
    description: null,
    price: 150,
    currentStock: 10,
    minimumStock: 4,
    categoryId: CATEGORY_ID,
    supplierId: null,
    deletedAt: null,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    __v: 0,
    ...overrides,
  };
}

function makeMovement(
  overrides: Partial<StockMovementDTO> = {},
): StockMovementDTO {
  return {
    _id: makeId(0x71),
    productId: makeId(0x41),
    type: "IN",
    quantity: 10,
    reason: "Recepción de mercadería",
    createdAt: "2026-01-02T10:00:00.000Z",
    __v: 0,
    ...overrides,
  };
}

describe("getStockStatus", () => {
  it("marca agotado cuando currentStock es 0 sin mínimo configurado", () => {
    expect(getStockStatus({ currentStock: 0, minimumStock: 0 })).toBe(
      "outOfStock",
    );
  });

  it("marca agotado con mínimo configurado sin contarlo como stock bajo", () => {
    expect(getStockStatus({ currentStock: 0, minimumStock: 5 })).toBe(
      "outOfStock",
    );
  });

  it("marca stock bajo exactamente en el límite (currentStock === minimumStock)", () => {
    expect(getStockStatus({ currentStock: 5, minimumStock: 5 })).toBe(
      "lowStock",
    );
    expect(getStockStatus({ currentStock: 1, minimumStock: 1 })).toBe(
      "lowStock",
    );
  });

  it("marca stock bajo por debajo del umbral", () => {
    expect(getStockStatus({ currentStock: 2, minimumStock: 10 })).toBe(
      "lowStock",
    );
  });

  it("marca normal un punto por encima del umbral", () => {
    expect(getStockStatus({ currentStock: 6, minimumStock: 5 })).toBe(
      "normal",
    );
  });

  it("marca normal con stock positivo sin mínimo configurado", () => {
    expect(getStockStatus({ currentStock: 3, minimumStock: 0 })).toBe(
      "normal",
    );
  });
});

describe("summarizeInventory", () => {
  it("devuelve ceros con una lista vacía", () => {
    expect(summarizeInventory([])).toEqual({
      totalProducts: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    });
  });

  it("calcula totales y contadores por separado con datos mixtos", () => {
    const products = [
      makeProduct({ _id: makeId(0x51), currentStock: 0, minimumStock: 0 }),
      makeProduct({ _id: makeId(0x52), currentStock: 0, minimumStock: 10 }),
      makeProduct({ _id: makeId(0x53), currentStock: 4, minimumStock: 4 }),
      makeProduct({ _id: makeId(0x54), currentStock: 2, minimumStock: 10 }),
      makeProduct({ _id: makeId(0x55), currentStock: 20, minimumStock: 0 }),
      makeProduct({ _id: makeId(0x56), currentStock: 6, minimumStock: 5 }),
    ];

    expect(summarizeInventory(products)).toEqual({
      totalProducts: 6,
      totalUnits: 32,
      lowStockCount: 2,
      outOfStockCount: 2,
    });
  });

  it("no cuenta un producto agotado también como stock bajo", () => {
    const summary = summarizeInventory([
      makeProduct({ currentStock: 0, minimumStock: 10 }),
    ]);

    expect(summary.lowStockCount).toBe(0);
    expect(summary.outOfStockCount).toBe(1);
  });
});

describe("sortByCriticality", () => {
  it("ordena agotados primero, luego stock bajo por cercanía al umbral y normales por menor stock", () => {
    const normalHigh = makeProduct({
      _id: makeId(0x61),
      currentStock: 20,
      minimumStock: 0,
    });
    const lowAtLimit = makeProduct({
      _id: makeId(0x62),
      currentStock: 5,
      minimumStock: 5,
    });
    const out = makeProduct({
      _id: makeId(0x63),
      currentStock: 0,
      minimumStock: 0,
    });
    const lowCritical = makeProduct({
      _id: makeId(0x64),
      currentStock: 1,
      minimumStock: 10,
    });
    const normalLow = makeProduct({
      _id: makeId(0x65),
      currentStock: 6,
      minimumStock: 5,
    });

    const result = sortByCriticality([
      normalHigh,
      lowAtLimit,
      out,
      lowCritical,
      normalLow,
    ]);

    expect(result.map((product) => product._id)).toEqual([
      out._id,
      lowCritical._id,
      lowAtLimit._id,
      normalLow._id,
      normalHigh._id,
    ]);
  });

  it("no muta la lista original", () => {
    const products = [
      makeProduct({ _id: makeId(0x66), currentStock: 20, minimumStock: 0 }),
      makeProduct({ _id: makeId(0x67), currentStock: 0, minimumStock: 0 }),
    ];
    const originalIds = products.map((product) => product._id);

    sortByCriticality(products);

    expect(products.map((product) => product._id)).toEqual(originalIds);
  });

  it("mantiene el orden de entrada ante empates", () => {
    const first = makeProduct({
      _id: makeId(0x68),
      currentStock: 7,
      minimumStock: 0,
    });
    const second = makeProduct({
      _id: makeId(0x69),
      currentStock: 7,
      minimumStock: 0,
    });

    expect(
      sortByCriticality([first, second]).map((product) => product._id),
    ).toEqual([first._id, second._id]);
    expect(
      sortByCriticality([second, first]).map((product) => product._id),
    ).toEqual([second._id, first._id]);
  });
});

describe("getLowStockAlerts", () => {
  it("filtra los productos normales y conserva la criticidad", () => {
    const normal = makeProduct({
      _id: makeId(0x6a),
      currentStock: 20,
      minimumStock: 0,
    });
    const low = makeProduct({
      _id: makeId(0x6b),
      currentStock: 3,
      minimumStock: 5,
    });
    const out = makeProduct({
      _id: makeId(0x6c),
      currentStock: 0,
      minimumStock: 5,
    });

    const result = getLowStockAlerts([normal, low, out]);

    expect(result.alerts.map((product) => product._id)).toEqual([
      out._id,
      low._id,
    ]);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it("limita a seis alertas por defecto y marca que hay más", () => {
    const products = Array.from(
      { length: DEFAULT_LOW_STOCK_LIMIT + 1 },
      (_, index) =>
        makeProduct({
          _id: makeId(0xa0 + index),
          currentStock: 0,
          minimumStock: 5,
        }),
    );

    const result = getLowStockAlerts(products);

    expect(result.alerts).toHaveLength(DEFAULT_LOW_STOCK_LIMIT);
    expect(result.total).toBe(DEFAULT_LOW_STOCK_LIMIT + 1);
    expect(result.hasMore).toBe(true);
  });

  it("respeta un límite configurable sin alterar el total", () => {
    const products = [
      makeProduct({
        _id: makeId(0xb0),
        currentStock: 0,
        minimumStock: 5,
      }),
      makeProduct({
        _id: makeId(0xb1),
        currentStock: 1,
        minimumStock: 5,
      }),
      makeProduct({
        _id: makeId(0xb2),
        currentStock: 2,
        minimumStock: 5,
      }),
    ];

    const result = getLowStockAlerts(products, { limit: 2 });

    expect(result.alerts).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.hasMore).toBe(true);
  });

  it("devuelve una lista vacía cuando todos los productos son normales", () => {
    const result = getLowStockAlerts([
      makeProduct({ currentStock: 20, minimumStock: 0 }),
    ]);

    expect(result).toEqual({ alerts: [], total: 0, hasMore: false });
  });
});

describe("attachProducts", () => {
  it("asocia el producto disponible al movimiento", () => {
    const product = makeProduct();
    const movement = makeMovement();

    expect(attachProducts([movement], [product])).toEqual([
      { ...movement, product },
    ]);
  });

  it("devuelve null cuando el producto ya no está disponible", () => {
    const movement = makeMovement({ productId: makeId(0x42) });

    expect(attachProducts([movement], [makeProduct()])).toEqual([
      { ...movement, product: null },
    ]);
  });

  it("devuelve una lista vacía sin movimientos", () => {
    expect(attachProducts([], [makeProduct()])).toEqual([]);
  });
});

describe("getRecentMovements", () => {
  it("ordena por fecha descendente sin importar el orden de entrada", () => {
    const older = makeMovement({
      _id: makeId(0x72),
      createdAt: "2026-01-01T09:00:00.000Z",
    });
    const newest = makeMovement({
      _id: makeId(0x73),
      createdAt: "2026-01-03T09:00:00.000Z",
    });
    const middle = makeMovement({
      _id: makeId(0x74),
      createdAt: "2026-01-02T09:00:00.000Z",
    });

    const result = getRecentMovements([older, newest, middle], []);

    expect(result.map((item) => item._id)).toEqual([
      newest._id,
      middle._id,
      older._id,
    ]);
  });

  it("no muta la lista original de movimientos", () => {
    const older = makeMovement({
      _id: makeId(0x75),
      createdAt: "2026-01-01T09:00:00.000Z",
    });
    const newest = makeMovement({
      _id: makeId(0x76),
      createdAt: "2026-01-03T09:00:00.000Z",
    });
    const movements = [older, newest];

    getRecentMovements(movements, []);

    expect(movements.map((item) => item._id)).toEqual([older._id, newest._id]);
  });

  it("limita los resultados con un límite configurable", () => {
    const movements = [
      makeMovement({
        _id: makeId(0x77),
        createdAt: "2026-01-01T09:00:00.000Z",
      }),
      makeMovement({
        _id: makeId(0x78),
        createdAt: "2026-01-02T09:00:00.000Z",
      }),
      makeMovement({
        _id: makeId(0x79),
        createdAt: "2026-01-03T09:00:00.000Z",
      }),
    ];

    const result = getRecentMovements(movements, [], { limit: 2 });

    expect(result.map((item) => item._id)).toEqual([
      makeId(0x79),
      makeId(0x78),
    ]);
  });

  it("usa el límite por defecto cuando no se indica", () => {
    const base = Date.UTC(2026, 0, 1, 0, 0, 0);
    const movements = Array.from(
      { length: DEFAULT_RECENT_MOVEMENTS_LIMIT + 1 },
      (_, index) =>
        makeMovement({
          _id: makeId(0x80 + index),
          createdAt: new Date(base + index * 3_600_000).toISOString(),
        }),
    );

    const result = getRecentMovements(movements, []);

    expect(result).toHaveLength(DEFAULT_RECENT_MOVEMENTS_LIMIT);
    expect(result[0]?.createdAt).toBe(
      movements[DEFAULT_RECENT_MOVEMENTS_LIMIT]?.createdAt,
    );
  });

  it("devuelve vacío con límite 0", () => {
    expect(
      getRecentMovements([makeMovement()], [], { limit: 0 }),
    ).toEqual([]);
  });

  it("asocia el producto correcto al movimiento más reciente", () => {
    const product = makeProduct();
    const target = makeMovement({
      _id: makeId(0x90),
      productId: product._id,
      createdAt: "2026-01-05T09:00:00.000Z",
    });
    const other = makeMovement({
      _id: makeId(0x91),
      productId: makeId(0x42),
      createdAt: "2026-01-04T09:00:00.000Z",
    });

    const result = getRecentMovements([other, target], [product]);

    expect(result[0]?._id).toBe(target._id);
    expect(result[0]?.product).toEqual(product);
    expect(result[1]?.product).toBeNull();
  });

  it("devuelve vacío sin movimientos", () => {
    expect(getRecentMovements([], [makeProduct()])).toEqual([]);
  });
});

describe("filterMovements", () => {
  const entries = makeMovement({
    _id: makeId(0x7a),
    type: "IN",
    createdAt: "2026-01-01T09:00:00.000Z",
  });
  const exits = makeMovement({
    _id: makeId(0x7b),
    type: "OUT",
    createdAt: "2026-01-02T09:00:00.000Z",
  });

  it("devuelve todos los movimientos con ALL sin mutar la entrada", () => {
    const movements = [entries, exits];

    const result = filterMovements(movements, "ALL");

    expect(result).toEqual([entries, exits]);
    expect(result).not.toBe(movements);
  });

  it("devuelve solo entradas con IN", () => {
    expect(filterMovements([entries, exits], "IN")).toEqual([entries]);
  });

  it("devuelve solo salidas con OUT", () => {
    expect(filterMovements([entries, exits], "OUT")).toEqual([exits]);
  });

  it("devuelve vacío con listas vacías", () => {
    expect(filterMovements([], "ALL")).toEqual([]);
    expect(filterMovements([], "IN")).toEqual([]);
    expect(filterMovements([], "OUT")).toEqual([]);
  });
});

describe("recentMovementsCountLabel", () => {
  it("usa el plural con varias cantidades", () => {
    expect(recentMovementsCountLabel(5, 12)).toBe(
      "Mostrando 5 de 12 movimientos",
    );
    expect(recentMovementsCountLabel(3, 7)).toBe(
      "Mostrando 3 de 7 movimientos",
    );
    expect(recentMovementsCountLabel(2, 5)).toBe(
      "Mostrando 2 de 5 movimientos",
    );
  });

  it("usa el singular cuando hay un único movimiento", () => {
    expect(recentMovementsCountLabel(1, 1)).toBe(
      "Mostrando 1 de 1 movimiento",
    );
  });

  it("muestra la cantidad visible cuando coincide con el total", () => {
    expect(recentMovementsCountLabel(4, 4)).toBe(
      "Mostrando 4 de 4 movimientos",
    );
  });

  it("muestra la cantidad visible cuando es menor que el total", () => {
    expect(recentMovementsCountLabel(6, 20)).toBe(
      "Mostrando 6 de 20 movimientos",
    );
  });
});

describe("cliente de API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("getProducts devuelve los productos de una respuesta válida", async () => {
    const product = makeProduct();
    fetchMock.mockResolvedValue(jsonResponse({ data: [product] }));

    await expect(getProducts()).resolves.toEqual([product]);

    expect(fetchMock).toHaveBeenCalledWith("/api/products", undefined);
  });

  it("getProducts reenvía la señal de aborto a fetch", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));
    const controller = new AbortController();

    await getProducts(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      signal: controller.signal,
    });
  });

  it("getMovements devuelve los movimientos de una respuesta válida", async () => {
    const movement = makeMovement();
    fetchMock.mockResolvedValue(jsonResponse({ data: [movement] }));

    await expect(getMovements()).resolves.toEqual([movement]);

    expect(fetchMock).toHaveBeenCalledWith("/api/stock", undefined);
  });

  it("propaga el kind y el message del envolvente de error del servidor", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { kind: "NOT_FOUND", message: "El producto no existe" } },
        404,
      ),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "El producto no existe",
    });
  });

  it("propaga los issues de un error de validación", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            kind: "VALIDATION",
            message: "El ID no es válido",
            issues: [{ path: "productId", message: "El ID no es válido" }],
          },
        },
        400,
      ),
    );

    const error = await getMovements().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: "VALIDATION",
      status: 400,
      issues: [{ path: "productId", message: "El ID no es válido" }],
    });
  });

  it("HTTP fallido sin envolvente válida lanza un error genérico", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 502,
      message: "Error del servidor",
    });
  });

  it("JSON inválido con status 200 lanza respuesta inesperada", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"data": [', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("JSON con forma inesperada lanza respuesta inesperada", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("rechaza productos con campos inválidos en lugar de ocultarlos", async () => {
    const invalid = { ...makeProduct(), currentStock: -1 };
    fetchMock.mockResolvedValue(jsonResponse({ data: [invalid] }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      message: "Respuesta inesperada del servidor",
    });
  });

  it("rechaza movimientos con un tipo fuera del dominio", async () => {
    const invalid = { ...makeMovement(), type: "SIDE" };
    fetchMock.mockResolvedValue(jsonResponse({ data: [invalid] }));

    await expect(getMovements()).rejects.toMatchObject({
      name: "ApiError",
      message: "Respuesta inesperada del servidor",
    });
  });

  it("un fallo de red lanza un error de conexión", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
    });
  });
});
