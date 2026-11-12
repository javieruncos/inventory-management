import { NextResponse } from "next/server";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/auth/jwt";

export const AUTH_COOKIE_NAME = "inventory_access";

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export function getAuthCookieOptions(): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export function setAuthCookie(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    ...getAuthCookieOptions(),
  });

  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    ...getAuthCookieOptions(),
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
