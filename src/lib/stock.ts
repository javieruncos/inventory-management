import { Types } from "mongoose";
import { createStockMovementSchema } from "@/schemas/stockMovement";
import { connectDB } from "@/db/connection";
import ProductModel from "@/db/models/Product";
import StockMovementModel, {
  type StockMovement,
} from "@/db/models/StockMovement";
import { AppError, normalizeError } from "@/lib/errors";

export async function createMovement(input: unknown): Promise<StockMovement> {
  try {
    const data = createStockMovementSchema.parse(input);

    await connectDB();

    const isOut = data.type === "OUT";

    const product = await ProductModel.findOneAndUpdate(
      isOut
        ? {
            _id: data.productId,
            deletedAt: null,
            currentStock: { $gte: data.quantity },
          }
        : { _id: data.productId, deletedAt: null },
      { $inc: { currentStock: isOut ? -data.quantity : data.quantity } },
      { new: true },
    );

    if (!product) {
      if (isOut) {
        const active = await ProductModel.exists({
          _id: data.productId,
          deletedAt: null,
        });

        if (active) {
          throw new AppError({
            kind: "CONFLICT",
            message: "El stock es insuficiente para realizar la salida",
          });
        }
      }

      throw new AppError({
        kind: "NOT_FOUND",
        message: "El producto no existe",
      });
    }

    try {
      return await StockMovementModel.create({
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
      });
    } catch (error) {
      await ProductModel.updateOne(
        { _id: data.productId },
        { $inc: { currentStock: isOut ? data.quantity : -data.quantity } },
      );

      throw error;
    }
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function listMovements(
  productId?: string,
): Promise<StockMovement[]> {
  try {
    if (productId !== undefined) {
      if (
        typeof productId !== "string" ||
        !productId.trim() ||
        !Types.ObjectId.isValid(productId)
      ) {
        throw new AppError({
          kind: "VALIDATION",
          message: "El ID no es válido",
        });
      }
    }

    await connectDB();

    return await StockMovementModel.find(
      productId !== undefined ? { productId } : {},
    ).sort({ createdAt: -1 });
  } catch (error) {
    throw normalizeError(error);
  }
}
