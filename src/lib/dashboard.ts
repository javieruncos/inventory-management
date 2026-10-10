import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";

export type StockStatus = "outOfStock" | "lowStock" | "normal";

export type MovementFilter = "ALL" | "IN" | "OUT";

export type InventorySummary = {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type MovementWithProduct = {
  _id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  createdAt: string;
  __v?: number;
  product: ProductDTO | null;
};

export const DEFAULT_RECENT_MOVEMENTS_LIMIT = 6;

const STATUS_PRIORITY: Record<StockStatus, number> = {
  outOfStock: 0,
  lowStock: 1,
  normal: 2,
};

export function getStockStatus(
  product: Pick<ProductDTO, "currentStock" | "minimumStock">,
): StockStatus {
  if (product.currentStock === 0) {
    return "outOfStock";
  }

  if (product.minimumStock > 0 && product.currentStock <= product.minimumStock) {
    return "lowStock";
  }

  return "normal";
}

export function summarizeInventory(products: ProductDTO[]): InventorySummary {
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of products) {
    totalUnits += product.currentStock;

    const status = getStockStatus(product);

    if (status === "lowStock") {
      lowStockCount += 1;
    } else if (status === "outOfStock") {
      outOfStockCount += 1;
    }
  }

  return {
    totalProducts: products.length,
    totalUnits,
    lowStockCount,
    outOfStockCount,
  };
}

export function sortByCriticality(products: ProductDTO[]): ProductDTO[] {
  return [...products].sort((a, b) => {
    const statusDiff =
      STATUS_PRIORITY[getStockStatus(a)] - STATUS_PRIORITY[getStockStatus(b)];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return (
      a.currentStock -
      a.minimumStock -
      (b.currentStock - b.minimumStock)
    );
  });
}

export function attachProducts(
  movements: StockMovementDTO[],
  products: ProductDTO[],
): MovementWithProduct[] {
  const productsById = new Map(products.map((product) => [product._id, product]));

  return movements.map((movement) => ({
    ...movement,
    product: productsById.get(movement.productId) ?? null,
  }));
}

export function getRecentMovements(
  movements: StockMovementDTO[],
  products: ProductDTO[],
  options?: { limit?: number },
): MovementWithProduct[] {
  const limit = Math.max(
    0,
    options?.limit ?? DEFAULT_RECENT_MOVEMENTS_LIMIT,
  );

  const sorted = [...movements].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  return attachProducts(sorted, products).slice(0, limit);
}

export function filterMovements(
  movements: StockMovementDTO[],
  filter: MovementFilter,
): StockMovementDTO[] {
  if (filter === "ALL") {
    return [...movements];
  }

  return movements.filter((movement) => movement.type === filter);
}
