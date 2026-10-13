export interface CategoryDTO {
  _id: string;
  name: string;
  description?: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}
