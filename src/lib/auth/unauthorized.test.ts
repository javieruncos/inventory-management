import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ApiError, type AuthUser } from "@/lib/api";
import {
  handleUnauthorizedError,
  isPrivateUnauthorized,
} from "@/lib/auth/unauthorized";
import { queryKeys } from "@/lib/queries";

const AUTH_USER: AuthUser = {
  id: "64b7f0c2e1a2b3c4d5e6f7a8",
  email: "admin@example.com",
  role: "admin",
};

const PRIVATE_QUERY_ROOTS = [
  queryKeys.products.all,
  queryKeys.movements.all,
  queryKeys.categories.all,
  queryKeys.suppliers.all,
  queryKeys.users.all,
] as const;

const PUBLIC_QUERY_KEY = ["public", "reference"] as const;

function privateUnauthorized(path = "/api/products"): ApiError {
  return new ApiError({
    kind: "UNAUTHORIZED",
    status: 401,
    message: "No autenticado",
    path,
  });
}

function createSeededClient(): QueryClient {
  const client = new QueryClient();

  client.setQueryData(queryKeys.auth.me, AUTH_USER);
  for (const queryKey of PRIVATE_QUERY_ROOTS) {
    client.setQueryData(queryKey, [{ id: "private" }]);
  }
  client.setQueryData(PUBLIC_QUERY_KEY, { id: "public" });

  return client;
}

describe("isPrivateUnauthorized", () => {
  it.each([
    "/api/products",
    "/api/products/64b7f0c2e1a2b3c4d5e6f7a8",
    "/api/categories",
    "/api/suppliers",
    "/api/users",
    "/api/stock",
  ])("detecta un 401 de la ruta privada %s", (path) => {
    expect(isPrivateUnauthorized(privateUnauthorized(path))).toBe(true);
  });

  it("excluye un 401 de login", () => {
    expect(
      isPrivateUnauthorized(privateUnauthorized("/api/auth/login")),
    ).toBe(false);
  });

  it("excluye un 401 de /api/auth/me", () => {
    expect(
      isPrivateUnauthorized(privateUnauthorized("/api/auth/me")),
    ).toBe(false);
  });

  it("excluye errores que no son 401", () => {
    expect(
      isPrivateUnauthorized(
        new ApiError({
          kind: "INTERNAL",
          status: 500,
          message: "Error del servidor",
          path: "/api/products",
        }),
      ),
    ).toBe(false);
  });

  it("excluye errores de red", () => {
    expect(
      isPrivateUnauthorized(
        new ApiError({
          kind: "INTERNAL",
          status: 0,
          message: "No se pudo conectar con el servidor",
          path: "/api/products",
        }),
      ),
    ).toBe(false);
  });

  it("excluye errores sin ruta", () => {
    expect(
      isPrivateUnauthorized(
        new ApiError({
          kind: "UNAUTHORIZED",
          status: 401,
          message: "No autenticado",
        }),
      ),
    ).toBe(false);
  });

  it("excluye errores que no son ApiError", () => {
    expect(isPrivateUnauthorized(new Error("No autenticado"))).toBe(false);
  });
});

describe("handleUnauthorizedError", () => {
  it("marca la sesión como anónima y purga solo las queries privadas", async () => {
    const client = createSeededClient();
    const cancelSpy = vi.spyOn(client, "cancelQueries");
    const removeSpy = vi.spyOn(client, "removeQueries");
    const clearSpy = vi.spyOn(client, "clear");

    await handleUnauthorizedError(client, privateUnauthorized());

    expect(client.getQueryData(queryKeys.auth.me)).toBeNull();

    for (const queryKey of PRIVATE_QUERY_ROOTS) {
      expect(cancelSpy).toHaveBeenCalledWith({ queryKey });
      expect(removeSpy).toHaveBeenCalledWith({ queryKey });
      expect(client.getQueryData(queryKey)).toBeUndefined();
    }

    expect(client.getQueryData(PUBLIC_QUERY_KEY)).toEqual({ id: "public" });
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("es idempotente ante dos 401 concurrentes", async () => {
    const client = createSeededClient();
    const cancelSpy = vi.spyOn(client, "cancelQueries");
    const removeSpy = vi.spyOn(client, "removeQueries");

    await Promise.all([
      handleUnauthorizedError(client, privateUnauthorized()),
      handleUnauthorizedError(client, privateUnauthorized("/api/stock")),
    ]);

    expect(cancelSpy).toHaveBeenCalledTimes(PRIVATE_QUERY_ROOTS.length);
    expect(removeSpy).toHaveBeenCalledTimes(PRIVATE_QUERY_ROOTS.length);
    expect(client.getQueryData(queryKeys.auth.me)).toBeNull();
  });

  it.each([
    new ApiError({
      kind: "INTERNAL",
      status: 500,
      message: "Error del servidor",
      path: "/api/products",
    }),
    new ApiError({
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
      path: "/api/products",
    }),
    new ApiError({
      kind: "FORBIDDEN",
      status: 403,
      message: "Sin permisos",
      path: "/api/products",
    }),
    new ApiError({
      kind: "UNAUTHORIZED",
      status: 401,
      message: "Credenciales inválidas",
      path: "/api/auth/login",
    }),
  ])("no modifica la sesión ante un error no aplicable", async (error) => {
    const client = createSeededClient();
    const cancelSpy = vi.spyOn(client, "cancelQueries");
    const removeSpy = vi.spyOn(client, "removeQueries");

    await handleUnauthorizedError(client, error);

    expect(client.getQueryData(queryKeys.auth.me)).toEqual(AUTH_USER);
    expect(client.getQueryData(queryKeys.products.all)).toEqual([
      { id: "private" },
    ]);
    expect(cancelSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("no vuelve a limpiar si la sesión ya es anónima", async () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.auth.me, null);
    const cancelSpy = vi.spyOn(client, "cancelQueries");

    await handleUnauthorizedError(client, privateUnauthorized());

    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
