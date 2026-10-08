import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { errorResponse, ok, parseJsonBody } from "@/app/api/_lib/http";

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

type InternalLogEntry = {
  timestamp: string;
  method?: string;
  pathname?: string;
  kind: string;
  message: string;
  cause?: string;
  stack?: string;
};

describe("ok", () => {
  it("devuelve 200 por defecto con envoltorio { data }", async () => {
    const response = ok({ id: "64b000000000000000000040" });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/json",
    );

    const json = (await response.json()) as unknown;

    expect(json).toEqual({ data: { id: "64b000000000000000000040" } });
  });

  it("permite indicar un status explícito 201", async () => {
    const response = ok({ id: "64b000000000000000000040" }, 201);

    expect(response.status).toBe(201);

    const json = (await response.json()) as unknown;

    expect(json).toEqual({ data: { id: "64b000000000000000000040" } });
  });

  it("devuelve un array como data", async () => {
    const response = ok([{ id: "64b000000000000000000040" }]);

    expect(response.status).toBe(200);

    const json = (await response.json()) as unknown;

    expect(json).toEqual({ data: [{ id: "64b000000000000000000040" }] });
  });

  it("devuelve null como data", async () => {
    const response = ok(null);

    expect(response.status).toBe(200);

    const json = (await response.json()) as unknown;

    expect(json).toEqual({ data: null });
  });
});

describe("parseJsonBody", () => {
  it("devuelve el objeto parseado cuando el body es JSON válido", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ name: "Tecnología" }),
    });

    const result = await parseJsonBody(request);

    expect(result).toEqual({ name: "Tecnología" });
  });

  it("devuelve el array parseado", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify([1, 2, 3]),
    });

    const result = await parseJsonBody(request);

    expect(result).toEqual([1, 2, 3]);
  });

  it("devuelve null sin validarlo", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify(null),
    });

    const result = await parseJsonBody(request);

    expect(result).toBeNull();
  });

  it("devuelve un string sin validarlo", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify("hola"),
    });

    const result = await parseJsonBody(request);

    expect(result).toBe("hola");
  });

  it("devuelve un número sin validarlo", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify(123),
    });

    const result = await parseJsonBody(request);

    expect(result).toBe(123);
  });

  it("devuelve VALIDATION cuando el body está vacío", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: "",
    });

    let thrown: unknown;

    try {
      await parseJsonBody(request);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El cuerpo debe ser JSON válido");
    expect(result.issues).toBeUndefined();
  });

  it("devuelve VALIDATION cuando el JSON está malformado", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      body: '{"name":',
      headers: { "Content-Type": "application/json" },
    });

    let thrown: unknown;

    try {
      await parseJsonBody(request);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("El cuerpo debe ser JSON válido");
    expect(result.issues).toBeUndefined();
  });
});

describe("errorResponse", () => {
  it("mapea VALIDATION a 400", async () => {
    const response = errorResponse(
      new AppError({ kind: "VALIDATION", message: "Datos inválidos" }),
    );

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Datos inválidos",
    });
  });

  it("mapea NOT_FOUND a 404", async () => {
    const response = errorResponse(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El producto no existe",
    });
  });

  it("mapea CONFLICT a 409", async () => {
    const response = errorResponse(
      new AppError({ kind: "CONFLICT", message: "Ese nombre ya está en uso" }),
    );

    expect(response.status).toBe(409);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "CONFLICT",
      message: "Ese nombre ya está en uso",
    });
  });

  it("mapea INTERNAL a 500", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const response = errorResponse(
      new AppError({ kind: "INTERNAL", message: "Error interno del servidor" }),
    );

    expect(response.status).toBe(500);

    consoleSpy.mockRestore();
  });

  it("normaliza un error desconocido a INTERNAL y 500", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const response = errorResponse(new Error("boom"));

    expect(response.status).toBe(500);

    consoleSpy.mockRestore();
  });

  it("conserva issues cuando existen", async () => {
    const response = errorResponse(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [{ path: "name", message: "El nombre es obligatorio" }],
      }),
    );

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error.issues).toEqual([
      { path: "name", message: "El nombre es obligatorio" },
    ]);
  });

  it("omite issues cuando no existen", async () => {
    const response = errorResponse(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).not.toHaveProperty("issues");
  });

  it("nunca expone cause en la respuesta", async () => {
    const response = errorResponse(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        cause: new Error("detalle interno"),
      }),
    );

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).not.toHaveProperty("cause");
  });

  it("nunca expone stack en la respuesta", async () => {
    const response = errorResponse(
      new AppError({
        kind: "CONFLICT",
        message: "Ese nombre ya está en uso",
        cause: new Error("duplicate key"),
      }),
    );

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).not.toHaveProperty("stack");
  });

  it("genera logging estructurado con redacción para INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const uriError = new Error(
      "fallo al conectar mongodb://admin:secreto123@cluster0.mongodb.net/inventory",
    );
    const wrapped = new Error("db down", { cause: uriError });
    const request = new Request("http://localhost/api/stock/movements", {
      method: "POST",
    });

    const response = errorResponse(wrapped, request);

    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logged = String(consoleSpy.mock.calls[0]?.[0]);

    consoleSpy.mockRestore();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(logged).not.toContain("secreto123");
    expect(logged).toContain("mongodb://***");

    const entry = JSON.parse(logged) as InternalLogEntry;

    expect(entry.kind).toBe("INTERNAL");
    expect(entry.message).toBe("Error interno del servidor");
    expect(entry.method).toBe("POST");
    expect(entry.pathname).toBe("/api/stock/movements");
    expect(typeof entry.timestamp).toBe("string");
    expect(entry.cause).toContain("mongodb://***");
    expect(entry.stack).toBeTypeOf("string");
  });

  it("no genera logging cuando el error no es INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });

    const response = errorResponse(
      new AppError({ kind: "NOT_FOUND", message: "La categoría no existe" }),
    );

    expect(response.status).toBe(404);
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
    });
  });
});
