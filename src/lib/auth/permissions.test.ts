import { describe, expect, it } from "vitest";
import { canManageCatalog } from "@/lib/auth/permissions";

describe("canManageCatalog", () => {
  it("permite administrar el catálogo a un administrador", () => {
    expect(canManageCatalog("admin")).toBe(true);
  });

  it("deniega administrar el catálogo a un usuario", () => {
    expect(canManageCatalog("user")).toBe(false);
  });

  it("deniega administrar el catálogo cuando no hay rol", () => {
    expect(canManageCatalog(undefined)).toBe(false);
  });
});
