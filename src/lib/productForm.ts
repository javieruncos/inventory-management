import type { FieldIssue } from "@/lib/errors";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/schemas/product";

export type ProductFormMode = "create" | "edit";

export type ProductFormValues = {
  name: string;
  sku: string;
  description: string;
  price: string;
  minimumStock: string;
  categoryId: string;
  supplierId: string;
};

export type ProductFormErrors = Record<string, string>;

export type ProductFormParse =
  | { ok: true; payload: CreateProductInput }
  | { ok: false; fieldErrors: ProductFormErrors };

export function issuesToFieldErrors(issues?: FieldIssue[]): ProductFormErrors {
  if (!issues) return {};

  const errors: ProductFormErrors = {};
  for (const issue of issues) {
    errors[issue.path] = issue.message;
  }
  return errors;
}

export function parseProductForm(
  values: ProductFormValues,
  mode: ProductFormMode,
): ProductFormParse {
  const preErrors: ProductFormErrors = {};

  const priceRaw = values.price.trim();
  const price = priceRaw === "" ? Number.NaN : Number(priceRaw);
  if (priceRaw === "") {
    preErrors.price = "El precio es obligatorio";
  } else if (!Number.isFinite(price)) {
    preErrors.price = "El precio debe ser un número";
  }

  const minimumRaw = values.minimumStock.trim();
  let minimumStock: number | undefined;
  if (minimumRaw === "") {
    minimumStock = mode === "edit" ? 0 : undefined;
  } else {
    minimumStock = Number(minimumRaw);
    if (!Number.isFinite(minimumStock)) {
      preErrors.minimumStock = "Debe ser un número entero";
      minimumStock = undefined;
    }
  }

  if (Object.keys(preErrors).length > 0) {
    return { ok: false, fieldErrors: preErrors };
  }

  const parsed = createProductSchema.safeParse({
    name: values.name,
    sku: values.sku,
    description: values.description,
    price,
    minimumStock,
    categoryId: values.categoryId,
    supplierId: values.supplierId === "" ? undefined : values.supplierId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: issuesToFieldErrors(
        parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      ),
    };
  }

  return { ok: true, payload: parsed.data };
}
