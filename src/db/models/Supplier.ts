import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface Supplier {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<Supplier>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    email: {
      type: String,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, trim: true },
  },
  { timestamps: true },
);

const SupplierModel: Model<Supplier> =
  (mongoose.models.Supplier as Model<Supplier> | undefined) ??
  mongoose.model<Supplier>("Supplier", supplierSchema);

export default SupplierModel;
