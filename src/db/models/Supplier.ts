import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface Supplier {
  _id: Types.ObjectId;
  name: string;
  email?: string | null;
  phone?: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<Supplier>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

supplierSchema.index(
  { name: 1 },
  {
    unique: true,
    name: "name_active_unique",
    partialFilterExpression: { deletedAt: null },
  },
);

const SupplierModel: Model<Supplier> =
  (mongoose.models.Supplier as Model<Supplier> | undefined) ??
  mongoose.model<Supplier>("Supplier", supplierSchema);

export default SupplierModel;
