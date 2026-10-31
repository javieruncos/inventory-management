import { describe, expect, it } from "vitest";
import { getSessionGateState } from "@/lib/auth/sessionGate";
import type { AuthUser } from "@/lib/api";

const AUTH_USER: AuthUser = {
  id: "64b7f0c2e1a2b3c4d5e6f7a8",
  email: "admin@example.com",
  role: "admin",
};

describe("getSessionGateState", () => {
  it("devuelve loading mientras la sesión se está consultando", () => {
    expect(
      getSessionGateState({
        data: undefined,
        isFetching: true,
        isError: false,
      }),
    ).toBe("loading");
  });

  it("devuelve authenticated cuando hay un usuario", () => {
    expect(
      getSessionGateState({
        data: AUTH_USER,
        isFetching: false,
        isError: false,
      }),
    ).toBe("authenticated");
  });

  it("devuelve anonymous cuando la consulta resolvió null", () => {
    expect(
      getSessionGateState({
        data: null,
        isFetching: false,
        isError: false,
      }),
    ).toBe("anonymous");
  });

  it("devuelve error ante un fallo sin datos previos", () => {
    expect(
      getSessionGateState({
        data: undefined,
        isFetching: false,
        isError: true,
      }),
    ).toBe("error");
  });

  it("vuelve a loading mientras se reintenta una consulta fallida", () => {
    expect(
      getSessionGateState({
        data: undefined,
        isFetching: true,
        isError: true,
      }),
    ).toBe("loading");
  });

  it("conserva authenticated si falla un refetch con usuario cacheado", () => {
    expect(
      getSessionGateState({
        data: AUTH_USER,
        isFetching: false,
        isError: true,
      }),
    ).toBe("authenticated");
  });

  it("conserva anonymous si falla un refetch con null cacheado", () => {
    expect(
      getSessionGateState({
        data: null,
        isFetching: false,
        isError: true,
      }),
    ).toBe("anonymous");
  });

  it("devuelve loading si todavía no hay datos ni estado de error", () => {
    expect(
      getSessionGateState({
        data: undefined,
        isFetching: false,
        isError: false,
      }),
    ).toBe("loading");
  });
});
