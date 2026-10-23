import { Types } from "mongoose";
import { createStockMovementSchema } from "@/schemas/stockMovement";
import { connectDB } from "@/db/connection";
import ProductModel from "@/db/models/Product";
import StockMovementModel, {
  type StockMovement,
} from "@/db/models/StockMovement";
import { AppError, normalizeError } from "@/lib/errors";

type MovementType = "IN" | "OUT";

type CompensationOutcome = {
  applied: boolean;
  matchedCount: number;
  modifiedCount: number;
  error?: unknown;
};

type CompensationEvent =
  | "stock.compensation.not_applied"
  | "stock.compensation.error";

const MONGO_URI_PATTERN = /mongodb(?:\+srv)?:\/\/[^\s"'\\]+/gi;

function redactMongoUri(value: string): string {
  return value.replace(MONGO_URI_PATTERN, "mongodb://***");
}

function errorMeta(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      kind: error.kind,
      name: error.name,
      message: redactMongoUri(error.message),
    };
  }

  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code;

    return {
      name: error.name,
      message: redactMongoUri(error.message),
      ...(typeof code === "number" ? { code } : {}),
    };
  }

  return {
    name: "UnknownError",
    message: redactMongoUri(String(error)),
  };
}

function logCompensationFailure(params: {
  event: CompensationEvent;
  productId: string;
  movementType: MovementType;
  quantity: number;
  matchedCount: number;
  modifiedCount: number;
  originalError: unknown;
  compensationError?: unknown;
}): void {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: params.event,
      productId: params.productId,
      movementType: params.movementType,
      quantity: params.quantity,
      matchedCount: params.matchedCount,
      modifiedCount: params.modifiedCount,
      originalError: errorMeta(params.originalError),
      ...(params.compensationError !== undefined
        ? { compensationError: errorMeta(params.compensationError) }
        : {}),
    }),
  );
}

async function compensateStock(params: {
  productId: string;
  movementType: MovementType;
  quantity: number;
}): Promise<CompensationOutcome> {
  const isOut = params.movementType === "OUT";

  try {
    const result = await ProductModel.updateOne(
      {
        _id: params.productId,
        deletedAt: null,
        ...(isOut
          ? {}
          : { currentStock: { $gte: params.quantity } }),
      },
      {
        $inc: {
          currentStock: isOut ? params.quantity : -params.quantity,
        },
      },
    );

    return {
      applied: result.matchedCount === 1,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    return {
      applied: false,
      matchedCount: 0,
      modifiedCount: 0,
      error,
    };
  }
}

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
    } catch (createError) {
      const outcome = await compensateStock({
        productId: data.productId,
        movementType: data.type,
        quantity: data.quantity,
      });

      if (!outcome.applied) {
        logCompensationFailure({
          event:
            outcome.error === undefined
              ? "stock.compensation.not_applied"
              : "stock.compensation.error",
          productId: data.productId,
          movementType: data.type,
          quantity: data.quantity,
          matchedCount: outcome.matchedCount,
          modifiedCount: outcome.modifiedCount,
          originalError: createError,
          compensationError: outcome.error,
        });

        throw new AppError({
          kind: "INTERNAL",
          message: "Error interno del servidor",
          cause: createError,
        });
      }

      throw createError;
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
