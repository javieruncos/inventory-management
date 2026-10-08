import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Category } from "@/db/models/Category";
import { DELETE, GET, PUT } from "@/app/api/categories/[id]/route";
import type { IdRouteContext } from "@/app/api/_lib/http";
import { deleteCategory, getCategory, updateCategory } from "@/lib/categories";

vi.mock("@/lib/categories", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  getCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

const ID = "64b000000000000000000060";
const BASE_URL = `http://localhost/api/categories/${ID}`;

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

describe("GET /api/categories/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 200 con la categoría por await params", async () => {
    const category = { _id: ID, name: "Tecnología" } as unknown as Category;
    vi.mocked(getCategory).mockResolvedValue(category);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(getCategory).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: category });
  });

  it("devuelve 400 cuando el ID es inválido", async () => {
    vi.mocked(getCategory).mockRejectedValue(
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

  it("devuelve 404 cuando la categoría no existe", async () => {
    vi.mocked(getCategory).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "La categoría no existe" }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(getCategory).mockRejectedValue(
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

describe("PUT /api/categories/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const payload = {
    name: "Tecnología",
    description: "Nueva descripción",
  };

  const category = {
    _id: ID,
    name: "Tecnología",
    description: "Nueva descripción",
  } as unknown as Category;

  it("actualiza la categoría y devuelve 200 con (id, body) exactos", async () => {
    vi.mocked(updateCategory).mockResolvedValue(category);

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(200);
    expect(updateCategory).toHaveBeenCalledWith(ID, payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: category });
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest('{"name":'), makeContext());

    expect(response.status).toBe(400);
    expect(updateCategory).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest(""), makeContext());

    expect(response.status).toBe(400);
    expect(updateCategory).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con la issue del refine cuando el payload es {}", async () => {
    vi.mocked(updateCategory).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [
          { path: "", message: "Debe enviar al menos un campo a actualizar" },
        ],
      }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify({})),
      makeContext(),
    );

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
    vi.mocked(updateCategory).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Valor con formato inválido",
        issues: [{ path: "_id", message: "El valor de _id no es válido" }],
      }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: "_id", message: "El valor de _id no es válido" }],
    });
  });

  it("devuelve 404 cuando la categoría no existe", async () => {
    vi.mocked(updateCategory).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "La categoría no existe" }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
    });
  });

  it("devuelve 409 cuando el nombre ya está en uso", async () => {
    vi.mocked(updateCategory).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "Ese nombre ya está en uso",
        issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
      }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(409);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "CONFLICT",
      message: "Ese nombre ya está en uso",
      issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(updateCategory).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

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

describe("DELETE /api/categories/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("elimina la categoría y devuelve 200 con el registro", async () => {
    const deleted = {
      _id: ID,
      name: "Tecnología",
      deletedAt: new Date(),
    } as unknown as Category;
    vi.mocked(deleteCategory).mockResolvedValue(deleted);

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(200);
    expect(deleteCategory).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({
      data: { ...deleted, deletedAt: expect.any(String) },
    });
  });

  it("devuelve 400 cuando el ID es inválido con issue sobre categoryId", async () => {
    vi.mocked(deleteCategory).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Valor con formato inválido",
        issues: [
          { path: "categoryId", message: "El valor de categoryId no es válido" },
        ],
      }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [
        { path: "categoryId", message: "El valor de categoryId no es válido" },
      ],
    });
  });

  it("devuelve 404 cuando la categoría no existe", async () => {
    vi.mocked(deleteCategory).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "La categoría no existe" }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
    });
  });

  it("devuelve 409 sin issues cuando la categoría tiene productos activos", async () => {
    vi.mocked(deleteCategory).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "La categoría está en uso por productos",
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
      message: "La categoría está en uso por productos",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(deleteCategory).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

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
