import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Category } from "@/db/models/Category";
import { GET, POST } from "@/app/api/categories/route";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { requireAdmin, requireUser } from "@/lib/auth/auth-guards";
import { createCategory, listCategories } from "@/lib/categories";

vi.mock("@/lib/auth/auth-guards", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

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
  vi.mocked(requireUser).mockResolvedValue(USER);
  vi.mocked(requireAdmin).mockResolvedValue(ADMIN);
}

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
    mockAllowedRoles();
  });

  it("devuelve 200 con la lista de categorías", async () => {
    const categories = [
      { _id: "64b000000000000000000060" } as unknown as Category,
    ];
    vi.mocked(listCategories).mockResolvedValue(categories);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(requireUser).toHaveBeenCalledTimes(1);
    expect(listCategories).toHaveBeenCalledTimes(1);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: categories });
  });

  it("permite el acceso a un administrador autenticado", async () => {
    vi.mocked(requireUser).mockResolvedValue(ADMIN);
    vi.mocked(listCategories).mockResolvedValue([]);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(listCategories).toHaveBeenCalledTimes(1);
  });

  it("devuelve 401 sin autenticación sin consultar la lib", async () => {
    vi.mocked(requireUser).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(401);
    expect(listCategories).not.toHaveBeenCalled();
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
    mockAllowedRoles();
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
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(createCategory).toHaveBeenCalledWith(payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: category });
  });

  it("devuelve 401 sin autenticación antes de parsear el body", async () => {
    const request = makePostRequest('{"name":');
    const jsonSpy = vi.spyOn(request, "json");

    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin antes de parsear el body", async () => {
    const request = makePostRequest(JSON.stringify(payload));
    const jsonSpy = vi.spyOn(request, "json");

    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(createCategory).not.toHaveBeenCalled();
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
