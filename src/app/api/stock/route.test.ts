import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";
import type { StockMovement } from "@/db/models/StockMovement";
import { GET, POST } from "@/app/api/stock/route";
import { createMovement, listMovements } from "@/lib/stock";

vi.mock("@/lib/stock", () => ({
  listMovements: vi.fn(),
  createMovement: vi.fn(),
}));

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

const ID = "64b000000000000000000062";
const BASE_URL = "http://localhost/api/stock";

function makeGetRequest(query: string): Request {
  return new Request(`${BASE_URL}${query}`);
}

function makePostRequest(body: string): Request {
  return new Request(BASE_URL, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/stock", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const movements = [
    { _id: "64b000000000000000000070" } as unknown as StockMovement,
  ];

  it("devuelve 200 con todos los movimientos cuando no hay query param", async () => {
    vi.mocked(listMovements).mockResolvedValue(movements);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(listMovements).toHaveBeenCalledWith(undefined);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: movements });
  });

  it("devuelve 200 filtrando cuando ?productId es válido", async () => {
    vi.mocked(listMovements).mockResolvedValue(movements);

    const response = await GET(makeGetRequest(`?productId=${ID}`));

    expect(response.status).toBe(200);
    expect(listMovements).toHaveBeenCalledWith(ID);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: movements });
  });

  it("devuelve 400 sin issues cuando productId es inválido", async () => {
    vi.mocked(listMovements).mockRejectedValue(
      new AppError({ kind: "VALIDATION", message: "El ID no es válido" }),
    );

    const response = await GET(makeGetRequest("?productId=nope"));

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El ID no es válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it('devuelve 400 y pasa "" cuando productId está vacío', async () => {
    vi.mocked(listMovements).mockRejectedValue(
      new AppError({ kind: "VALIDATION", message: "El ID no es válido" }),
    );

    const response = await GET(makeGetRequest("?productId="));

    expect(response.status).toBe(400);
    expect(listMovements).toHaveBeenCalledWith("");

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El ID no es válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 200 con data vacío cuando no hay movimientos", async () => {
    vi.mocked(listMovements).mockResolvedValue([]);

    const response = await GET(makeGetRequest(`?productId=${ID}`));

    expect(response.status).toBe(200);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: [] });
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(listMovements).mockRejectedValue(
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

describe("POST /api/stock", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const inPayload = {
    productId: ID,
    type: "IN",
    quantity: 10,
    reason: "Recepción de mercadería",
  };

  const outPayload = {
    productId: ID,
    type: "OUT",
    quantity: 3,
    reason: "Venta en mostrador",
  };

  const movement = {
    _id: "64b000000000000000000070",
    productId: ID,
    type: "IN",
    quantity: 10,
    reason: "Recepción de mercadería",
  } as unknown as StockMovement;

  it("registra una entrada IN y devuelve 201 con el body exacto", async () => {
    vi.mocked(createMovement).mockResolvedValue(movement);

    const response = await POST(makePostRequest(JSON.stringify(inPayload)));

    expect(response.status).toBe(201);
    expect(createMovement).toHaveBeenCalledWith(inPayload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: movement });
  });

  it("registra una salida OUT y devuelve 201 con el body exacto", async () => {
    vi.mocked(createMovement).mockResolvedValue(movement);

    const response = await POST(makePostRequest(JSON.stringify(outPayload)));

    expect(response.status).toBe(201);
    expect(createMovement).toHaveBeenCalledWith(outPayload);

    const json = (await response.json()) as { data: unknown };

    expect(json).toEqual({ data: movement });
  });

  it("devuelve 400 cuando el JSON está malformado sin llamar a la lib", async () => {
    const response = await POST(makePostRequest('{"productId":'));

    expect(response.status).toBe(400);
    expect(createMovement).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 400 cuando el body está vacío sin llamar a la lib", async () => {
    const response = await POST(makePostRequest(""));

    expect(response.status).toBe(400);
    expect(createMovement).not.toHaveBeenCalled();

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 400 con issues cuando la validación de negocio falla", async () => {
    vi.mocked(createMovement).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [
          {
            path: "productId",
            message:
              "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
          },
        ],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(inPayload)));

    expect(response.status).toBe(400);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: [
        {
          path: "productId",
          message:
            "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
        },
      ],
    });
  });

  it("devuelve 404 cuando el producto no existe", async () => {
    vi.mocked(createMovement).mockRejectedValue(
      new AppError({ kind: "NOT_FOUND", message: "El producto no existe" }),
    );

    const response = await POST(makePostRequest(JSON.stringify(outPayload)));

    expect(response.status).toBe(404);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "NOT_FOUND",
      message: "El producto no existe",
    });
  });

  it("devuelve 409 sin issues cuando el stock es insuficiente", async () => {
    vi.mocked(createMovement).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "El stock es insuficiente para realizar la salida",
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(outPayload)));

    expect(response.status).toBe(409);

    const json = (await response.json()) as ErrorEnvelope;

    expect(json.error).toEqual({
      kind: "CONFLICT",
      message: "El stock es insuficiente para realizar la salida",
    });
    expect(json.error).not.toHaveProperty("issues");
  });

  it("devuelve 500 con error genérico en INTERNAL", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(createMovement).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(inPayload)));

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
