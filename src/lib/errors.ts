import { z } from "zod";
import mongoose from "mongoose";

export type AppErrorKind =
  | "VALIDATION"
  | "CONFLICT"
  | "NOT_FOUND"
  | "INTERNAL";

export interface FieldIssue {
  path: string;
  message: string;
}

export interface AppErrorShape {
  kind: AppErrorKind;
  message: string;
  issues?: FieldIssue[];
}

interface AppErrorOptions {
  kind: AppErrorKind;
  message: string;
  issues?: FieldIssue[];
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly issues?: FieldIssue[];

  constructor({ kind, message, issues, cause }: AppErrorOptions) {
    super(message, { cause });
    this.name = "AppError";
    this.kind = kind;
    this.issues = issues;
  }

  toJSON(): AppErrorShape {
    return {
      kind: this.kind,
      message: this.message,
      ...(this.issues ? { issues: this.issues } : {}),
    };
  }
}

const DUPLICATE_MESSAGES: Record<string, string> = {
  sku: "El SKU ya existe",
  name: "Ese nombre ya está en uso",
};

interface DuplicateKeyError {
  code: number;
  keyPattern?: Record<string, unknown>;
}

function isDuplicateKeyError(error: unknown): error is DuplicateKeyError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new AppError({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: error.issues.map((issue) =>
        issue.code === "unrecognized_keys"
          ? {
              path: issue.path.join("."),
              message: `Campo no permitido: ${issue.keys.join(", ")}`,
            }
          : { path: issue.path.join("."), message: issue.message },
      ),
      cause: error,
    });
  }

  if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0];
    const message =
      (field ? DUPLICATE_MESSAGES[field] : undefined) ??
      "Ya existe un registro con esos datos";
    return new AppError({
      kind: "CONFLICT",
      message,
      issues: field ? [{ path: field, message }] : undefined,
      cause: error,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return new AppError({
      kind: "VALIDATION",
      message: "Datos inválidos",
      issues: Object.entries(error.errors).map(([path, err]) => ({
        path,
        message: err.message,
      })),
      cause: error,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return new AppError({
      kind: "VALIDATION",
      message: "Valor con formato inválido",
      issues: [{ path: error.path, message: `El valor de ${error.path} no es válido` }],
      cause: error,
    });
  }

  return new AppError({
    kind: "INTERNAL",
    message: "Error interno del servidor",
    cause: error,
  });
}
