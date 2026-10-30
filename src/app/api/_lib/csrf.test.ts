import { describe, expect, it } from "vitest";
import { assertTrustedOrigin } from "@/app/api/_lib/csrf";
import { ForbiddenError } from "@/lib/auth/auth-errors";

const URL = "http://localhost/api/auth/login";
const ORIGIN = "http://localhost";

function makeRequest(headers: Record<string, string>): Request {
  return new Request(URL, { method: "POST", headers });
}

function expectForbidden(headers: Record<string, string>): void {
  let thrown: unknown;

  try {
    assertTrustedOrigin(makeRequest(headers));
  } catch (error) {
    thrown = error;
  }

  expect(thrown).toBeInstanceOf(ForbiddenError);
  expect(thrown).toMatchObject({
    kind: "FORBIDDEN",
    status: 403,
    message: "No autorizado",
  });
}

describe("assertTrustedOrigin", () => {
  it("acepta un Origin del mismo origen", () => {
    expect(() =>
      assertTrustedOrigin(
        makeRequest({
          Origin: ORIGIN,
          "Sec-Fetch-Site": "same-origin",
        }),
      ),
    ).not.toThrow();
  });

  it("acepta un Origin válido aunque falte Sec-Fetch-Site", () => {
    expect(() =>
      assertTrustedOrigin(makeRequest({ Origin: ORIGIN })),
    ).not.toThrow();
  });

  it("acepta un Origin válido con Sec-Fetch-Site none", () => {
    expect(() =>
      assertTrustedOrigin(
        makeRequest({
          Origin: ORIGIN,
          "Sec-Fetch-Site": "none",
        }),
      ),
    ).not.toThrow();
  });

  it("rechaza un Origin ajeno", () => {
    expectForbidden({
      Origin: "https://evil.example",
      "Sec-Fetch-Site": "same-origin",
    });
  });

  it("rechaza un Origin ausente", () => {
    expectForbidden({
      "Sec-Fetch-Site": "same-origin",
    });
  });

  it("rechaza Origin null", () => {
    expectForbidden({
      Origin: "null",
      "Sec-Fetch-Site": "same-origin",
    });
  });

  it("rechaza un Origin con path o barra final", () => {
    expectForbidden({
      Origin: `${ORIGIN}/`,
      "Sec-Fetch-Site": "same-origin",
    });
  });

  it("rechaza Sec-Fetch-Site cross-site aunque el Origin sea válido", () => {
    expectForbidden({
      Origin: ORIGIN,
      "Sec-Fetch-Site": "cross-site",
    });
  });

  it("rechaza Sec-Fetch-Site same-site aunque el Origin sea válido", () => {
    expectForbidden({
      Origin: ORIGIN,
      "Sec-Fetch-Site": "same-site",
    });
  });

  it("rechaza headers contradictorios con Origin ajeno y Sec-Fetch-Site same-origin", () => {
    expectForbidden({
      Origin: "https://evil.example",
      "Sec-Fetch-Site": "same-origin",
    });
  });

  it("rechaza un valor desconocido de Sec-Fetch-Site", () => {
    expectForbidden({
      Origin: ORIGIN,
      "Sec-Fetch-Site": "desconocido",
    });
  });
});
