import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { createCategory } from "@/lib/categories";

describe("createCategory", () => {
  it("rechaza un campo no permitido", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "Tecnología",
        active: true,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "",
        message: "Campo no permitido: active",
      },
    ]);
  });

  it("rechaza un nombre vacío", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "",
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "name",
        message: "El nombre es obligatorio",
      },
    ]);
  });

  it("rechaza un nombre mayor a 100 caracteres", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "a".repeat(101),
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "name",
        message: "El nombre no puede superar 100 caracteres",
      },
    ]);
  });

  it("rechaza una descripción mayor a 2000 caracteres", async () => {
    let thrown: unknown;

    try {
      await createCategory({
        name: "Tecnología",
        description: "d".repeat(2001),
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);

    const result = thrown as AppError;

    expect(result.kind).toBe("VALIDATION");
    expect(result.message).toBe("Datos inválidos");
    expect(result.issues).toEqual([
      {
        path: "description",
        message: "La descripción no puede superar 2000 caracteres",
      },
    ]);
  });
});
