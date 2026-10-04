import { z } from "zod";

export const createSupplierSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .trim()
      .max(254, "El email no puede superar 254 caracteres")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ser un email válido")
      .optional(),
  ),
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().optional(),
  ),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
