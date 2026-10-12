"use client";

import { useState, type FormEvent } from "react";
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
  const [values, setValues] = useState<ProductFormValues>(() => ({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    minimumStock: product ? String(product.minimumStock) : "",
    categoryId: product?.categoryId ?? "",
    supplierId: product?.supplierId ?? "",
  }));
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
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

  const categoryMissing =
    values.categoryId !== "" &&
    !categories.some((category) => category._id === values.categoryId);
  const supplierMissing =
    values.supplierId !== "" &&
    !suppliers.some((supplier) => supplier._id === values.supplierId);

  const categoriesUsable =
    categoriesStatus === "ready" && categories.length > 0;
  const canSubmit =
    !isPending &&
    (categoriesUsable || (mode === "edit" && values.categoryId !== ""));

  const categoryHint =
    categoriesStatus === "ready" && categories.length === 0
      ? "No hay categorías disponibles."
      : undefined;
  const categoryLoadError =
    categoriesStatus === "error"
      ? "No se pudieron cargar las categorías."
      : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    setFormError(null);

    const result = parseProductForm(values, mode);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors);
      focusFirstError(result.fieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(result.payload);
      } else if (product) {
        await updateMutation.mutateAsync({
          id: product._id,
          input: result.payload,
        });
      } else {
        setFormError("No se pudo guardar el producto.");
        return;
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        const errors = issuesToFieldErrors(error.issues);
        setFieldErrors(errors);
        const hasVisibleIssue = (error.issues ?? []).some(
          (issue) => issue.path in FIELD_IDS,
        );
        if (!hasVisibleIssue) setFormError(error.message);
        focusFirstError(errors);
      } else {
        setFormError("No se pudo guardar el producto.");
      }
    }
  };

  return (
    <Dialog
      title={mode === "create" ? "Nuevo producto" : "Editar producto"}
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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

        <FormField
          id="product-name"
          label="Nombre"
          required
          error={fieldErrors.name}
          inputProps={{
            value: values.name,
            maxLength: 100,
            disabled: isPending,
            onChange: (event) =>
              setValues((previous) => ({
                ...previous,
                name: event.target.value,
              })),
          }}
        />

        <FormField
          id="product-sku"
          label="SKU"
          required
          error={fieldErrors.sku}
          inputProps={{
            value: values.sku,
            maxLength: 50,
            disabled: isPending,
            onChange: (event) =>
              setValues((previous) => ({
                ...previous,
                sku: event.target.value,
              })),
          }}
        />

        <Textarea
          id="product-description"
          label="Descripción"
          error={fieldErrors.description}
          textareaProps={{
            value: values.description,
            maxLength: 2000,
            rows: 4,
            disabled: isPending,
            onChange: (event) =>
              setValues((previous) => ({
                ...previous,
                description: event.target.value,
              })),
          }}
        />

        <div className="grid gap-3 desktop:grid-cols-2">
          <FormField
            id="product-price"
            label="Precio"
            required
            error={fieldErrors.price}
            inputProps={{
              type: "number",
              min: 0,
              step: "any",
              value: values.price,
              disabled: isPending,
              onChange: (event) =>
                setValues((previous) => ({
                  ...previous,
                  price: event.target.value,
                })),
            }}
          />
          <FormField
            id="product-minimum-stock"
            label="Stock mínimo"
            error={fieldErrors.minimumStock}
            inputProps={{
              type: "number",
              min: 0,
              step: 1,
              value: values.minimumStock,
              disabled: isPending,
              onChange: (event) =>
                setValues((previous) => ({
                  ...previous,
                  minimumStock: event.target.value,
                })),
            }}
          />
        </div>

        <div className="grid gap-3 desktop:grid-cols-2">
          <Select
            id="product-category"
            label="Categoría"
            required
            error={fieldErrors.categoryId ?? categoryLoadError}
            hint={categoryHint}
            selectProps={{
              value: values.categoryId,
              disabled: isPending || categoriesStatus !== "ready",
              onChange: (event) =>
                setValues((previous) => ({
                  ...previous,
                  categoryId: event.target.value,
                })),
            }}
          >
            <option value="">Seleccionar categoría</option>
            {categoryMissing ? (
              <option value={values.categoryId}>Categoría actual</option>
            ) : null}
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            id="product-supplier"
            label="Proveedor"
            error={fieldErrors.supplierId}
            hint={
              suppliersStatus === "error"
                ? "No se pudieron cargar los proveedores."
                : undefined
            }
            selectProps={{
              value: values.supplierId,
              disabled: isPending || suppliersStatus !== "ready",
              onChange: (event) =>
                setValues((previous) => ({
                  ...previous,
                  supplierId: event.target.value,
                })),
            }}
          >
            {mode === "create" || !product?.supplierId ? (
              <option value="">Sin proveedor</option>
            ) : null}
            {supplierMissing ? (
              <option value={values.supplierId}>Proveedor actual</option>
            ) : null}
            {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.name}
              </option>
            ))}
          </Select>
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
