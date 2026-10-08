import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { Supplier } from "@/db/models/Supplier";
import { GET, POST } from "@/app/api/suppliers/route";
import { createSupplier, listSuppliers } from "@/lib/suppliers";

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

const BASE_URL = "http://localhost/api/suppliers";

function makePostRequest(body: string): Request {
  return new Request(BASE_URL, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/suppliers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("devuelve 200 con la lista de proveedores", async () => {
    const suppliers = [
      { _id: "64b000000000000000000061" } as unknown as Supplier,
    ];
    vi.mocked(listSuppliers).mockResolvedValue(suppliers);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(listSuppliers).toHaveBeenCalledTimes(1);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: suppliers });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(listSuppliers).mockRejectedValue(
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

describe("POST /api/suppliers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const payload = {
    name: "Acme",
    email: "contacto@acme.com",
    phone: "+54 11 5555-0000",
  };

  const supplier = {
    _id: "64b000000000000000000061",
    name: "Acme",
    email: "contacto@acme.com",
    phone: "+54 11 5555-0000",
  } as unknown as Supplier;

  it("crea el proveedor y devuelve 201 con el body parseado", async () => {
    vi.mocked(createSupplier).mockResolvedValue(supplier);

    const response = await POST(makePostRequest(JSON.stringify(payload)));

    expect(response.status).toBe(201);
    expect(createSupplier).toHaveBeenCalledWith(payload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: supplier });
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await POST(makePostRequest('{"name":'));

    expect(response.status).toBe(400);
    expect(createSupplier).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await POST(makePostRequest(""));

    expect(response.status).toBe(400);
    expect(createSupplier).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con issues cuando la validación de negocio falla", async () => {
    vi.mocked(createSupplier).mockRejectedValue(
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
    vi.mocked(createSupplier).mockRejectedValue(
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
    vi.mocked(createSupplier).mockRejectedValue(
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
