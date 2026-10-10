export interface ProductDTO {
  _id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  currentStock: number;
  minimumStock: number;
  categoryId: string;
  supplierId?: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
