import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";

//TYPES
export type StockStatus = "outOfStock" | "lowStock" | "normal";

//FILTROS
export type MovementFilter = "ALL" | "IN" | "OUT";

//ESTRUCTURA DE DATOS
export type InventorySummary = {
  totalProducts: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type LowStockAlerts = {
  alerts: ProductDTO[];
  total: number;
  hasMore: boolean;
};

//ESTRUCTURA DE MOVIMIENTOS CON PRODUCTO
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

//CONSTANTES POR DEFECTO PARA EL LLIMIT DE MOVIMIENTOS RECIENTES
export const DEFAULT_RECENT_MOVEMENTS_LIMIT = 6;

export const DEFAULT_LOW_STOCK_LIMIT = 6;

// PRIORIDAD DE ESTADO DE STOCK
const STATUS_PRIORITY: Record<StockStatus, number> = {
  outOfStock: 0,
  lowStock: 1,
  normal: 2,
};

//OBTENER ESTADO DEL STOCK
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

//FUNCION PRINCIPAL QUE PERMITIRÁ SUMARIZAR EL INVENTARIO
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

//ORDENAR POR NIVEL DE STOCK ASCENDENTE Y POR CANTIDAD RESTANTE ASCENDENTE
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

export function getLowStockAlerts(
  products: ProductDTO[],
  options?: { limit?: number },
): LowStockAlerts {
  const sorted = sortByCriticality(
    products.filter((product) => getStockStatus(product) !== "normal"),
  );
  const limit = Math.max(0, options?.limit ?? DEFAULT_LOW_STOCK_LIMIT);
  const alerts = sorted.slice(0, limit);

  return {
    alerts,
    total: sorted.length,
    hasMore: sorted.length > alerts.length,
  };
}

//AÑADIR PRODUCTO A LOS MOVIMIENTOS MEDIANTE SU ID
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

//OBTENER MOVIMIENTOS RECIENTES Y ORDENADOS POR FECHA DESCENDENTE
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

//FILTRAR MOVIMIENTOS POR TIPO
export function filterMovements(
  movements: StockMovementDTO[],
  filter: MovementFilter,
): StockMovementDTO[] {
  if (filter === "ALL") {
    return [...movements];
  }

  return movements.filter((movement) => movement.type === filter);
}

//TEXTO DEL CONTADOR DE MOVIMIENTOS VISIBLES SOBRE EL TOTAL FILTRADO
export function recentMovementsCountLabel(
  visible: number,
  total: number,
): string {
  return `Mostrando ${visible} de ${total} ${
    total === 1 ? "movimiento" : "movimientos"
  }`;
}
