import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface StockMovement {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  type: "IN" | "OUT";
  quantity: number;
  reason: string;
  createdAt: Date;
}

const stockMovementSchema = new Schema<StockMovement>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["IN", "OUT"],
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "quantity debe ser un número entero",
      },
    },
    reason: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const StockMovementModel: Model<StockMovement> =
  (mongoose.models.StockMovement as Model<StockMovement> | undefined) ??
  mongoose.model<StockMovement>("StockMovement", stockMovementSchema);

export default StockMovementModel;
