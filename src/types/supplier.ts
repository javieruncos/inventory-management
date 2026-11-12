export interface SupplierDTO {
  _id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
