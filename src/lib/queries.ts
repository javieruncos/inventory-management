import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createCategory,
  createMovement,
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
  type UpdateCategoryInput,
  type UpdateProductInput,
  type UpdateSupplierInput,
} from "@/lib/api";
import type { CreateCategoryInput } from "@/schemas/category";
import type { CreateProductInput } from "@/schemas/product";
import type { CreateStockMovementInput } from "@/schemas/stockMovement";
import type { CreateSupplierInput } from "@/schemas/supplier";
import type { StockMovementDTO } from "@/types/stockMovement";

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

function invalidateCategories(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
}

export function createCategoryMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => invalidateCategories(queryClient),
  };
}

export function updateCategoryMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (variables: { id: string; input: UpdateCategoryInput }) =>
      updateCategory(variables.id, variables.input),
    onSuccess: () => invalidateCategories(queryClient),
  };
}

export function deleteCategoryMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => invalidateCategories(queryClient),
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation(createCategoryMutationOptions(queryClient));
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation(updateCategoryMutationOptions(queryClient));
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation(deleteCategoryMutationOptions(queryClient));
}

function invalidateSuppliers(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
}

export function createSupplierMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: () => invalidateSuppliers(queryClient),
  };
}

export function updateSupplierMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (variables: { id: string; input: UpdateSupplierInput }) =>
      updateSupplier(variables.id, variables.input),
    onSuccess: () => invalidateSuppliers(queryClient),
  };
}

export function deleteSupplierMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => invalidateSuppliers(queryClient),
  };
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation(createSupplierMutationOptions(queryClient));
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation(updateSupplierMutationOptions(queryClient));
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation(deleteSupplierMutationOptions(queryClient));
}

function invalidateStockData(
  queryClient: QueryClient,
  productId: string,
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.movements.list });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.movements.byProduct(productId),
  });
  void queryClient.invalidateQueries({ queryKey: queryKeys.products.list });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.products.detail(productId),
  });
}

export function createMovementMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (input: CreateStockMovementInput) => createMovement(input),
    onSuccess: (
      _data: StockMovementDTO,
      variables: CreateStockMovementInput,
    ) => invalidateStockData(queryClient, variables.productId),
  };
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation(createMovementMutationOptions(queryClient));
}
