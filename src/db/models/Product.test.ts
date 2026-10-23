import { describe, expect, it } from "vitest";
import ProductModel from "@/db/models/Product";

describe("Product schema indexes", () => {
  it("declara sku como índice único parcial solo para activos", () => {
    const indexes = ProductModel.schema
      .indexes()
      .filter(([fields]) => "sku" in fields);

    expect(indexes).toHaveLength(1);

    const [fields, options] = indexes[0];

    expect(fields).toEqual({ sku: 1 });
    expect(options.unique).toBe(true);
    expect(options.name).toBe("sku_active_unique");
    expect(options.partialFilterExpression).toEqual({ deletedAt: null });
    expect(ProductModel.schema.indexes()).toHaveLength(1);
  });

  it("ya no declara el índice único global de sku", () => {
    const globalUniqueIndexes = ProductModel.schema
      .indexes()
      .filter(
        ([fields, options]) =>
          "sku" in fields &&
          options.unique === true &&
          options.partialFilterExpression === undefined,
      );

    expect(globalUniqueIndexes).toHaveLength(0);
  });
});
