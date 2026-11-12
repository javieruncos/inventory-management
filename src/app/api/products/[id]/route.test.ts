import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Product } from "@/db/models/Product";
import { DELETE, GET, PUT } from "@/app/api/products/[id]/route";
import type { IdRouteContext } from "@/app/api/_lib/http";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { getOptionalUser, requireAdmin } from "@/lib/auth/auth-guards";
import { deleteProduct, getProduct, updateProduct } from "@/lib/products";

vi.mock("@/lib/auth/auth-guards", () => ({
  getOptionalUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

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

const ID = "64b000000000000000000040";
const BASE_URL = `http://localhost/api/products/${ID}`;
const USER = {
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "user" as const,
};
const ADMIN = {
  id: "507f1f77bcf86cd799439012",
  email: "admin@example.com",
  role: "admin" as const,
};

function mockAllowedRoles(): void {
  vi.mocked(getOptionalUser).mockResolvedValue(USER);
  vi.mocked(requireAdmin).mockResolvedValue(ADMIN);
}

function makeContext(): IdRouteContext {
  return { params: Promise.resolve({ id: ID }) };
}

function makeBodyRequest(body: string): Request {
  return new Request(BASE_URL, {
    method: "PUT",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  it("devuelve 200 con el producto por await params", async () => {
    const product = { _id: ID } as unknown as Product;
    vi.mocked(getProduct).mockResolvedValue(product);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(getOptionalUser).toHaveBeenCalledTimes(1);
    expect(getProduct).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: product });
  });

  it("permite el acceso a un administrador autenticado", async () => {
    vi.mocked(getOptionalUser).mockResolvedValue(ADMIN);
    vi.mocked(getProduct).mockResolvedValue({ _id: ID } as unknown as Product);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(getProduct).toHaveBeenCalledWith(ID);
  });

  it("devuelve 200 a un visitante sin autenticación y consulta la lib", async () => {
    const product = { _id: ID } as unknown as Product;
    vi.mocked(getOptionalUser).mockResolvedValue(null);
    vi.mocked(getProduct).mockResolvedValue(product);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(getOptionalUser).toHaveBeenCalledTimes(1);
    expect(getProduct).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: product });
  });

  it("devuelve 400 cuando el ID es inválido", async () => {
    vi.mocked(getProduct).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Valor con formato inválido",
        issues: [{ path: "_id", message: "El valor de _id no es válido" }],
      }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: "_id", message: "El valor de _id no es válido" }],
    });
  });

  it("devuelve 404 cuando el producto no existe", async () => {
    vi.mocked(getProduct).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El producto no existe",
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(getProduct).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

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

describe("PUT /api/products/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  const payload = {
    name: "Laptop Gamer",
    price: 1400000,
  };

  const product = {
    _id: ID,
    name: "Laptop Gamer",
    price: 1400000,
  } as unknown as Product;

  it("actualiza el producto y devuelve 200 con (id, body) exactos", async () => {
    vi.mocked(updateProduct).mockResolvedValue(product);

    const response = await PUT(makeBodyRequest(JSON.stringify(payload)), makeContext());

    expect(response.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(updateProduct).toHaveBeenCalledWith(ID, payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: product });
  });

  it("devuelve 401 sin autenticación antes de parsear el body", async () => {
    const request = makeBodyRequest('{"name":');
    const jsonSpy = vi.spyOn(request, "json");

    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await PUT(request, makeContext());

    expect(response.status).toBe(401);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin antes de parsear el body", async () => {
    const request = makeBodyRequest(JSON.stringify(payload));
    const jsonSpy = vi.spyOn(request, "json");

    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await PUT(request, makeContext());

    expect(response.status).toBe(403);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest('{"name":'), makeContext());

    expect(response.status).toBe(400);
    expect(updateProduct).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest(""), makeContext());

    expect(response.status).toBe(400);
    expect(updateProduct).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con issues cuando la validación de negocio falla", async () => {
    vi.mocked(updateProduct).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [
          { path: "", message: "Debe enviar al menos un campo a actualizar" },
        ],
      }),
    );

    const response = await PUT(makeBodyRequest(JSON.stringify({})), makeContext());

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: [
        { path: "", message: "Debe enviar al menos un campo a actualizar" },
      ],
    });
  });

  it("devuelve 400 cuando el ID es inválido", async () => {
    vi.mocked(updateProduct).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Valor con formato inválido",
        issues: [{ path: "_id", message: "El valor de _id no es válido" }],
      }),
    );

    const response = await PUT(makeBodyRequest(JSON.stringify(payload)), makeContext());

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: "_id", message: "El valor de _id no es válido" }],
    });
  });

  it("devuelve 404 cuando el producto no existe", async () => {
    vi.mocked(updateProduct).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    const response = await PUT(makeBodyRequest(JSON.stringify(payload)), makeContext());

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El producto no existe",
    });
  });

  it("devuelve 409 cuando el SKU está duplicado", async () => {
    vi.mocked(updateProduct).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "El SKU ya existe",
        issues: [{ path: "sku", message: "El SKU ya existe" }],
      }),
    );

    const response = await PUT(makeBodyRequest(JSON.stringify(payload)), makeContext());

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
    vi.mocked(updateProduct).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await PUT(makeBodyRequest(JSON.stringify(payload)), makeContext());

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

describe("DELETE /api/products/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  it("elimina el producto y devuelve 200 con el registro", async () => {
    const deleted = { _id: ID, deletedAt: new Date() } as unknown as Product;
    vi.mocked(deleteProduct).mockResolvedValue(deleted);

    const response = await DELETE(new Request(BASE_URL, { method: "DELETE" }), makeContext());

    expect(response.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(deleteProduct).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({
      data: { ...deleted, deletedAt: expect.any(String) },
    });
  });

  it("devuelve 401 sin autenticación sin consultar la lib", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(401);
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(403);
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it("devuelve 400 cuando el ID es inválido", async () => {
    vi.mocked(deleteProduct).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Valor con formato inválido",
        issues: [{ path: "_id", message: "El valor de _id no es válido" }],
      }),
    );

    const response = await DELETE(new Request(BASE_URL, { method: "DELETE" }), makeContext());

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: "_id", message: "El valor de _id no es válido" }],
    });
  });

  it("devuelve 404 cuando el producto no existe", async () => {
    vi.mocked(deleteProduct).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    const response = await DELETE(new Request(BASE_URL, { method: "DELETE" }), makeContext());

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El producto no existe",
    });
  });

  it("devuelve 409 cuando el producto tiene stock disponible", async () => {
    vi.mocked(deleteProduct).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message:
          "No se puede archivar un producto con stock disponible. Registrá una salida hasta dejarlo en 0 antes de archivarlo.",
      }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(409);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "CONFLICT",
      message:
        "No se puede archivar un producto con stock disponible. Registrá una salida hasta dejarlo en 0 antes de archivarlo.",
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(deleteProduct).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await DELETE(new Request(BASE_URL, { method: "DELETE" }), makeContext());

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
