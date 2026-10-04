import { createProductSchema } from "@/schemas/product";
import { connectDB } from "@/db/connection";
import ProductModel, { type Product } from "@/db/models/Product";
import CategoryModel from "@/db/models/Category";
import SupplierModel from "@/db/models/Supplier";
import { AppError, normalizeError } from "@/lib/errors";

const updateProductSchema = createProductSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: "Debe enviar al menos un campo a actualizar" },
  );

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await CategoryModel.exists({ _id: categoryId });
  if (!category) {
    throw new AppError({
      kind: "NOT_FOUND",
      message: "La categoría no existe",
      issues: [{ path: "categoryId", message: "La categoría no existe" }],
    });
  }
}

async function assertSupplierExists(supplierId: string): Promise<void> {
  const supplier = await SupplierModel.exists({ _id: supplierId });
  if (!supplier) {
    throw new AppError({
      kind: "NOT_FOUND",
      message: "El proveedor no existe",
      issues: [{ path: "supplierId", message: "El proveedor no existe" }],
    });
  }
}

export async function createProduct(input: unknown): Promise<Product> {
  try {
    const data = createProductSchema.parse(input);

    await connectDB();

    await assertCategoryExists(data.categoryId);

    if (data.supplierId) {
      await assertSupplierExists(data.supplierId);
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

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<Product> {
  try {
    const data = updateProductSchema.parse(input);

    await connectDB();

    if (data.categoryId !== undefined) {
      await assertCategoryExists(data.categoryId);
    }
    if (data.supplierId !== undefined) {
      await assertSupplierExists(data.supplierId);
    }

    const update = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.minimumStock !== undefined && {
        minimumStock: data.minimumStock,
      }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.supplierId !== undefined && { supplierId: data.supplierId }),
    };

    const product = await ProductModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true, runValidators: true },
    );

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
