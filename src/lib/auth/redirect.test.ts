import { describe, expect, it } from "vitest";
import { buildLoginPath, getSafeNextPath } from "./redirect";

describe("getSafeNextPath", () => {
  it("falls back to the dashboard for empty values", () => {
    expect(getSafeNextPath(null)).toBe("/");
    expect(getSafeNextPath(undefined)).toBe("/");
    expect(getSafeNextPath("")).toBe("/");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getSafeNextPath("https://example.com")).toBe("/");
    expect(getSafeNextPath("//example.com")).toBe("/");
    expect(getSafeNextPath("/\\example.com")).toBe("/");
  });

  it("rejects login routes to avoid redirect loops", () => {
    expect(getSafeNextPath("/login")).toBe("/");
    expect(getSafeNextPath("/login?next=%2Fstock")).toBe("/");
    expect(getSafeNextPath("/login#form")).toBe("/");
    expect(getSafeNextPath("/login/something")).toBe("/");
  });

  it("preserves internal routes", () => {
    expect(getSafeNextPath("/stock")).toBe("/stock");
    expect(getSafeNextPath("/products/abc?tab=movements")).toBe(
      "/products/abc?tab=movements",
    );
  });
});

describe("buildLoginPath", () => {
  it("encodes safe internal routes", () => {
    expect(buildLoginPath("/stock")).toBe("/login?next=%2Fstock");
    expect(buildLoginPath("/products/abc?tab=movements")).toBe(
      "/login?next=%2Fproducts%2Fabc%3Ftab%3Dmovements",
    );
  });

  it("falls back for unsafe routes", () => {
    expect(buildLoginPath("https://example.com")).toBe("/login?next=%2F");
  });
});
