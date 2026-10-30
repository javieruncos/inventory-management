import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";
import {
  authenticateUser,
  InvalidCredentialsError,
  type AuthenticatedUser,
} from "@/lib/auth/auth-service";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth/jwt";

vi.mock("@/lib/auth/auth-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/auth/auth-service")>();

  return {
    ...actual,
    authenticateUser: vi.fn(),
  };
});

const ORIGIN = "http://localhost";
const BASE_URL = `${ORIGIN}/api/auth/login`;
const TOKEN = "signed.jwt.token";
const USER: AuthenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "admin@example.com",
  role: "admin",
};

function makeRequest(
  body: string,
  origin: string | null = ORIGIN,
): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

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
  vi.mocked(authenticateUser).mockResolvedValue({ token: TOKEN, user: USER });
});

describe("POST /api/auth/login", () => {
  it("autentica, devuelve el usuario y crea la cookie HttpOnly", async () => {
    const response = await POST(
      makeRequest(
        JSON.stringify({
          email: "  Admin@Example.COM  ",
          password: "correct-password",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(authenticateUser).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "correct-password",
    });

    const body = (await response.json()) as unknown;

    expect(body).toEqual({ data: USER });
    expect(JSON.stringify(body)).not.toContain(TOKEN);

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=${TOKEN}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain(`Max-Age=${ACCESS_TOKEN_TTL_SECONDS}`);
  });

  it("devuelve 401 sin cookie para credenciales inválidas", async () => {
    vi.mocked(authenticateUser).mockRejectedValue(
      new InvalidCredentialsError(),
    );

    const response = await POST(
      makeRequest(
        JSON.stringify({
          email: "admin@example.com",
          password: "wrong-password",
        }),
      ),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toBeNull();

    const body = (await response.json()) as unknown;

    expect(body).toEqual({
      error: {
        kind: "UNAUTHORIZED",
        message: "Credenciales inválidas",
      },
    });
  });

  it("devuelve 400 cuando el body no es JSON válido", async () => {
    const response = await POST(makeRequest('{"email":'));

    expect(response.status).toBe(400);
    expect(authenticateUser).not.toHaveBeenCalled();

    const body = (await response.json()) as unknown;

    expect(body).toEqual({
      error: {
        kind: "VALIDATION",
        message: "El cuerpo debe ser JSON válido",
      },
    });
  });

  it("devuelve 400 con issues cuando el schema no valida", async () => {
    const response = await POST(
      makeRequest(JSON.stringify({ email: "admin@example.com" })),
    );

    expect(response.status).toBe(400);
    expect(authenticateUser).not.toHaveBeenCalled();

    const body = (await response.json()) as {
      error: { kind: string; issues?: { path: string; message: string }[] };
    };

    expect(body.error.kind).toBe("VALIDATION");
    expect(body.error.issues).toEqual([
      expect.objectContaining({ path: "password" }),
    ]);
  });

  it("rechaza CSRF antes de parsear el body", async () => {
    const response = await POST(
      makeRequest('{"email":', "https://evil.example"),
    );

    expect(response.status).toBe(403);
    expect(authenticateUser).not.toHaveBeenCalled();

    const body = (await response.json()) as unknown;

    expect(body).toEqual({
      error: {
        kind: "FORBIDDEN",
        message: "No autorizado",
      },
    });
  });

  it("rechaza CSRF cuando falta Origin", async () => {
    const response = await POST(
      makeRequest(
        JSON.stringify({
          email: "admin@example.com",
          password: "correct-password",
        }),
        null,
      ),
    );

    expect(response.status).toBe(403);
    expect(authenticateUser).not.toHaveBeenCalled();
  });

  it("devuelve 500 sin filtrar detalles internos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(authenticateUser).mockRejectedValue(new Error("db down"));

    const response = await POST(
      makeRequest(
        JSON.stringify({
          email: "admin@example.com",
          password: "correct-password",
        }),
      ),
    );

    expect(response.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();

    const body = (await response.json()) as {
      error: Record<string, unknown>;
    };

    expect(body.error).toEqual({
      kind: "INTERNAL",
      message: "Error interno del servidor",
    });
    expect(body.error).not.toHaveProperty("cause");
    expect(body.error).not.toHaveProperty("stack");
  });
});
