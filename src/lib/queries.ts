import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getMovements,
  getMovementsByProduct,
  getProduct,
  getProducts,
  getSuppliers,
  updateProduct,
  type UpdateProductInput,
} from "@/lib/api";
import type { CreateProductInput } from "@/schemas/product";

export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: ["products", "list"] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  movements: {
    all: ["movements"] as const,
    list: ["movements", "list"] as const,
    byProduct: (id: string) => ["movements", "byProduct", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: ["categories", "list"] as const,
  },
  suppliers: {
    all: ["suppliers"] as const,
    list: ["suppliers", "list"] as const,
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

export function categoriesQueryOptions() {
  return {
    queryKey: queryKeys.categories.list,
    queryFn: ({ signal }: { signal: AbortSignal }) => getCategories(signal),
  };
}

export function suppliersQueryOptions() {
  return {
    queryKey: queryKeys.suppliers.list,
    queryFn: ({ signal }: { signal: AbortSignal }) => getSuppliers(signal),
  };
}

export function productQueryOptions(id: string) {
  return {
    queryKey: queryKeys.products.detail(id),
    queryFn: ({ signal }: { signal: AbortSignal }) => getProduct(id, signal),
  };
}

export function productMovementsQueryOptions(id: string) {
  return {
    queryKey: queryKeys.movements.byProduct(id),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      getMovementsByProduct(id, signal),
  };
}

export function useProducts() {
  return useQuery(productsQueryOptions());
}

export function useMovements() {
  return useQuery(movementsQueryOptions());
}

export function useCategories() {
  return useQuery(categoriesQueryOptions());
}

export function useSuppliers() {
  return useQuery(suppliersQueryOptions());
}

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/;

/** Valida un ObjectId de 24 hex antes de disparar queries de detalle. */
export function isValidObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

export function useProduct(id: string) {
  return useQuery({
    ...productQueryOptions(id),
    enabled: isValidObjectId(id),
  });
}

export function useProductMovements(id: string) {
  return useQuery({
    ...productMovementsQueryOptions(id),
    enabled: isValidObjectId(id),
  });
}

function invalidateProducts(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
}

export function createProductMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => invalidateProducts(queryClient),
  };
}

export function updateProductMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (variables: { id: string; input: UpdateProductInput }) =>
      updateProduct(variables.id, variables.input),
    onSuccess: () => invalidateProducts(queryClient),
  };
}

export function deleteProductMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => invalidateProducts(queryClient),
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation(createProductMutationOptions(queryClient));
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation(updateProductMutationOptions(queryClient));
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation(deleteProductMutationOptions(queryClient));
}
