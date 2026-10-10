export interface StockMovementDTO {
  _id: string;
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  createdAt: string;
  __v?: number;
}
