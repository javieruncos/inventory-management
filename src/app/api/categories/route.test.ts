import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Category } from "@/db/models/Category";
import { GET, POST } from "@/app/api/categories/route";
import { createCategory, listCategories } from "@/lib/categories";

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

const BASE_URL = "http://localhost/api/categories";

function makePostRequest(body: string): Request {
  return new Request(BASE_URL, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 200 con la lista de categorías", async () => {
    const categories = [
      { _id: "64b000000000000000000060" } as unknown as Category,
    ];
    vi.mocked(listCategories).mockResolvedValue(categories);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(listCategories).toHaveBeenCalledTimes(1);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: categories });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(listCategories).mockRejectedValue(
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

describe("POST /api/categories", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const payload = {
    name: "Tecnología",
    description: "Electrónica y más",
  };

  const category = {
    _id: "64b000000000000000000060",
    name: "Tecnología",
    description: "Electrónica y más",
  } as unknown as Category;

  it("crea la categoría y devuelve 201 con el body parseado", async () => {
    vi.mocked(createCategory).mockResolvedValue(category);

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(201);
    expect(createCategory).toHaveBeenCalledWith(payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: category });
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await POST(makePostRequest('{"name":'));

    expect(response.status).toBe(400);
    expect(createCategory).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await POST(makePostRequest(""));

    expect(response.status).toBe(400);
    expect(createCategory).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con issues cuando la validación de negocio falla", async () => {
    vi.mocked(createCategory).mockRejectedValue(
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

  it("devuelve 409 cuando el nombre ya está en uso", async () => {
    vi.mocked(createCategory).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "Ese nombre ya está en uso",
        issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(payload)));

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
    vi.mocked(createCategory).mockRejectedValue(
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
