import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Supplier } from "@/db/models/Supplier";
import { DELETE, GET, PUT } from "@/app/api/suppliers/[id]/route";
import type { IdRouteContext } from "@/app/api/_lib/http";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { requireAdmin, requireUser } from "@/lib/auth/auth-guards";
import { deleteSupplier, getSupplier, updateSupplier } from "@/lib/suppliers";

vi.mock("@/lib/auth/auth-guards", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/suppliers", () => ({
  listSuppliers: vi.fn(),
  createSupplier: vi.fn(),
  getSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
}));

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

const ID = "64b000000000000000000061";
const BASE_URL = `http://localhost/api/suppliers/${ID}`;
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

describe("GET /api/suppliers/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  it("devuelve 200 con el proveedor por await params", async () => {
    const supplier = { _id: ID, name: "Acme" } as unknown as Supplier;
    vi.mocked(getSupplier).mockResolvedValue(supplier);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(requireUser).toHaveBeenCalledTimes(1);
    expect(getSupplier).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: supplier });
  });

  it("permite el acceso a un administrador autenticado", async () => {
    vi.mocked(requireUser).mockResolvedValue(ADMIN);
    vi.mocked(getSupplier).mockResolvedValue({
      _id: ID,
      name: "Acme",
    } as unknown as Supplier);

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(200);
    expect(getSupplier).toHaveBeenCalledWith(ID);
  });

  it("devuelve 401 sin autenticación sin consultar la lib", async () => {
    vi.mocked(requireUser).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(401);
    expect(getSupplier).not.toHaveBeenCalled();
  });

  it("devuelve 400 sin issues cuando el ID es inválido", async () => {
    vi.mocked(getSupplier).mockRejectedValue(
      new AppError({ kind: "VALIDATION", message: "El ID no es válido" }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El ID no es válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 404 cuando el proveedor no existe", async () => {
    vi.mocked(getSupplier).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El proveedor no existe" }),
    );

    const response = await GET(new Request(BASE_URL), makeContext());

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El proveedor no existe",
    });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(getSupplier).mockRejectedValue(
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

describe("PUT /api/suppliers/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  const payload = {
    name: "Acme SA",
    email: "ventas@acme.com",
  };

  const supplier = {
    _id: ID,
    name: "Acme SA",
    email: "ventas@acme.com",
  } as unknown as Supplier;

  it("actualiza el proveedor y devuelve 200 con (id, body) exactos", async () => {
    vi.mocked(updateSupplier).mockResolvedValue(supplier);

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(updateSupplier).toHaveBeenCalledWith(ID, payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: supplier });
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
    expect(updateSupplier).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin antes de parsear el body", async () => {
    const request = makeBodyRequest(JSON.stringify(payload));
    const jsonSpy = vi.spyOn(request, "json");

    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await PUT(request, makeContext());

    expect(response.status).toBe(403);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(updateSupplier).not.toHaveBeenCalled();
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest('{"name":'), makeContext());

    expect(response.status).toBe(400);
    expect(updateSupplier).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await PUT(makeBodyRequest(""), makeContext());

    expect(response.status).toBe(400);
    expect(updateSupplier).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con la issue del refine cuando el payload es {}", async () => {
    vi.mocked(updateSupplier).mockRejectedValue(
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

  it("devuelve 400 sin issues cuando el ID es inválido", async () => {
    vi.mocked(updateSupplier).mockRejectedValue(
      new AppError({ kind: "VALIDATION", message: "El ID no es válido" }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El ID no es válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 404 cuando el proveedor no existe", async () => {
    vi.mocked(updateSupplier).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El proveedor no existe" }),
    );

    const response = await PUT(
      makeBodyRequest(JSON.stringify(payload)),
      makeContext(),
    );

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El proveedor no existe",
    });
  });

  it("devuelve 409 cuando el nombre ya está en uso", async () => {
    vi.mocked(updateSupplier).mockRejectedValue(
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
    vi.mocked(updateSupplier).mockRejectedValue(
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

describe("DELETE /api/suppliers/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockAllowedRoles();
  });

  it("elimina el proveedor y devuelve 200 con el registro", async () => {
    const deleted = {
      _id: ID,
      name: "Acme",
      deletedAt: new Date(),
    } as unknown as Supplier;
    vi.mocked(deleteSupplier).mockResolvedValue(deleted);

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(200);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(deleteSupplier).toHaveBeenCalledWith(ID);

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
    expect(deleteSupplier).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(403);
    expect(deleteSupplier).not.toHaveBeenCalled();
  });

  it("devuelve 400 sin issues cuando el ID es inválido", async () => {
    vi.mocked(deleteSupplier).mockRejectedValue(
      new AppError({ kind: "VALIDATION", message: "El ID no es válido" }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El ID no es válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 404 cuando el proveedor no existe", async () => {
    vi.mocked(deleteSupplier).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El proveedor no existe" }),
    );

    const response = await DELETE(
      new Request(BASE_URL, { method: "DELETE" }),
      makeContext(),
    );

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El proveedor no existe",
    });
  });

  it("devuelve 409 sin issues cuando el proveedor tiene productos activos", async () => {
    vi.mocked(deleteSupplier).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "El proveedor está en uso por productos",
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
      message: "El proveedor está en uso por productos",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(deleteSupplier).mockRejectedValue(
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
