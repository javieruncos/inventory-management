export interface StockMovementDTO {
  _id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  createdAt: string;
  __v?: number;
}

export interface MovementProductDTO {
  _id: string;
  name: string;
  sku: string;
  deletedAt: string | null;
}

export interface StockMovementWithProductDTO extends StockMovementDTO {
  product: MovementProductDTO | null;
}
