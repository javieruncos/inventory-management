import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(254, "El email no puede superar 254 caracteres")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Debe ser un email válido");

const phoneSchema = z.string().trim();

export const createSupplierSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    emailSchema.optional(),
  ),
  phone: z.preprocess(
    (value) => (value === "" ? undefined : value),
    phoneSchema.optional(),
  ),
});

export const clearableEmail = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  emailSchema.nullable().optional(),
);

export const clearablePhone = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  phoneSchema.nullable().optional(),
);

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
