import { createCategorySchema } from "@/schemas/category";
import { connectDB } from "@/db/connection";
import CategoryModel, { type Category } from "@/db/models/Category";
import ProductModel from "@/db/models/Product";
import { AppError, normalizeError } from "@/lib/errors";

const updateCategorySchema = createCategorySchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "Debe enviar al menos un campo a actualizar",
    },
  );

export async function createCategory(input: unknown): Promise<Category> {
  try {
    const data = createCategorySchema.parse(input);

    await connectDB();

    return await CategoryModel.create({
      name: data.name,
      description: data.description,
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function listCategories(): Promise<Category[]> {
  try {
    await connectDB();

    return await CategoryModel.find({ deletedAt: null }).sort({ name: 1 });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getCategory(id: string): Promise<Category> {
  try {
    if (typeof id !== "string") {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID debe ser una cadena de texto",
      });
    }

    await connectDB();

    const category = await CategoryModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!category) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "La categoría no existe",
      });
    }

    return category;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<Category> {
  try {
    if (typeof id !== "string") {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID debe ser una cadena de texto",
      });
    }

    const data = updateCategorySchema.parse(input);

    await connectDB();

    const update = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    };

    const category = await CategoryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true, runValidators: true },
    );

    if (!category) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "La categoría no existe",
      });
    }

    return category;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteCategory(id: string): Promise<Category> {
  try {
    if (typeof id !== "string") {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID debe ser una cadena de texto",
      });
    }

    await connectDB();

    const product = await ProductModel.exists({
      categoryId: id,
      deletedAt: null,
    });

    if (product) {
      throw new AppError({
        kind: "CONFLICT",
        message: "La categoría está en uso por productos",
      });
    }

    const category = await CategoryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );

    if (!category) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "La categoría no existe",
      });
    }

    return category;
  } catch (error) {
    throw normalizeError(error);
  }
}
