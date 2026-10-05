import { Types } from "mongoose";
import { createSupplierSchema } from "@/schemas/supplier";
import { connectDB } from "@/db/connection";
import SupplierModel, { type Supplier } from "@/db/models/Supplier";
import ProductModel from "@/db/models/Product";
import { AppError, normalizeError } from "@/lib/errors";

const updateSupplierSchema = createSupplierSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "Debe enviar al menos un campo a actualizar",
    },
  );

export async function listSuppliers(): Promise<Supplier[]> {
  try {
    await connectDB();

    return await SupplierModel.find({ deletedAt: null }).sort({ name: 1 });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSupplier(id: string): Promise<Supplier> {
  try {
    if (typeof id !== "string" || !id.trim() || !Types.ObjectId.isValid(id)) {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID no es válido",
      });
    }

    await connectDB();

    const supplier = await SupplierModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!supplier) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "El proveedor no existe",
      });
    }

    return supplier;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createSupplier(input: unknown): Promise<Supplier> {
  try {
    const data = createSupplierSchema.parse(input);

    await connectDB();

    return await SupplierModel.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateSupplier(
  id: string,
  input: unknown,
): Promise<Supplier> {
  try {
    if (typeof id !== "string" || !id.trim() || !Types.ObjectId.isValid(id)) {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID no es válido",
      });
    }

    const data = updateSupplierSchema.parse(input);

    await connectDB();

    const update = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
    };

    const supplier = await SupplierModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      update,
      { new: true, runValidators: true },
    );

    if (!supplier) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "El proveedor no existe",
      });
    }

    return supplier;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteSupplier(id: string): Promise<Supplier> {
  try {
    if (typeof id !== "string" || !id.trim() || !Types.ObjectId.isValid(id)) {
      throw new AppError({
        kind: "VALIDATION",
        message: "El ID no es válido",
      });
    }

    await connectDB();

    const product = await ProductModel.exists({
      supplierId: id,
      deletedAt: null,
    });

    if (product) {
      throw new AppError({
        kind: "CONFLICT",
        message: "El proveedor está en uso por productos",
      });
    }

    const supplier = await SupplierModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );

    if (!supplier) {
      throw new AppError({
        kind: "NOT_FOUND",
        message: "El proveedor no existe",
      });
    }

    return supplier;
  } catch (error) {
    throw normalizeError(error);
  }
}
