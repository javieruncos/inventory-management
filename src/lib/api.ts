import { z } from "zod";
import type { AppErrorKind, FieldIssue } from "@/lib/errors";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";

export class ApiError extends Error {
  readonly kind: AppErrorKind;
  readonly status: number;
  readonly issues?: FieldIssue[];

  constructor(options: {
    kind: AppErrorKind;
    message: string;
    status: number;
    issues?: FieldIssue[];
  }) {
    super(options.message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.issues = options.issues;
  }
}

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/;

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)));

const productSchema: z.ZodType<ProductDTO> = z.object({
  _id: z.string().regex(OBJECT_ID_PATTERN),
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().min(0),
  currentStock: z.number().int().min(0),
  minimumStock: z.number().int().min(0),
  categoryId: z.string().regex(OBJECT_ID_PATTERN),
  supplierId: z.string().regex(OBJECT_ID_PATTERN).nullable().optional(),
  deletedAt: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
  __v: z.number().optional(),
});

const stockMovementSchema: z.ZodType<StockMovementDTO> = z.object({
  _id: z.string().regex(OBJECT_ID_PATTERN),
  productId: z.string().regex(OBJECT_ID_PATTERN),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().min(1),
  reason: z.string().min(1),
  createdAt: isoDate,
  __v: z.number().optional(),
});

const productListSchema = z.array(productSchema);
const movementListSchema = z.array(stockMovementSchema);

const errorEnvelopeSchema = z.object({
  error: z.object({
    kind: z.enum(["VALIDATION", "CONFLICT", "NOT_FOUND", "INTERNAL"]),
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional(),
  }),
});

export async function fetchJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError({
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
    });
  }

  if (!response.ok) {
    let errorBody: unknown = null;

    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }

    const envelope = errorEnvelopeSchema.safeParse(errorBody);

    if (envelope.success) {
      throw new ApiError({ ...envelope.data.error, status: response.status });
    }

    throw new ApiError({
      kind: "INTERNAL",
      status: response.status,
      message: "Error del servidor",
    });
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApiError({
      kind: "INTERNAL",
      status: response.status,
      message: "Respuesta inesperada del servidor",
    });
  }

  const envelope = z.object({ data: schema }).safeParse(body);

  if (!envelope.success) {
    throw new ApiError({
      kind: "INTERNAL",
      status: response.status,
      message: "Respuesta inesperada del servidor",
    });
  }

  return envelope.data.data;
}

export async function getProducts(
  signal?: AbortSignal,
): Promise<ProductDTO[]> {
  return fetchJson(
    "/api/products",
    productListSchema,
    signal ? { signal } : undefined,
  );
}

export async function getMovements(
  signal?: AbortSignal,
): Promise<StockMovementDTO[]> {
  return fetchJson(
    "/api/stock",
    movementListSchema,
    signal ? { signal } : undefined,
  );
}
