"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api";
import {
  issuesToFieldErrors,
  parseProductForm,
  type ProductFormErrors,
  type ProductFormMode,
  type ProductFormValues,
} from "@/lib/productForm";
import {
  toViewStatus,
  useCategories,
  useCreateProduct,
  useSuppliers,
  useUpdateProduct,
} from "@/lib/queries";
import { notifySuccess } from "@/lib/sweetAlert";
import type { CreateProductInput } from "@/schemas/product";
import type { ProductDTO } from "@/types/product";

type ProductFormDialogProps = {
  mode: ProductFormMode;
  product: ProductDTO | null;
  onClose: () => void;
};

const FIELD_ORDER = [
  "name",
  "sku",
  "description",
  "price",
  "minimumStock",
  "categoryId",
  "supplierId",
] as const;

const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  name: "product-name",
  sku: "product-sku",
  description: "product-description",
  price: "product-price",
  minimumStock: "product-minimum-stock",
  categoryId: "product-category",
  supplierId: "product-supplier",
};

function focusFirstError(errors: ProductFormErrors): void {
  const field = FIELD_ORDER.find((key) => errors[key] !== undefined);
  if (field) document.getElementById(FIELD_IDS[field])?.focus();
}

export function ProductFormDialog({
  mode,
  product,
  onClose,
}: ProductFormDialogProps) {
  const {
    control,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      minimumStock: product ? String(product.minimumStock) : "",
      categoryId: product?.categoryId ?? "",
      supplierId: product?.supplierId ?? "",
    },
  });
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useCategories();
  const suppliersQuery = useSuppliers();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const categories = categoriesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const categoriesStatus = toViewStatus(categoriesQuery);
  const suppliersStatus = toViewStatus(suppliersQuery);
  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const watchedCategoryId = useWatch({ control, name: "categoryId" });
  const watchedSupplierId = useWatch({ control, name: "supplierId" });

  const categoryMissing =
    watchedCategoryId !== "" &&
    !categories.some((category) => category._id === watchedCategoryId);
  const supplierMissing =
    watchedSupplierId !== "" &&
    !suppliers.some((supplier) => supplier._id === watchedSupplierId);

  const categoriesUsable =
    categoriesStatus === "ready" && categories.length > 0;
  const noCategories = categoriesStatus === "ready" && categories.length === 0;
  const canSubmit =
    !isPending &&
    (categoriesUsable || (mode === "edit" && watchedCategoryId !== ""));

  const applyFieldErrors = (
    errors: ProductFormErrors,
    type: "validation" | "server",
  ) => {
    for (const key of FIELD_ORDER) {
      const message = errors[key];
      if (message !== undefined) {
        setError(key, { type, message });
      }
    }
  };

  const saveProduct = async (payload: CreateProductInput) => {
    let message: string;
    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      message = "Producto creado";
    } else if (product) {
      await updateMutation.mutateAsync({
        id: product._id,
        input: payload,
      });
      message = "Producto actualizado";
    } else {
      setFormError("No se pudo guardar el producto.");
      return;
    }
    void notifySuccess(message);
    onClose();
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

    const result = parseProductForm(getValues(), mode);
    if (!result.ok) {
      applyFieldErrors(result.fieldErrors, "validation");
      focusFirstError(result.fieldErrors);
      return;
    }

    try {
      await saveProduct(result.payload);
    } catch (error) {
      if (error instanceof ApiError) handleApiError(error);
      else setFormError("No se pudo guardar el producto.");
    }
  });

  return (
    <Dialog
      title={mode === "create" ? "Nuevo producto" : "Editar producto"}
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
          name="name"
          render={({ field, fieldState }) => (
            <FormField
              id="product-name"
              label="Nombre"
              required
              error={fieldState.error?.message}
              inputProps={{
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                maxLength: 100,
                disabled: isPending,
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="sku"
          render={({ field, fieldState }) => (
            <FormField
              id="product-sku"
              label="SKU"
              required
              error={fieldState.error?.message}
              inputProps={{
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                maxLength: 50,
                disabled: isPending,
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <Textarea
              id="product-description"
              label="Descripción"
              error={fieldState.error?.message}
              textareaProps={{
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                maxLength: 2000,
                rows: 4,
                disabled: isPending,
              }}
            />
          )}
        />

        <div className="grid gap-3 desktop:grid-cols-2">
          <Controller
            control={control}
            name="price"
            render={({ field, fieldState }) => (
              <FormField
                id="product-price"
                label="Precio"
                required
                error={fieldState.error?.message}
                inputProps={{
                  type: "number",
                  min: 0,
                  step: "any",
                  value: field.value,
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  disabled: isPending,
                }}
              />
            )}
          />
          <Controller
            control={control}
            name="minimumStock"
            render={({ field, fieldState }) => (
              <FormField
                id="product-minimum-stock"
                label="Stock mínimo"
                error={fieldState.error?.message}
                inputProps={{
                  type: "number",
                  min: 0,
                  step: 1,
                  value: field.value,
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  disabled: isPending,
                }}
              />
            )}
          />
        </div>

        <div className="grid gap-3 desktop:grid-cols-2">
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) =>
              noCategories && mode === "create" ? (
                <div className="flex flex-col items-start gap-3 self-stretch rounded-nested border border-border-strong bg-surface-nested p-4">
                  <p className="text-body text-text-secondary">
                    No hay categorías disponibles. Para crear un producto
                    primero necesitás al menos una categoría.
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-label text-secondary-btn-text transition-colors duration-150 ease-emphasized hover:bg-surface-nested focus-visible:outline-primary"
                  >
                    Ir a Categorías
                  </Link>
                </div>
              ) : (
                <Select
                  id="product-category"
                  label="Categoría"
                  required
                  error={
                    fieldState.error?.message ??
                    (categoriesStatus === "error"
                      ? "No se pudieron cargar las categorías."
                      : undefined)
                  }
                  hint={
                    noCategories ? "No hay categorías disponibles." : undefined
                  }
                  selectProps={{
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    disabled: isPending || categoriesStatus !== "ready",
                  }}
                >
                  <option value="">Seleccionar categoría</option>
                  {categoryMissing ? (
                    <option value={field.value}>Categoría actual</option>
                  ) : null}
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              )
            }
          />

          <Controller
            control={control}
            name="supplierId"
            render={({ field, fieldState }) => (
              <Select
                id="product-supplier"
                label="Proveedor"
                error={fieldState.error?.message}
                hint={
                  suppliersStatus === "error"
                    ? "No se pudieron cargar los proveedores."
                    : undefined
                }
                selectProps={{
                  value: field.value,
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  disabled: isPending || suppliersStatus !== "ready",
                }}
              >
                <option value="">Sin proveedor</option>
                {supplierMissing ? (
                  <option value={field.value}>Proveedor actual</option>
                ) : null}
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {isPending
              ? "Guardando…"
              : mode === "create"
                ? "Crear producto"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
