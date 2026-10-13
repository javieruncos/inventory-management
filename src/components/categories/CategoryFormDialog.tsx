"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError } from "@/lib/api";
import type { FieldIssue } from "@/lib/errors";
import { useCreateCategory, useUpdateCategory } from "@/lib/queries";
import { createCategorySchema } from "@/schemas/category";
import type { CategoryDTO } from "@/types/category";

type CategoryFormMode = "create" | "edit";

type CategoryFormDialogProps = {
  mode: CategoryFormMode;
  category: CategoryDTO | null;
  onClose: () => void;
};

type CategoryFormValues = {
  name: string;
  description: string;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

const FIELD_ORDER = ["name", "description"] as const;

const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  name: "category-name",
  description: "category-description",
};

function issuesToFieldErrors(issues?: FieldIssue[]): CategoryFormErrors {
  const errors: CategoryFormErrors = {};

  for (const issue of issues ?? []) {
    if (issue.path === "name" || issue.path === "description") {
      errors[issue.path] = issue.message;
    }
  }

  return errors;
}

function zodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): CategoryFormErrors {
  const errors: CategoryFormErrors = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");
    if (path === "name" || path === "description") {
      errors[path] = issue.message;
    }
  }

  return errors;
}

function focusFirstError(errors: CategoryFormErrors): void {
  const field = FIELD_ORDER.find((key) => errors[key] !== undefined);
  if (field) document.getElementById(FIELD_IDS[field])?.focus();
}

export function CategoryFormDialog({
  mode,
  category,
  onClose,
}: CategoryFormDialogProps) {
  const { control, handleSubmit, getValues, setError, clearErrors } =
    useForm<CategoryFormValues>({
      defaultValues: {
        name: category?.name ?? "",
        description: category?.description ?? "",
      },
    });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const applyFieldErrors = (
    errors: CategoryFormErrors,
    type: "validation" | "server",
  ) => {
    for (const key of FIELD_ORDER) {
      const message = errors[key];
      if (message !== undefined) {
        setError(key, { type, message });
      }
    }
  };

  const saveCategory = async (payload: CategoryFormValues) => {
    if (mode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (category) {
      await updateMutation.mutateAsync({
        id: category._id,
        input: payload,
      });
    } else {
      setFormError("No se pudo guardar la categoría.");
      return;
    }
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

    const values = getValues();
    const payload: CategoryFormValues = {
      name: values.name.trim(),
      description: values.description.trim(),
    };

    const result = createCategorySchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
      applyFieldErrors(fieldErrors, "validation");
      focusFirstError(fieldErrors);
      return;
    }

    try {
      await saveCategory(payload);
    } catch (error) {
      if (error instanceof ApiError) handleApiError(error);
      else setFormError("No se pudo guardar la categoría.");
    }
  });

  return (
    <Dialog
      title={mode === "create" ? "Nueva categoría" : "Editar categoría"}
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
              id="category-name"
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
          name="description"
          render={({ field, fieldState }) => (
            <Textarea
              id="category-description"
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

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Guardando…"
              : mode === "create"
                ? "Crear categoría"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
