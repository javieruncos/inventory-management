import { z } from "zod";

const objectId = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Debe ser un ObjectId válido (24 caracteres hexadecimales)",
  );

export const createStockMovementSchema = z.strictObject({
  productId: objectId,
  type: z.enum(["IN", "OUT"], "El tipo debe ser IN o OUT"),
  quantity: z
    .number()
    .int("quantity debe ser un número entero")
    .min(1, "quantity debe ser mayor que 0"),
  reason: z
    .string()
    .trim()
    .min(1, "El motivo es obligatorio")
    .max(500, "El motivo no puede superar 500 caracteres"),
});

export type CreateStockMovementInput = z.infer<
  typeof createStockMovementSchema
>;
