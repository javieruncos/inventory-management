import { createProductSchema } from "@/schemas/product";
import { connectDB } from "@/db/connection";
import ProductModel, { type Product } from "@/db/models/Product";
import CategoryModel from "@/db/models/Category";
import SupplierModel from "@/db/models/Supplier";
import { AppError, normalizeError } from "@/lib/errors";

export async function createProduct(input: unknown): Promise<Product> {
  try {
    const data = createProductSchema.parse(input);

    await connectDB();

    const category = await CategoryModel.exists({ _id: data.categoryId });
    if (!category) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "La categoría no existe",
        issues: [{ path: "categoryId", message: "La categoría no existe" }],
      });
    }

    if (data.supplierId) {
      const supplier = await SupplierModel.exists({ _id: data.supplierId });
      if (!supplier) {
        throw new AppError({
          kind: "NOT_FOUND",
          message: "El proveedor no existe",
          issues: [{ path: "supplierId", message: "El proveedor no existe" }],
        });
      }
    }

    return await ProductModel.create({
      name: data.name,
      sku: data.sku,
      description: data.description,
      price: data.price,
      minimumStock: data.minimumStock,
      categoryId: data.categoryId,
      supplierId: data.supplierId,
      currentStock: 0,
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function listProducts(): Promise<Product[]> {
  try {
    await connectDB();

    return await ProductModel.find({ deletedAt: null }).sort({ createdAt: -1 });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getProduct(id: string): Promise<Product> {
  try {
    await connectDB();

    const product = await ProductModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!product) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "El producto no existe",
      });
    }

    return product;
  } catch (error) {
    throw normalizeError(error);
  }
}
