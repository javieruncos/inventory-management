import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/users/[id]/reactivate/route";
import {
  AuthenticationRequiredError,
  ForbiddenError,
} from "@/lib/auth/auth-errors";
import { requireAdmin } from "@/lib/auth/auth-guards";
import { AppError } from "@/lib/errors";
import { reactivateUser } from "@/lib/users";
import type { UserDTO } from "@/types/user";

vi.mock("@/lib/auth/auth-guards", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/users", () => ({
  reactivateUser: vi.fn(),
}));

const ORIGIN = "http://localhost";
const USER_ID = "507f1f77bcf86cd799439011";
const ADMIN_ID = "507f1f77bcf86cd799439012";
const BASE_URL = `${ORIGIN}/api/users/${USER_ID}/reactivate`;
const ADMIN = {
  id: ADMIN_ID,
  email: "admin@example.com",
  role: "admin" as const,
};
const USER: UserDTO = {
  id: USER_ID,
  email: "user@example.com",
  role: "user",
  isActive: true,
  createdAt: "2026-01-01T10:00:00.000Z",
};

type ErrorEnvelope = {
  error: {
    kind: string;
    message: string;
    issues?: { path: string; message: string }[];
  };
};

function makeRequest(origin: string | null = ORIGIN): Request {
  const headers: Record<string, string> = {};

  if (origin !== null) {
    headers.Origin = origin;
  }

  return new Request(BASE_URL, { method: "POST", headers });
}

function makeContext(id = USER_ID) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireAdmin).mockResolvedValue(ADMIN);
});

describe("POST /api/users/[id]/reactivate", () => {
  it("reactiva un usuario y devuelve 200 con no-store", async () => {
    vi.mocked(reactivateUser).mockResolvedValue(USER);

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(reactivateUser).toHaveBeenCalledWith(USER_ID, ADMIN_ID);

    const body = (await response.json()) as { data: unknown };

    expect(body).toEqual({ data: USER });
  });

  it("devuelve 401 sin autenticación sin reactivar", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reactivateUser).not.toHaveBeenCalled();
  });

  it("devuelve 403 a un usuario sin rol admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reactivateUser).not.toHaveBeenCalled();
  });

  it("rechaza una mutación sin Origin confiable", async () => {
    const response = await POST(makeRequest(null), makeContext());

    expect(response.status).toBe(403);
    expect(reactivateUser).not.toHaveBeenCalled();
  });

  it("propaga el rechazo de auto-reactivación", async () => {
    vi.mocked(reactivateUser).mockRejectedValue(
      new AppError({
        kind: "FORBIDDEN",
        message: "No puedes reactivar tu propia cuenta",
      }),
    );

    const response = await POST(makeRequest(), makeContext(ADMIN_ID));

    expect(response.status).toBe(403);

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "FORBIDDEN",
      message: "No puedes reactivar tu propia cuenta",
    });
  });

  it("devuelve 404 cuando el usuario no existe", async () => {
    vi.mocked(reactivateUser).mockRejectedValue(
      new AppError({
        kind: "NOT_FOUND",
        message: "El usuario no existe",
      }),
    );

    const response = await POST(makeRequest(), makeContext());

    expect(response.status).toBe(404);

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "NOT_FOUND",
      message: "El usuario no existe",
    });
  });

  it("normaliza un CastError como 400 VALIDATION", async () => {
    vi.mocked(reactivateUser).mockRejectedValue(
      new mongoose.Error.CastError("ObjectId", "no-es-un-id", "_id"),
    );

    const response = await POST(makeRequest(), makeContext("no-es-un-id"));

    expect(response.status).toBe(400);

    const body = (await response.json()) as ErrorEnvelope;

    expect(body.error).toEqual({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: "_id", message: "El valor de _id no es válido" }],
    });
  });
});
