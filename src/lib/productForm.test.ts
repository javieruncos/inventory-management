import { describe, expect, it } from "vitest";
import {
  issuesToFieldErrors,
  parseProductForm,
  type ProductFormValues,
} from "@/lib/productForm";

const VALID_VALUES: ProductFormValues = {
  name: "Teclado Mecánico",
  sku: "kb-001",
  description: "  Switches rojos  ",
  price: "150000",
  minimumStock: "5",
  categoryId: "507f1f77bcf86cd799439012",
  supplierId: "",
};

describe("parseProductForm en modo create", () => {
  it("construye el payload con números, SKU en mayúsculas y sin proveedor", () => {
    const result = parseProductForm(VALID_VALUES, "create");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.name).toBe("Teclado Mecánico");
    expect(result.payload.sku).toBe("KB-001");
    expect(result.payload.description).toBe("Switches rojos");
    expect(result.payload.price).toBe(150000);
    expect(result.payload.minimumStock).toBe(5);
    expect(result.payload.categoryId).toBe("507f1f77bcf86cd799439012");
    expect(result.payload.supplierId).toBeUndefined();
  });

  it("omite minimumStock cuando el campo está vacío", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, minimumStock: "" },
      "create",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.minimumStock).toBeUndefined();
  });

  it("conserva description vacía como string para limpiar en edición", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, description: "" },
      "create",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.description).toBe("");
  });
});

describe("parseProductForm en modo edit", () => {
  it("convierte minimumStock vacío en 0 para desactivar el umbral", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, minimumStock: "" },
      "edit",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.minimumStock).toBe(0);
  });

  it("acepta un payload con todos los campos enviados", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, supplierId: "507f1f77bcf86cd799439013" },
      "edit",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.supplierId).toBe("507f1f77bcf86cd799439013");
  });
});

describe("parseProductForm pre-validaciones en español", () => {
  it("precio vacío → «El precio es obligatorio»", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, price: "   " },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { price: "El precio es obligatorio" },
    });
  });

  it("precio no numérico → «El precio debe ser un número»", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, price: "abc" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { price: "El precio debe ser un número" },
    });
  });

  it("minimumStock no numérico → «Debe ser un número entero»", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, minimumStock: "abc" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { minimumStock: "Debe ser un número entero" },
    });
  });
});

describe("parseProductForm mapea los issues de Zod por path", () => {
  it("precio negativo → mensaje propio del schema", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, price: "-1" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { price: "El precio no puede ser negativo" },
    });
  });

  it("minimumStock decimal → mensaje de entero del schema", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, minimumStock: "1.5" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { minimumStock: "minimumStock debe ser un número entero" },
    });
  });

  it("nombre vacío → «El nombre es obligatorio»", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, name: "" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { name: "El nombre es obligatorio" },
    });
  });

  it("SKU demasiado largo → mensaje de longitud", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, sku: "A".repeat(51) },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { sku: "El SKU no puede superar 50 caracteres" },
    });
  });

  it("categoryId vacío → mensaje de ObjectId", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, categoryId: "" },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        categoryId:
          "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
      },
    });
  });

  it("description de más de 2000 caracteres → mensaje de longitud", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, description: "a".repeat(2001) },
      "create",
    );

    expect(result).toEqual({
      ok: false,
      fieldErrors: { description: "La descripción no puede superar 2000 caracteres" },
    });
  });

  it("devuelve todos los paths afectados cuando fallan varios campos", () => {
    const result = parseProductForm(
      { ...VALID_VALUES, name: "", sku: "" },
      "create",
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(Object.keys(result.fieldErrors).sort()).toEqual(["name", "sku"]);
  });
});

describe("issuesToFieldErrors", () => {
  it("convierte la lista de issues en un mapa path → mensaje", () => {
    expect(
      issuesToFieldErrors([
        { path: "sku", message: "El SKU ya existe" },
        { path: "categoryId", message: "La categoría no existe" },
      ]),
    ).toEqual({
      sku: "El SKU ya existe",
      categoryId: "La categoría no existe",
    });
  });

  it("devuelve un mapa vacío cuando no hay issues", () => {
    expect(issuesToFieldErrors(undefined)).toEqual({});
    expect(issuesToFieldErrors([])).toEqual({});
  });

  it("mantiene el último mensaje cuando un path se repite", () => {
    expect(
      issuesToFieldErrors([
        { path: "sku", message: "Primero" },
        { path: "sku", message: "Segundo" },
      ]),
    ).toEqual({ sku: "Segundo" });
  });
});
