import { z } from "zod";

export const createCategorySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción no puede superar 2000 caracteres")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
