import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/users/route";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { requireAdmin } from "@/lib/auth/auth-guards";
import { AppError } from "@/lib/errors";
import { createUser, listUsers } from "@/lib/users";
import type { UserDTO } from "@/types/user";

vi.mock("@/lib/auth/auth-guards", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/users", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
}));

const ORIGIN = "http://localhost";
const BASE_URL = `${ORIGIN}/api/users`;
const ADMIN = {
  id: "507f1f77bcf86cd799439012",
  email: "admin@example.com",
  role: "admin" as const,
};
const USER: UserDTO = {
  id: "507f1f77bcf86cd799439011",
  email: "user@example.com",
  role: "user",
  isActive: true,
  createdAt: "2026-01-01T10:00:00.000Z",
};
const INPUT = {
  email: "user@example.com",
  password: "a".repeat(12),
};
const JSON_HEADERS = { "Content-Type": "application/json" };

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

function makePostRequest(
  body: string,
  origin: string | null = ORIGIN,
): Request {
  const headers: Record<string, string> = { ...JSON_HEADERS };

  if (origin !== null) {
    headers.Origin = origin;
  }

  return new Request(BASE_URL, {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue(ADMIN);
});

describe("GET /api/users", () => {
  it("devuelve la lista al administrador con no-store", async () => {
    vi.mocked(listUsers).mockResolvedValue([USER]);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(listUsers).toHaveBeenCalledTimes(1);

    const body = (await response.json()) as { data: unknown };

    expect(body).toEqual({ data: [USER] });
  });

  it("devuelve 401 sin autenticación sin consultar usuarios", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(listUsers).not.toHaveBeenCalled();
  });
});

describe("POST /api/users", () => {
  it("crea un usuario y devuelve 201 con no-store", async () => {
    vi.mocked(createUser).mockResolvedValue(USER);

    const response = await POST(makePostRequest(JSON.stringify(INPUT)));

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith(INPUT);

    const body = (await response.json()) as { data: unknown };

    expect(body).toEqual({ data: USER });
    expect(body.data).not.toHaveProperty("passwordHash");
  });

  it("devuelve 401 sin autenticación antes de parsear el body", async () => {
    const request = makePostRequest('{"email":');
    const jsonSpy = vi.spyOn(request, "json");
    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin antes de parsear el body", async () => {
    const request = makePostRequest(JSON.stringify(INPUT));
    const jsonSpy = vi.spyOn(request, "json");
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(jsonSpy).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rechaza una mutación sin Origin confiable sin crear el usuario", async () => {
    const response = await POST(
      makePostRequest(JSON.stringify(INPUT), null),
    );

    expect(response.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("devuelve 400 cuando el JSON está malformado", async () => {
    const response = await POST(makePostRequest('{"email":'));

    expect(response.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "VALIDATION",
      message: "El cuerpo debe ser JSON válido",
    });
  });

  it("devuelve 400 con issues cuando el schema no valida", async () => {
    vi.mocked(createUser).mockRejectedValue(
      new AppError({
        kind: "VALIDATION",
        message: "Datos inválidos",
        issues: [
          {
            path: "password",
            message: "La contraseña debe tener al menos 12 caracteres",
          },
        ],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(INPUT)));

    expect(response.status).toBe(400);

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: [
        {
          path: "password",
          message: "La contraseña debe tener al menos 12 caracteres",
        },
      ],
    });
  });

  it("devuelve 409 cuando el email ya está en uso", async () => {
    vi.mocked(createUser).mockRejectedValue(
      new AppError({
        kind: "CONFLICT",
        message: "El email ya está en uso",
        issues: [{ path: "email", message: "El email ya está en uso" }],
      }),
    );

    const response = await POST(makePostRequest(JSON.stringify(INPUT)));

    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "CONFLICT",
      message: "El email ya está en uso",
      issues: [{ path: "email", message: "El email ya está en uso" }],
    });
  });
});
