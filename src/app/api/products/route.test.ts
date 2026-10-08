import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Product } from "@/db/models/Product";
import { GET, POST } from "@/app/api/products/route";
import { createProduct, listProducts } from "@/lib/products";

vi.mock("@/lib/products", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
  getProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

const BASE_URL = "http://localhost/api/products";

function makePostRequest(body: string): Request {
  return new Request(BASE_URL, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 200 con la lista de productos", async () => {
    const products = [
      { _id: "64b000000000000000000040" } as unknown as Product,
    ];
    vi.mocked(listProducts).mockResolvedValue(products);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: products });
    expect(listProducts).toHaveBeenCalledTimes(1);
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(listProducts).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(json.error).not.toHaveProperty("cause");
    expect(json.error).not.toHaveProperty("stack");
  });
});

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const payload = {
    name: "Laptop Gamer",
    sku: "LAP-001",
    price: 1500000,
    categoryId: "64b000000000000000000050",
  };

  const product = {
    _id: "64b000000000000000000040",
    name: "Laptop Gamer",
    sku: "LAP-001",
  } as unknown as Product;

  it("crea el producto y devuelve 201 con el body parseado", async () => {
    vi.mocked(createProduct).mockResolvedValue(product);

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(201);
    expect(createProduct).toHaveBeenCalledWith(payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: product });
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await POST(makePostRequest('{"name":'));

    expect(response.status).toBe(400);
    expect(createProduct).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await POST(makePostRequest(""));

    expect(response.status).toBe(400);
    expect(createProduct).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con issues cuando la validación de negocio falla", async () => {
    vi.mocked(createProduct).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [{ path: "name", message: "El nombre es obligatorio" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: [{ path: "name", message: "El nombre es obligatorio" }],
    });
  });

  it("devuelve 404 cuando la categoría no existe", async () => {
    vi.mocked(createProduct).mockRejectedValue(
      new AppError({
        kind: "NOT_FOUND",
        message: "La categoría no existe",
        issues: [{ path: "categoryId", message: "La categoría no existe" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
      issues: [{ path: "categoryId", message: "La categoría no existe" }],
    });
  });

  it("devuelve 404 cuando el proveedor no existe", async () => {
    vi.mocked(createProduct).mockRejectedValue(
      new AppError({
        kind: "NOT_FOUND",
        message: "El proveedor no existe",
        issues: [{ path: "supplierId", message: "El proveedor no existe" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El proveedor no existe",
      issues: [{ path: "supplierId", message: "El proveedor no existe" }],
    });
  });

  it("devuelve 409 cuando el SKU está duplicado", async () => {
    vi.mocked(createProduct).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "El SKU ya existe",
        issues: [{ path: "sku", message: "El SKU ya existe" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(409);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "CONFLICT",
      message: "El SKU ya existe",
      issues: [{ path: "sku", message: "El SKU ya existe" }],
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(createProduct).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(json.error).not.toHaveProperty("cause");
    expect(json.error).not.toHaveProperty("stack");
  });
});
