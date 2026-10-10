import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMovements, getProducts } from "@/lib/api";

const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>();

const PRODUCT = {
  _id: "507f1f77bcf86cd799439011",
  name: "Teclado Mecánico",
  sku: "KB-001",
  price: 150000,
  currentStock: 3,
  minimumStock: 1,
  categoryId: "507f1f77bcf86cd799439012",
  deletedAt: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
};

const MOVEMENT = {
  _id: "507f1f77bcf86cd799439013",
  productId: "507f1f77bcf86cd799439011",
  type: "IN",
  quantity: 5,
  reason: "Compra inicial",
  createdAt: "2026-01-01T10:00:00.000Z",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProducts", () => {
  it("solicita /api/products y devuelve la lista del envelope", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [PRODUCT] }));

    const result = await getProducts();

    expect(fetchMock).toHaveBeenCalledWith("/api/products", undefined);
    expect(result).toEqual([PRODUCT]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getProducts(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      signal: controller.signal,
    });
  });

  it("convierte el envelope de error en ApiError con kind, status e issues", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "El SKU ya existe",
            issues: [{ path: "sku", message: "El SKU ya existe" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "El SKU ya existe",
      issues: [{ path: "sku", message: "El SKU ya existe" }],
    });
  });

  it("reporta un fallo de red con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
    });
  });

  it("rechaza cuerpos que no son JSON válido", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>oops</html>", { status: 200 }),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("rechaza data que no valida contra el esquema", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [{ foo: "bar" }] }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("usa «Error del servidor» cuando el error no trae envelope", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "Error del servidor",
    });
  });
});

describe("getMovements", () => {
  it("solicita /api/stock y devuelve los movimientos validados", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [MOVEMENT] }));

    const result = await getMovements();

    expect(fetchMock).toHaveBeenCalledWith("/api/stock", undefined);
    expect(result).toEqual([MOVEMENT]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getMovements(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/stock", {
      signal: controller.signal,
    });
  });

  it("propaga errores de validación del servidor como ApiError", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "VALIDATION",
            message: "Datos inválidos",
            issues: [{ path: "quantity", message: "Valor inválido" }],
          },
        },
        { status: 400 },
      ),
    );

    await expect(getMovements()).rejects.toMatchObject({
      name: "ApiError",
      kind: "VALIDATION",
      status: 400,
      message: "Datos inválidos",
      issues: [{ path: "quantity", message: "Valor inválido" }],
    });
  });
});
