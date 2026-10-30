import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no es válido")
    .max(254, "El email no puede superar 254 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria")
    .max(1024, "La contraseña es demasiado larga"),
});

export type LoginInput = z.infer<typeof loginSchema>;
