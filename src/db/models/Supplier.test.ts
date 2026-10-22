import { describe, expect, it } from "vitest";
import SupplierModel from "@/db/models/Supplier";

describe("Supplier schema indexes", () => {
  it("declara name como índice único parcial solo para activos", () => {
    const indexes = SupplierModel.schema
      .indexes()
      .filter(([fields]) => "name" in fields);

    expect(indexes).toHaveLength(1);

    const [fields, options] = indexes[0];

    expect(fields).toEqual({ name: 1 });
    expect(options.unique).toBe(true);
    expect(options.name).toBe("name_active_unique");
    expect(options.partialFilterExpression).toEqual({ deletedAt: null });
    expect(SupplierModel.schema.indexes()).toHaveLength(1);
  });

  it("ya no declara el índice único global de name", () => {
    const globalUniqueIndexes = SupplierModel.schema
      .indexes()
      .filter(
        ([fields, options]) =>
          "name" in fields &&
          options.unique === true &&
          options.partialFilterExpression === undefined,
      );

    expect(globalUniqueIndexes).toHaveLength(0);
  });
});
