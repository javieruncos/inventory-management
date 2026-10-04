import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface Category {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

const CategoryModel: Model<Category> =
  (mongoose.models.Category as Model<Category> | undefined) ??
  mongoose.model<Category>("Category", categorySchema);

export default CategoryModel;
