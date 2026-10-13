import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createProduct,
  createSupplier,
  deleteCategory,
  deleteProduct,
  deleteSupplier,
  getCategories,
  getMovements,
  getMovementsByProduct,
  getProduct,
  getProducts,
  getSuppliers,
  updateCategory,
  updateProduct,
  updateSupplier,
} from "@/lib/api";

const fetchMock = vi.fn<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>();

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

const MOVEMENT = {
  _id: "507f1f77bcf86cd799439013",
  productId: "507f1f77bcf86cd799439011",
  type: "IN",
  quantity: 5,
  reason: "Compra inicial",
  createdAt: "2026-01-01T10:00:00.000Z",
};

const CATEGORY = {
  _id: "507f1f77bcf86cd799439021",
  name: "Tecnología",
  description: "Electrónica y más",
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

const CREATE_INPUT = {
  name: "Nuevo Producto",
  sku: "NEW-001",
  price: 1000,
  categoryId: "507f1f77bcf86cd799439012",
  supplierId: undefined,
};

const JSON_HEADERS = { "Content-Type": "application/json" };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProducts", () => {
  it("solicita /api/products y devuelve la lista del envelope", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [PRODUCT] }));

    const result = await getProducts();

    expect(fetchMock).toHaveBeenCalledWith("/api/products", undefined);
    expect(result).toEqual([PRODUCT]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getProducts(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      signal: controller.signal,
    });
  });

  it("convierte el envelope de error en ApiError con kind, status e issues", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "El SKU ya existe",
            issues: [{ path: "sku", message: "El SKU ya existe" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "El SKU ya existe",
      issues: [{ path: "sku", message: "El SKU ya existe" }],
    });
  });

  it("reporta un fallo de red con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
    });
  });

  it("rechaza cuerpos que no son JSON válido", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>oops</html>", { status: 200 }),
    );

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("rechaza data que no valida contra el esquema", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [{ foo: "bar" }] }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });

  it("usa «Error del servidor» cuando el error no trae envelope", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(getProducts()).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "Error del servidor",
    });
  });
});

describe("getMovements", () => {
  it("solicita /api/stock y devuelve los movimientos validados", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [MOVEMENT] }));

    const result = await getMovements();

    expect(fetchMock).toHaveBeenCalledWith("/api/stock", undefined);
    expect(result).toEqual([MOVEMENT]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getMovements(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/stock", {
      signal: controller.signal,
    });
  });

  it("propaga errores de validación del servidor como ApiError", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "VALIDATION",
            message: "Datos inválidos",
            issues: [{ path: "quantity", message: "Valor inválido" }],
          },
        },
        { status: 400 },
      ),
    );

    await expect(getMovements()).rejects.toMatchObject({
      name: "ApiError",
      kind: "VALIDATION",
      status: 400,
      message: "Datos inválidos",
      issues: [{ path: "quantity", message: "Valor inválido" }],
    });
  });
});

describe("createProduct", () => {
  it("hace POST a /api/products con JSON y devuelve el producto creado", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...PRODUCT, ...CREATE_INPUT } }, { status: 201 }),
    );

    const result = await createProduct(CREATE_INPUT);

    expect(fetchMock).toHaveBeenCalledWith("/api/products", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(CREATE_INPUT),
    });
    expect(result).toEqual({ ...PRODUCT, ...CREATE_INPUT });
  });

  it("propaga el CONFLICT de SKU duplicado con issues del servidor", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "El SKU ya existe",
            issues: [{ path: "sku", message: "El SKU ya existe" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(createProduct(CREATE_INPUT)).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "El SKU ya existe",
      issues: [{ path: "sku", message: "El SKU ya existe" }],
    });
  });
});

describe("updateProduct", () => {
  it("hace PUT a /api/products/:id con el body parcial", async () => {
    const updated = { ...PRODUCT, price: 190000 };
    fetchMock.mockResolvedValue(Response.json({ data: updated }));

    const result = await updateProduct(PRODUCT._id, { price: 190000 });

    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${PRODUCT._id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ price: 190000 }),
    });
    expect(result).toEqual(updated);
  });

  it("propaga la VALIDATION del servidor con issues por campo", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "VALIDATION",
            message: "Datos inválidos",
            issues: [
              { path: "price", message: "El precio no puede ser negativo" },
            ],
          },
        },
        { status: 400 },
      ),
    );

    await expect(
      updateProduct(PRODUCT._id, { price: -1 }),
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "VALIDATION",
      status: 400,
      message: "Datos inválidos",
      issues: [{ path: "price", message: "El precio no puede ser negativo" }],
    });
  });
});

describe("deleteProduct", () => {
  it("hace DELETE a /api/products/:id y devuelve el producto archivado", async () => {
    const archived = {
      ...PRODUCT,
      deletedAt: "2026-02-01T10:00:00.000Z",
    };
    fetchMock.mockResolvedValue(Response.json({ data: archived }));

    const result = await deleteProduct(PRODUCT._id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${PRODUCT._id}`, {
      method: "DELETE",
    });
    expect(result).toEqual(archived);
  });

  it("propaga el NOT_FOUND cuando el producto no existe", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "El producto no existe" } },
        { status: 404 },
      ),
    );

    await expect(deleteProduct(PRODUCT._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "El producto no existe",
    });
  });
});

describe("getCategories", () => {
  it("solicita /api/categories y devuelve la lista validada", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [CATEGORY] }));

    const result = await getCategories();

    expect(fetchMock).toHaveBeenCalledWith("/api/categories", undefined);
    expect(result).toEqual([CATEGORY]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getCategories(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/categories", {
      signal: controller.signal,
    });
  });

  it("rechaza data que no valida contra el esquema de categorías", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [{ foo: "bar" }] }));

    await expect(getCategories()).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });
});

describe("getSuppliers", () => {
  it("solicita /api/suppliers y devuelve la lista validada", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [SUPPLIER] }));

    const result = await getSuppliers();

    expect(fetchMock).toHaveBeenCalledWith("/api/suppliers", undefined);
    expect(result).toEqual([SUPPLIER]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getSuppliers(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/suppliers", {
      signal: controller.signal,
    });
  });
});

describe("getProduct", () => {
  it("solicita /api/products/:id y devuelve el producto del envelope", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: PRODUCT }));

    const result = await getProduct(PRODUCT._id);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/products/${PRODUCT._id}`,
      undefined,
    );
    expect(result).toEqual(PRODUCT);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: PRODUCT }));
    const controller = new AbortController();

    await getProduct(PRODUCT._id, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(`/api/products/${PRODUCT._id}`, {
      signal: controller.signal,
    });
  });

  it("propaga el NOT_FOUND cuando el producto no existe o fue eliminado", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "El producto no existe" } },
        { status: 404 },
      ),
    );

    await expect(getProduct(PRODUCT._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "El producto no existe",
    });
  });

  it("rechaza una respuesta que no valida contra el esquema del producto", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...PRODUCT, price: "caro" } }),
    );

    await expect(getProduct(PRODUCT._id)).rejects.toMatchObject({
      name: "ApiError",
      status: 200,
      message: "Respuesta inesperada del servidor",
    });
  });
});

describe("getMovementsByProduct", () => {
  it("solicita /api/stock con ?productId y devuelve la lista validada", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [MOVEMENT] }));

    const result = await getMovementsByProduct(MOVEMENT.productId);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/stock?productId=${MOVEMENT.productId}`,
      undefined,
    );
    expect(result).toEqual([MOVEMENT]);
  });

  it("pasa el AbortSignal a fetch para cancelación", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [] }));
    const controller = new AbortController();

    await getMovementsByProduct(MOVEMENT.productId, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/stock?productId=${MOVEMENT.productId}`,
      { signal: controller.signal },
    );
  });

  it("propaga la VALIDATION del servidor cuando el productId es inválido", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "VALIDATION",
            message: "El ID no es válido",
            issues: [{ path: "productId", message: "El ID no es válido" }],
          },
        },
        { status: 400 },
      ),
    );

    await expect(getMovementsByProduct("nope")).rejects.toMatchObject({
      name: "ApiError",
      kind: "VALIDATION",
      status: 400,
      message: "El ID no es válido",
      issues: [{ path: "productId", message: "El ID no es válido" }],
    });
  });
});

describe("createCategory", () => {
  it("hace POST a /api/categories con el body y devuelve la categoría", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: CATEGORY }, { status: 201 }),
    );
    const input = { name: "Tecnología", description: "Electrónica y más" };

    const result = await createCategory(input);

    expect(fetchMock).toHaveBeenCalledWith("/api/categories", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    });
    expect(result).toEqual(CATEGORY);
  });

  it("propaga el CONFLICT de nombre duplicado con issues del servidor", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "Ese nombre ya está en uso",
            issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(createCategory({ name: "Tecnología" })).rejects.toMatchObject(
      {
        name: "ApiError",
        kind: "CONFLICT",
        status: 409,
        message: "Ese nombre ya está en uso",
        issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
      },
    );
  });

  it("rechaza una respuesta que no valida contra el esquema de categoría", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...CATEGORY, _id: "no-es-un-id" } }, { status: 201 }),
    );

    await expect(createCategory({ name: "Tecnología" })).rejects.toMatchObject(
      {
        name: "ApiError",
        status: 201,
        message: "Respuesta inesperada del servidor",
      },
    );
  });
});

describe("updateCategory", () => {
  it("hace PUT a /api/categories/:id con el body parcial", async () => {
    const updated = { ...CATEGORY, name: "Tecnología 2" };
    fetchMock.mockResolvedValue(Response.json({ data: updated }));

    const result = await updateCategory(CATEGORY._id, {
      name: "Tecnología 2",
    });

    expect(fetchMock).toHaveBeenCalledWith(`/api/categories/${CATEGORY._id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "Tecnología 2" }),
    });
    expect(result).toEqual(updated);
  });

  it("propaga el NOT_FOUND cuando la categoría no existe", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "La categoría no existe" } },
        { status: 404 },
      ),
    );

    await expect(
      updateCategory(CATEGORY._id, { name: "Tecnología 2" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "La categoría no existe",
    });
  });

  it("propaga el CONFLICT de nombre duplicado con issues del servidor", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "Ese nombre ya está en uso",
            issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(
      updateCategory(CATEGORY._id, { name: "Tecnología 2" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "Ese nombre ya está en uso",
      issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
    });
  });
});

describe("deleteCategory", () => {
  it("hace DELETE a /api/categories/:id y devuelve la categoría archivada", async () => {
    const archived = {
      ...CATEGORY,
      deletedAt: "2026-02-01T10:00:00.000Z",
    };
    fetchMock.mockResolvedValue(Response.json({ data: archived }));

    const result = await deleteCategory(CATEGORY._id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/categories/${CATEGORY._id}`, {
      method: "DELETE",
    });
    expect(result).toEqual(archived);
  });

  it("propaga el CONFLICT cuando la categoría está en uso por productos", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "La categoría está en uso por productos",
          },
        },
        { status: 409 },
      ),
    );

    await expect(deleteCategory(CATEGORY._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "La categoría está en uso por productos",
    });
  });

  it("propaga el NOT_FOUND cuando la categoría no existe", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "La categoría no existe" } },
        { status: 404 },
      ),
    );

    await expect(deleteCategory(CATEGORY._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "La categoría no existe",
    });
  });
});

describe("createSupplier", () => {
  it("hace POST a /api/suppliers con el body y devuelve el proveedor", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: SUPPLIER }, { status: 201 }),
    );
    const input = { name: "Acme", email: "contacto@acme.com" };

    const result = await createSupplier(input);

    expect(fetchMock).toHaveBeenCalledWith("/api/suppliers", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    });
    expect(result).toEqual(SUPPLIER);
  });

  it("propaga el CONFLICT de nombre duplicado con issues del servidor", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "Ese nombre ya está en uso",
            issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(createSupplier({ name: "Acme" })).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "Ese nombre ya está en uso",
      issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
    });
  });

  it("rechaza una respuesta que no valida contra el esquema de proveedor", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ data: { ...SUPPLIER, _id: "no-es-un-id" } }, { status: 201 }),
    );

    await expect(createSupplier({ name: "Acme" })).rejects.toMatchObject({
      name: "ApiError",
      status: 201,
      message: "Respuesta inesperada del servidor",
    });
  });
});

describe("updateSupplier", () => {
  it("hace PUT a /api/suppliers/:id con el body parcial", async () => {
    const updated = { ...SUPPLIER, name: "Acme Internacional" };
    fetchMock.mockResolvedValue(Response.json({ data: updated }));

    const result = await updateSupplier(SUPPLIER._id, {
      name: "Acme Internacional",
    });

    expect(fetchMock).toHaveBeenCalledWith(`/api/suppliers/${SUPPLIER._id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "Acme Internacional" }),
    });
    expect(result).toEqual(updated);
  });

  it("propaga el CONFLICT de nombre duplicado con issues del servidor", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "Ese nombre ya está en uso",
            issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
          },
        },
        { status: 409 },
      ),
    );

    await expect(
      updateSupplier(SUPPLIER._id, { name: "Acme" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "Ese nombre ya está en uso",
      issues: [{ path: "name", message: "Ese nombre ya está en uso" }],
    });
  });

  it("propaga el NOT_FOUND cuando el proveedor no existe", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "El proveedor no existe" } },
        { status: 404 },
      ),
    );

    await expect(
      updateSupplier(SUPPLIER._id, { name: "Acme" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "El proveedor no existe",
    });
  });
});

describe("deleteSupplier", () => {
  it("hace DELETE a /api/suppliers/:id y devuelve el proveedor archivado", async () => {
    const archived = {
      ...SUPPLIER,
      deletedAt: "2026-02-01T10:00:00.000Z",
    };
    fetchMock.mockResolvedValue(Response.json({ data: archived }));

    const result = await deleteSupplier(SUPPLIER._id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/suppliers/${SUPPLIER._id}`, {
      method: "DELETE",
    });
    expect(result).toEqual(archived);
  });

  it("propaga el CONFLICT cuando el proveedor está en uso por productos", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            kind: "CONFLICT",
            message: "El proveedor está en uso por productos",
          },
        },
        { status: 409 },
      ),
    );

    await expect(deleteSupplier(SUPPLIER._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "CONFLICT",
      status: 409,
      message: "El proveedor está en uso por productos",
    });
  });

  it("propaga el NOT_FOUND cuando el proveedor no existe", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { error: { kind: "NOT_FOUND", message: "El proveedor no existe" } },
        { status: 404 },
      ),
    );

    await expect(deleteSupplier(SUPPLIER._id)).rejects.toMatchObject({
      name: "ApiError",
      kind: "NOT_FOUND",
      status: 404,
      message: "El proveedor no existe",
    });
  });
});
