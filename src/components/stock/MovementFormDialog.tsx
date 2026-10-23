"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api";
import type { FieldIssue } from "@/lib/errors";
import { toViewStatus, useCreateMovement, useProducts } from "@/lib/queries";
import { createStockMovementSchema } from "@/schemas/stockMovement";
import type { ProductDTO } from "@/types/product";

type MovementFormDialogProps = {
  onClose: () => void;
  product?: Pick<ProductDTO, "_id" | "name">;
};

type MovementFormValues = {
  productId: string;
  type: "IN" | "OUT";
  quantity: string;
  reason: string;
};

type MovementFormErrors = Partial<Record<keyof MovementFormValues, string>>;

const FIELD_ORDER = ["productId", "type", "quantity", "reason"] as const;

const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  productId: "movement-product",
  type: "movement-type",
  quantity: "movement-quantity",
  reason: "movement-reason",
};

const QUANTITY_NAN_MESSAGE = "Ingresá una cantidad entera mayor que 0.";

function issuesToFieldErrors(issues?: FieldIssue[]): MovementFormErrors {
  const errors: MovementFormErrors = {};

  for (const issue of issues ?? []) {
    if (
      issue.path === "productId" ||
      issue.path === "type" ||
      issue.path === "quantity" ||
      issue.path === "reason"
    ) {
      errors[issue.path] = issue.message;
    }
  }

  return errors;
}

function zodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): MovementFormErrors {
  const errors: MovementFormErrors = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");
    if (
      path === "productId" ||
      path === "type" ||
      path === "quantity" ||
      path === "reason"
    ) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

function focusFirstError(errors: MovementFormErrors): void {
  const field = FIELD_ORDER.find((key) => errors[key] !== undefined);
  if (field) document.getElementById(FIELD_IDS[field])?.focus();
}

export function MovementFormDialog({
  onClose,
  product,
}: MovementFormDialogProps) {
  const { control, handleSubmit, getValues, setError, clearErrors } =
    useForm<MovementFormValues>({
      defaultValues: {
        productId: product?._id ?? "",
        type: "IN",
        quantity: "",
        reason: "",
      },
    });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateMovement();
  const productsQuery = useProducts();
  const productsStatus = toViewStatus(productsQuery);
  const products = productsQuery.data ?? [];

  const isPending = createMutation.isPending;
  const noProducts =
    product === undefined &&
    productsStatus === "ready" &&
    products.length === 0;

  const applyFieldErrors = (
    errors: MovementFormErrors,
    type: "validation" | "server",
  ) => {
    for (const key of FIELD_ORDER) {
      const message = errors[key];
      if (message !== undefined) {
        setError(key, { type, message });
      }
    }
  };

  const handleApiError = (error: ApiError) => {
    const fieldErrors = issuesToFieldErrors(error.issues);
    applyFieldErrors(fieldErrors, "server");
    const hasVisibleIssue = (error.issues ?? []).some(
      (issue) => issue.path in FIELD_IDS,
    );
    if (!hasVisibleIssue) setFormError(error.message);
    focusFirstError(fieldErrors);
  };

  const onSubmit = handleSubmit(async () => {
    if (isPending) return;

    clearErrors();
    setFormError(null);

    const values = getValues();
    const productId = values.productId.trim();
    const quantity = Number(values.quantity.trim());
    const reason = values.reason.trim();

    if (!productId) {
      setError("productId", {
        type: "validation",
        message: "Seleccioná un producto.",
      });
      focusFirstError({ productId: "Seleccioná un producto." });
      return;
    }

    if (Number.isNaN(quantity)) {
      setError("quantity", {
        type: "validation",
        message: QUANTITY_NAN_MESSAGE,
      });
      focusFirstError({ quantity: QUANTITY_NAN_MESSAGE });
      return;
    }

    const payload = {
      productId,
      type: values.type,
      quantity,
      reason,
    };

    const result = createStockMovementSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
      applyFieldErrors(fieldErrors, "validation");
      focusFirstError(fieldErrors);
      return;
    }

    try {
      await createMutation.mutateAsync(result.data);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) handleApiError(error);
      else setFormError("No se pudo registrar el movimiento.");
    }
  });

  return (
    <Dialog
      title="Registrar movimiento"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 text-body text-status-out-text"
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-px size-4 shrink-0"
            />
            <span>{formError}</span>
          </p>
        ) : null}

        <Controller
          control={control}
          name="productId"
          render={({ field, fieldState }) =>
            product ? (
              <FormField
                id="movement-product"
                label="Producto"
                required
                error={fieldState.error?.message}
                inputProps={{
                  value: product.name,
                  readOnly: true,
                }}
              />
            ) : noProducts ? (
              <div className="flex flex-col items-start gap-3 rounded-nested border border-border-strong bg-surface-nested p-4">
                <p className="text-body text-text-secondary">
                  No hay productos registrados. Para registrar un movimiento
                  primero necesitás al menos un producto.
                </p>
                <Link
                  href="/products"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-label text-secondary-btn-text transition-colors duration-150 ease-emphasized hover:bg-surface-nested focus-visible:outline-primary"
                >
                  Ir a Productos
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Select
                  id="movement-product"
                  label="Producto"
                  required
                  error={fieldState.error?.message}
                  hint={
                    productsStatus === "error"
                      ? "No se pudieron cargar los productos."
                      : undefined
                  }
                  selectProps={{
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    disabled: isPending || productsStatus !== "ready",
                  }}
                >
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                {productsStatus === "error" ? (
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => void productsQuery.refetch()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          }
        />

        <Controller
          control={control}
          name="type"
          render={({ field, fieldState }) => (
            <Select
              id="movement-type"
              label="Tipo"
              required
              error={fieldState.error?.message}
              selectProps={{
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                disabled: isPending || noProducts,
              }}
            >
              <option value="IN">Entrada</option>
              <option value="OUT">Salida</option>
            </Select>
          )}
        />

        <Controller
          control={control}
          name="quantity"
          render={({ field, fieldState }) => (
            <FormField
              id="movement-quantity"
              label="Cantidad"
              required
              error={fieldState.error?.message}
              inputProps={{
                type: "number",
                min: 1,
                step: 1,
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                disabled: isPending || noProducts,
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="reason"
          render={({ field, fieldState }) => (
            <Textarea
              id="movement-reason"
              label="Motivo"
              required
              error={fieldState.error?.message}
              textareaProps={{
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                maxLength: 500,
                rows: 3,
                disabled: isPending || noProducts,
              }}
            />
          )}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || noProducts}>
            {isPending ? "Registrando…" : "Registrar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
