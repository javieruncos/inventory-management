import { z } from "zod";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_BYTES = 72;
const textEncoder = new TextEncoder();

function utf8ByteLength(value: string): number {
  return textEncoder.encode(value).length;
}

export const createUserSchema = z.strictObject({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no es válido")
    .max(254, "El email no puede superar 254 caracteres"),
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    )
    .refine(
      (value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES,
      `La contraseña no puede superar ${PASSWORD_MAX_BYTES} bytes UTF-8`,
    ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
