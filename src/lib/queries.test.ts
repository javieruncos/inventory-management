import { describe, expect, it, vi } from "vitest";
import { getMovements, getProducts } from "@/lib/api";
import {
  movementsQueryOptions,
  productsQueryOptions,
  queryClientDefaultOptions,
  queryKeys,
  toViewStatus,
} from "@/lib/queries";

vi.mock("@/lib/api", () => ({
  getProducts: vi.fn(),
  getMovements: vi.fn(),
}));

describe("queryKeys", () => {
  it("la clave de lista vive bajo el prefijo de su dominio", () => {
    expect(
      queryKeys.products.list.slice(0, queryKeys.products.all.length),
    ).toEqual(queryKeys.products.all);
    expect(
      queryKeys.movements.list.slice(0, queryKeys.movements.all.length),
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
