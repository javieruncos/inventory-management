import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface Product {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  description?: string;
  price: number;
  currentStock: number;
  minimumStock: number;
  categoryId: Types.ObjectId;
  supplierId?: Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<Product>(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "currentStock debe ser un número entero",
      },
    },
    minimumStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "minimumStock debe ser un número entero",
      },
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const ProductModel: Model<Product> =
  (mongoose.models.Product as Model<Product> | undefined) ??
  mongoose.model<Product>("Product", productSchema);

export default ProductModel;
