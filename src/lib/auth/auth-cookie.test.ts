import { NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth/jwt";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  setAuthCookie,
} from "@/lib/auth/auth-cookie";

const TOKEN = "signed.jwt.token";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAuthCookieOptions", () => {
  it("devuelve las opciones de cookie requeridas en desarrollo", () => {
    expect(getAuthCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    expect(getAuthCookieOptions()).not.toHaveProperty("domain");
  });

  it("activa Secure en producción", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(getAuthCookieOptions()).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
  });
});

describe("setAuthCookie", () => {
  it("establece la cookie HttpOnly con el token", () => {
    const response = NextResponse.json({ data: { ok: true } });

    const returned = setAuthCookie(response, TOKEN);

    expect(returned).toBe(response);

    const cookie = response.cookies.get(AUTH_COOKIE_NAME);

    expect(cookie).toMatchObject({
      name: AUTH_COOKIE_NAME,
      value: TOKEN,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
    expect(cookie).not.toHaveProperty("domain");
    expect(cookie?.secure).toBeFalsy();
  });

  it("no incluye el token en el cuerpo de la respuesta", async () => {
    const response = NextResponse.json({ data: { ok: true } });

    setAuthCookie(response, TOKEN);

    const body = await response.json();

    expect(JSON.stringify(body)).not.toContain(TOKEN);
  });

  it("incluye los atributos esperados en Set-Cookie", () => {
    const response = NextResponse.json({ data: { ok: true } });

    setAuthCookie(response, TOKEN);

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=${TOKEN}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain(`Max-Age=${ACCESS_TOKEN_TTL_SECONDS}`);
    expect(setCookie).not.toMatch(/;\s*Domain=/i);
    expect(setCookie).not.toContain("Secure");
  });

  it("incluye Secure en producción", () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = NextResponse.json({ data: { ok: true } });

    setAuthCookie(response, TOKEN);

    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain("Secure");
  });
});
