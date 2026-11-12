import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/me/route";
import { AuthenticationRequiredError } from "@/lib/auth/auth-errors";
import { requireUser } from "@/lib/auth/auth-guards";
import { AppError } from "@/lib/errors";

vi.mock("@/lib/auth/auth-guards", () => ({
  requireUser: vi.fn(),
}));

const BASE_URL = "http://localhost/api/auth/me";
const USER = {
  id: "507f1f77bcf86cd799439011",
  email: "admin@example.com",
  role: "admin" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("devuelve únicamente los datos públicos del usuario", async () => {
    vi.mocked(requireUser).mockResolvedValue(USER);

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(requireUser).toHaveBeenCalledTimes(1);

    const body = (await response.json()) as { data: unknown };

    expect(body.data).toEqual(USER);
    expect(body.data).not.toHaveProperty("passwordHash");
    expect(body.data).not.toHaveProperty("isActive");
    expect(body.data).not.toHaveProperty("token");
  });

  it("devuelve 401 sin autenticación", async () => {
    vi.mocked(requireUser).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as unknown;

    expect(body).toEqual({
      error: {
        kind: "UNAUTHORIZED",
        message: "No autenticado",
      },
    });
  });

  it("devuelve 401 cuando el usuario no existe o está inactivo", async () => {
    vi.mocked(requireUser).mockRejectedValue(
      new AuthenticationRequiredError(),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(401);
  });

  it("devuelve 500 sin filtrar detalles internos", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(requireUser).mockRejectedValue(
      new Error("mongodb://admin:secreto@cluster"),
    );

    const response = await GET(new Request(BASE_URL));

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

  it("conserva un AppError INTERNAL normalizado sin exponer su cause", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return undefined;
    });
    vi.mocked(requireUser).mockRejectedValue(
      new AppError({
        kind: "INTERNAL",
        message: "Error interno del servidor",
        cause: new Error("db down"),
      }),
    );

    const response = await GET(new Request(BASE_URL));

    expect(response.status).toBe(500);
    consoleSpy.mockRestore();
  });
});
