import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth/auth-cookie";

const ORIGIN = "http://localhost";
const BASE_URL = `${ORIGIN}/api/auth/logout`;

function makeRequest(origin: string | null = ORIGIN): Request {
  const headers: Record<string, string> = {};

  if (origin !== null) {
    headers.Origin = origin;
  }

  return new Request(BASE_URL, { method: "POST", headers });
}

describe("POST /api/auth/logout", () => {
  it("limpia la cookie y responde con un contrato consistente", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as unknown;

    expect(body).toEqual({ data: null });

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toContain("Path=/");
  });

  it("es idempotente y no requiere autenticación", async () => {
    const first = await POST(makeRequest());
    const second = await POST(makeRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers.get("set-cookie")).toContain(AUTH_COOKIE_NAME);
    expect(second.headers.get("set-cookie")).toContain(AUTH_COOKIE_NAME);
  });

  it("rechaza CSRF y no limpia la cookie en una petición no confiable", async () => {
    const response = await POST(makeRequest("https://evil.example"));

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store");

    const body = (await response.json()) as unknown;

    expect(body).toEqual({
      error: {
        kind: "FORBIDDEN",
        message: "No autorizado",
      },
    });
  });

  it("rechaza CSRF cuando falta Origin", async () => {
    const response = await POST(makeRequest(null));

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
