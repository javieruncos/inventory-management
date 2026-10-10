import { useQuery } from "@tanstack/react-query";
import { getMovements, getProducts } from "@/lib/api";

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: ["products", "list"] as const,
  },
  movements: {
    all: ["movements"] as const,
    list: ["movements", "list"] as const,
  },
};

export const queryClientDefaultOptions = {
  queries: {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  },
};

export type QueryViewStatus = "loading" | "error" | "ready";

type QuerySnapshot = {
  data: unknown;
  isFetching: boolean;
  isError: boolean;
};

export function toViewStatus(query: QuerySnapshot): QueryViewStatus {
  if (query.data !== undefined) return "ready";
  if (query.isFetching) return "loading";
  if (query.isError) return "error";
  return "loading";
}

export function productsQueryOptions() {
  return {
    queryKey: queryKeys.products.list,
    queryFn: ({ signal }: { signal: AbortSignal }) => getProducts(signal),
  };
}

export function movementsQueryOptions() {
  return {
    queryKey: queryKeys.movements.list,
    queryFn: ({ signal }: { signal: AbortSignal }) => getMovements(signal),
  };
}

export function useProducts() {
  return useQuery(productsQueryOptions());
}

export function useMovements() {
  return useQuery(movementsQueryOptions());
}
