import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getMovements,
  getMovementsByProduct,
  getProduct,
  getProducts,
  getSuppliers,
  updateCategory,
  updateProduct,
} from "@/lib/api";
import type { CreateProductInput } from "@/schemas/product";
import {
  categoriesQueryOptions,
  createCategoryMutationOptions,
  createProductMutationOptions,
  deleteCategoryMutationOptions,
  deleteProductMutationOptions,
  isValidObjectId,
  movementsQueryOptions,
  productMovementsQueryOptions,
  productQueryOptions,
  productsQueryOptions,
  queryClientDefaultOptions,
  queryKeys,
  suppliersQueryOptions,
  toViewStatus,
  updateCategoryMutationOptions,
  updateProductMutationOptions,
} from "@/lib/queries";

vi.mock("@/lib/api", () => ({
  getProducts: vi.fn(),
  getProduct: vi.fn(),
  getMovements: vi.fn(),
  getMovementsByProduct: vi.fn(),
  getCategories: vi.fn(),
  getSuppliers: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const PRODUCT = {
  _id: "507f1f77bcf86cd799439011",
  name: "Teclado Mecánico",
  sku: "KB-001",
  price: 150000,
  currentStock: 3,
  minimumStock: 1,
  categoryId: "507f1f77bcf86cd799439012",
  deletedAt: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
};

const CATEGORY = {
  _id: "507f1f77bcf86cd799439021",
  name: "Tecnología",
  description: "Electrónica",
  deletedAt: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
};

const SUPPLIER = {
  _id: "507f1f77bcf86cd799439022",
  name: "Acme",
  email: "contacto@acme.com",
  phone: "+54 11 5555-0000",
  deletedAt: null,
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-01-01T10:00:00.000Z",
};

const CREATE_INPUT: CreateProductInput = {
  name: "Nuevo Producto",
  sku: "NEW-001",
  price: 1000,
  categoryId: "507f1f77bcf86cd799439012",
  supplierId: undefined,
};

describe("queryKeys", () => {
  it("la clave de lista vive bajo el prefijo de su dominio", () => {
    expect(
      queryKeys.products.list.slice(0, queryKeys.products.all.length),
    ).toEqual(queryKeys.products.all);
    expect(
      queryKeys.movements.list.slice(0, queryKeys.movements.all.length),
    ).toEqual(queryKeys.movements.all);
  });

  it("la clave de detalle y la de movimientos por producto viven bajo su dominio", () => {
    expect(
      queryKeys.products
        .detail("507f1f77bcf86cd799439011")
        .slice(0, queryKeys.products.all.length),
    ).toEqual(queryKeys.products.all);
    expect(
      queryKeys.movements
        .byProduct("507f1f77bcf86cd799439011")
        .slice(0, queryKeys.movements.all.length),
    ).toEqual(queryKeys.movements.all);
  });

  it("los dominios de productos y movimientos son distintos", () => {
    expect(queryKeys.products.all).not.toEqual(queryKeys.movements.all);
    expect(queryKeys.products.list).not.toEqual(queryKeys.movements.list);
  });
});

describe("queryClientDefaultOptions", () => {
  it("configura retry false, refetchOnWindowFocus false y staleTime 0", () => {
    expect(queryClientDefaultOptions.queries.retry).toBe(false);
    expect(queryClientDefaultOptions.queries.refetchOnWindowFocus).toBe(false);
    expect(queryClientDefaultOptions.queries.staleTime).toBe(0);
  });
});

describe("productsQueryOptions", () => {
  it("usa la clave de lista de productos", () => {
    expect(productsQueryOptions().queryKey).toEqual(queryKeys.products.list);
  });

  it("delega el signal de TanStack Query en getProducts", async () => {
    const options = productsQueryOptions();
    const controller = new AbortController();
    vi.mocked(getProducts).mockResolvedValue([]);

    await expect(options.queryFn({ signal: controller.signal })).resolves.toEqual(
      [],
    );

    expect(getProducts).toHaveBeenCalledWith(controller.signal);
  });
});

describe("movementsQueryOptions", () => {
  it("usa la clave de lista de movimientos", () => {
    expect(movementsQueryOptions().queryKey).toEqual(queryKeys.movements.list);
  });

  it("delega el signal de TanStack Query en getMovements", async () => {
    const options = movementsQueryOptions();
    const controller = new AbortController();
    vi.mocked(getMovements).mockResolvedValue([]);

    await expect(options.queryFn({ signal: controller.signal })).resolves.toEqual(
      [],
    );

    expect(getMovements).toHaveBeenCalledWith(controller.signal);
  });
});

describe("toViewStatus", () => {
  it("sin datos y fetch en curso → loading", () => {
    expect(
      toViewStatus({ data: undefined, isFetching: true, isError: false }),
    ).toBe("loading");
  });

  it("datos en caché durante refetch en segundo plano → ready", () => {
    expect(
      toViewStatus({ data: [], isFetching: true, isError: false }),
    ).toBe("ready");
  });

  it("reintento manual sin datos todavía → loading", () => {
    expect(
      toViewStatus({ data: undefined, isFetching: true, isError: true }),
    ).toBe("loading");
  });

  it("error final sin datos → error", () => {
    expect(
      toViewStatus({ data: undefined, isFetching: false, isError: true }),
    ).toBe("error");
  });

  it("datos obsoletos con error de refetch → ready", () => {
    expect(
      toViewStatus({ data: [1], isFetching: false, isError: true }),
    ).toBe("ready");
  });

  it("estado inicial en reposo → loading", () => {
    expect(
      toViewStatus({ data: undefined, isFetching: false, isError: false }),
    ).toBe("loading");
  });
});

describe("queryKeys de categorías y proveedores", () => {
  it("la clave de lista vive bajo el prefijo de su dominio", () => {
    expect(
      queryKeys.categories.list.slice(0, queryKeys.categories.all.length),
    ).toEqual(queryKeys.categories.all);
    expect(
      queryKeys.suppliers.list.slice(0, queryKeys.suppliers.all.length),
    ).toEqual(queryKeys.suppliers.all);
  });

  it("los cuatro dominios son distintos entre sí", () => {
    const domains = [
      queryKeys.products.all,
      queryKeys.movements.all,
      queryKeys.categories.all,
      queryKeys.suppliers.all,
    ];

    for (let i = 0; i < domains.length; i += 1) {
      for (let j = i + 1; j < domains.length; j += 1) {
        expect(domains[i]).not.toEqual(domains[j]);
      }
    }
  });
});

describe("categoriesQueryOptions", () => {
  it("usa la clave de lista de categorías", () => {
    expect(categoriesQueryOptions().queryKey).toEqual(queryKeys.categories.list);
  });

  it("delega el signal de TanStack Query en getCategories", async () => {
    const options = categoriesQueryOptions();
    const controller = new AbortController();
    vi.mocked(getCategories).mockResolvedValue([CATEGORY]);

    await expect(
      options.queryFn({ signal: controller.signal }),
    ).resolves.toEqual([CATEGORY]);

    expect(getCategories).toHaveBeenCalledWith(controller.signal);
  });
});

describe("suppliersQueryOptions", () => {
  it("usa la clave de lista de proveedores", () => {
    expect(suppliersQueryOptions().queryKey).toEqual(queryKeys.suppliers.list);
  });

  it("delega el signal de TanStack Query en getSuppliers", async () => {
    const options = suppliersQueryOptions();
    const controller = new AbortController();
    vi.mocked(getSuppliers).mockResolvedValue([SUPPLIER]);

    await expect(
      options.queryFn({ signal: controller.signal }),
    ).resolves.toEqual([SUPPLIER]);

    expect(getSuppliers).toHaveBeenCalledWith(controller.signal);
  });
});

describe("createProductMutationOptions", () => {
  it("envía el input a createProduct y devuelve el producto", async () => {
    const client = new QueryClient();
    vi.mocked(createProduct).mockResolvedValue(PRODUCT);
    const options = createProductMutationOptions(client);

    await expect(options.mutationFn(CREATE_INPUT)).resolves.toEqual(PRODUCT);

    expect(createProduct).toHaveBeenCalledWith(CREATE_INPUT);
  });

  it("invalida la raíz de productos al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    createProductMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.products.all,
    });
  });
});

describe("updateProductMutationOptions", () => {
  it("envía id e input a updateProduct y devuelve el producto", async () => {
    const client = new QueryClient();
    const updated = { ...PRODUCT, price: 190000 };
    vi.mocked(updateProduct).mockResolvedValue(updated);
    const options = updateProductMutationOptions(client);

    await expect(
      options.mutationFn({ id: PRODUCT._id, input: { price: 190000 } }),
    ).resolves.toEqual(updated);

    expect(updateProduct).toHaveBeenCalledWith(PRODUCT._id, {
      price: 190000,
    });
  });

  it("invalida la raíz de productos al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    updateProductMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.products.all,
    });
  });
});

describe("deleteProductMutationOptions", () => {
  it("envía el id a deleteProduct y devuelve el producto archivado", async () => {
    const client = new QueryClient();
    const archived = { ...PRODUCT, deletedAt: "2026-02-01T10:00:00.000Z" };
    vi.mocked(deleteProduct).mockResolvedValue(archived);
    const options = deleteProductMutationOptions(client);

    await expect(options.mutationFn(PRODUCT._id)).resolves.toEqual(archived);

    expect(deleteProduct).toHaveBeenCalledWith(PRODUCT._id);
  });

  it("invalida la raíz de productos al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    deleteProductMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.products.all,
    });
  });
});

describe("createCategoryMutationOptions", () => {
  it("envía el input a createCategory y devuelve la categoría", async () => {
    const client = new QueryClient();
    vi.mocked(createCategory).mockResolvedValue(CATEGORY);
    const options = createCategoryMutationOptions(client);
    const input = { name: "Tecnología", description: "Electrónica y más" };

    await expect(options.mutationFn(input)).resolves.toEqual(CATEGORY);

    expect(createCategory).toHaveBeenCalledWith(input);
  });

  it("invalida la raíz de categorías al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    createCategoryMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.categories.all,
    });
  });
});

describe("updateCategoryMutationOptions", () => {
  it("envía id e input a updateCategory y devuelve la categoría", async () => {
    const client = new QueryClient();
    const updated = { ...CATEGORY, name: "Tecnología 2" };
    vi.mocked(updateCategory).mockResolvedValue(updated);
    const options = updateCategoryMutationOptions(client);

    await expect(
      options.mutationFn({ id: CATEGORY._id, input: { name: "Tecnología 2" } }),
    ).resolves.toEqual(updated);

    expect(updateCategory).toHaveBeenCalledWith(CATEGORY._id, {
      name: "Tecnología 2",
    });
  });

  it("invalida la raíz de categorías al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    updateCategoryMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.categories.all,
    });
  });
});

describe("deleteCategoryMutationOptions", () => {
  it("envía el id a deleteCategory y devuelve la categoría archivada", async () => {
    const client = new QueryClient();
    const archived = { ...CATEGORY, deletedAt: "2026-02-01T10:00:00.000Z" };
    vi.mocked(deleteCategory).mockResolvedValue(archived);
    const options = deleteCategoryMutationOptions(client);

    await expect(options.mutationFn(CATEGORY._id)).resolves.toEqual(archived);

    expect(deleteCategory).toHaveBeenCalledWith(CATEGORY._id);
  });

  it("invalida la raíz de categorías al tener éxito", () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, "invalidateQueries");

    deleteCategoryMutationOptions(client).onSuccess();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.categories.all,
    });
  });

  it("propaga el error de la API sin tragarlo", async () => {
    const client = new QueryClient();
    const apiError = new Error("La categoría está en uso por productos");
    vi.mocked(deleteCategory).mockRejectedValue(apiError);
    const options = deleteCategoryMutationOptions(client);

    await expect(options.mutationFn(CATEGORY._id)).rejects.toBe(apiError);
  });
});

describe("productQueryOptions", () => {
  it("usa la clave de detalle del producto", () => {
    expect(productQueryOptions(PRODUCT._id).queryKey).toEqual(
      queryKeys.products.detail(PRODUCT._id),
    );
  });

  it("delega el signal de TanStack Query en getProduct", async () => {
    const options = productQueryOptions(PRODUCT._id);
    const controller = new AbortController();
    vi.mocked(getProduct).mockResolvedValue(PRODUCT);

    await expect(
      options.queryFn({ signal: controller.signal }),
    ).resolves.toEqual(PRODUCT);

    expect(getProduct).toHaveBeenCalledWith(PRODUCT._id, controller.signal);
  });
});

describe("productMovementsQueryOptions", () => {
  it("usa la clave de movimientos por producto", () => {
    expect(productMovementsQueryOptions(PRODUCT._id).queryKey).toEqual(
      queryKeys.movements.byProduct(PRODUCT._id),
    );
  });

  it("delega el signal de TanStack Query en getMovementsByProduct", async () => {
    const options = productMovementsQueryOptions(PRODUCT._id);
    const controller = new AbortController();
    vi.mocked(getMovementsByProduct).mockResolvedValue([]);

    await expect(
      options.queryFn({ signal: controller.signal }),
    ).resolves.toEqual([]);

    expect(getMovementsByProduct).toHaveBeenCalledWith(
      PRODUCT._id,
      controller.signal,
    );
  });
});

describe("isValidObjectId", () => {
  it("acepta ids hexadecimales de 24 caracteres", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
  });

  it("rechaza ids con formato inválido", () => {
    expect(isValidObjectId("")).toBe(false);
    expect(isValidObjectId("nope")).toBe(false);
    expect(isValidObjectId("507f1f77bcf86cd79943901z")).toBe(false);
    expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false);
  });
});

describe("invalidación de la consulta de detalle", () => {
  it("invalidar products.all marca como invalidada la key de detalle sin tocar movimientos", async () => {
    const client = new QueryClient();
    vi.mocked(getProduct).mockResolvedValue(PRODUCT);
    vi.mocked(getMovements).mockResolvedValue([]);

    await client.fetchQuery(productQueryOptions(PRODUCT._id));
    await client.fetchQuery(movementsQueryOptions());

    await client.invalidateQueries({ queryKey: queryKeys.products.all });

    expect(
      client.getQueryState(queryKeys.products.detail(PRODUCT._id))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(queryKeys.movements.list)?.isInvalidated,
    ).toBe(false);
  });
});
