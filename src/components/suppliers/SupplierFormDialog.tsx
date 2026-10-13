"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api";
import type { FieldIssue } from "@/lib/errors";
import { useCreateSupplier, useUpdateSupplier } from "@/lib/queries";
import { createSupplierSchema } from "@/schemas/supplier";
import type { SupplierDTO } from "@/types/supplier";

type SupplierFormMode = "create" | "edit";

type SupplierFormDialogProps = {
  mode: SupplierFormMode;
  supplier: SupplierDTO | null;
  onClose: () => void;
};

type SupplierFormValues = {
  name: string;
  email: string;
  phone: string;
};

type SupplierFormErrors = Partial<Record<keyof SupplierFormValues, string>>;

const FIELD_ORDER = ["name", "email", "phone"] as const;

const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  name: "supplier-name",
  email: "supplier-email",
  phone: "supplier-phone",
};

const CLEARING_HINT =
  "Vaciar este campo no elimina el valor guardado en el servidor.";

function issuesToFieldErrors(issues?: FieldIssue[]): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  for (const issue of issues ?? []) {
    if (issue.path === "name" || issue.path === "email" || issue.path === "phone") {
      errors[issue.path] = issue.message;
    }
  }

  return errors;
}

function zodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): SupplierFormErrors {
  const errors: SupplierFormErrors = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");
    if (path === "name" || path === "email" || path === "phone") {
      errors[path] = issue.message;
    }
  }

  return errors;
}

function focusFirstError(errors: SupplierFormErrors): void {
  const field = FIELD_ORDER.find((key) => errors[key] !== undefined);
  if (field) document.getElementById(FIELD_IDS[field])?.focus();
}

function buildMutationPayload(values: SupplierFormValues) {
  const email = values.email.trim();
  const phone = values.phone.trim();

  return {
    name: values.name.trim(),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

export function SupplierFormDialog({
  mode,
  supplier,
  onClose,
}: SupplierFormDialogProps) {
  const { control, handleSubmit, getValues, setError, clearErrors } =
    useForm<SupplierFormValues>({
      defaultValues: {
        name: supplier?.name ?? "",
        email: supplier?.email ?? "",
        phone: supplier?.phone ?? "",
      },
    });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const applyFieldErrors = (
    errors: SupplierFormErrors,
    type: "validation" | "server",
  ) => {
    for (const key of FIELD_ORDER) {
      const message = errors[key];
      if (message !== undefined) {
        setError(key, { type, message });
      }
    }
  };

  const saveSupplier = async (values: SupplierFormValues) => {
    const payload = buildMutationPayload(values);

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
    } else if (supplier) {
      await updateMutation.mutateAsync({
        id: supplier._id,
        input: payload,
      });
    } else {
      setFormError("No se pudo guardar el proveedor.");
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
    const result = createSupplierSchema.safeParse({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error.issues);
      applyFieldErrors(fieldErrors, "validation");
      focusFirstError(fieldErrors);
      return;
    }

    try {
      await saveSupplier(values);
    } catch (error) {
      if (error instanceof ApiError) handleApiError(error);
      else setFormError("No se pudo guardar el proveedor.");
    }
  });

  return (
    <Dialog
      title={mode === "create" ? "Nuevo proveedor" : "Editar proveedor"}
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
              id="supplier-name"
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
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              id="supplier-email"
              label="Email"
              error={fieldState.error?.message}
              hint={mode === "edit" ? CLEARING_HINT : undefined}
              inputProps={{
                type: "email",
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                maxLength: 254,
                autoComplete: "email",
                disabled: isPending,
              }}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormField
              id="supplier-phone"
              label="Teléfono"
              error={fieldState.error?.message}
              hint={mode === "edit" ? CLEARING_HINT : undefined}
              inputProps={{
                type: "tel",
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                autoComplete: "tel",
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
                ? "Crear proveedor"
                : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
