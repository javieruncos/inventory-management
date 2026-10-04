import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
  );

export const createProductSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "El SKU es obligatorio")
    .max(50, "El SKU no puede superar 50 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "La descripción no puede superar 2000 caracteres")
    .optional(),
  price: z.number().min(0, "El precio no puede ser negativo"),
  minimumStock: z
    .number()
    .int("minimumStock debe ser un número entero")
    .min(0, "minimumStock no puede ser negativo")
    .optional(),
  categoryId: objectId,
  supplierId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    objectId.optional(),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
