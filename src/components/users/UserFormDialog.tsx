"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { ApiError } from "@/lib/api";
import type { FieldIssue } from "@/lib/errors";
import { useCreateUser } from "@/lib/queries";
import { notifySuccess } from "@/lib/sweetAlert";
import { createUserSchema } from "@/schemas/user";

type UserFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

const FIELD_ORDER = ["email", "password", "confirmPassword"] as const;

const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  email: "user-email",
  password: "user-password",
  confirmPassword: "user-confirm-password",
};

function issuesToFieldErrors(issues?: FieldIssue[]): UserFormErrors {
  const errors: UserFormErrors = {};

  for (const issue of issues ?? []) {
    if (issue.path === "email" || issue.path === "password") {
      errors[issue.path] = issue.message;
    }
  }

  return errors;
}

function zodIssuesToFieldErrors(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): UserFormErrors {
  const errors: UserFormErrors = {};

  for (const issue of issues) {
    const path = issue.path.map(String).join(".");
    if (path === "email" || path === "password") {
      errors[path] = issue.message;
    }
  }

  return errors;
}

function focusFirstError(errors: UserFormErrors): void {
  const field = FIELD_ORDER.find((key) => errors[key] !== undefined);
  if (field) document.getElementById(FIELD_IDS[field])?.focus();
}

export function UserFormDialog({ onClose }: { onClose: () => void }) {
  const { control, handleSubmit, getValues, setError, clearErrors } =
    useForm<UserFormValues>({
      defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
      },
    });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateUser();
  const isPending = createMutation.isPending;

  const applyFieldErrors = (
    errors: UserFormErrors,
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
    const email = values.email.trim();
    const fieldErrors: UserFormErrors = {};

    const result = createUserSchema.safeParse({
      email,
      password: values.password,
    });

    if (!result.success) {
      Object.assign(
        fieldErrors,
        zodIssuesToFieldErrors(result.error.issues),
      );
    }

    if (values.password !== values.confirmPassword) {
      fieldErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (Object.keys(fieldErrors).length > 0) {
      applyFieldErrors(fieldErrors, "validation");
      focusFirstError(fieldErrors);
      return;
    }

    try {
      await createMutation.mutateAsync({
        email,
        password: values.password,
      });
      void notifySuccess("Usuario creado");
      onClose();
    } catch (error) {
      if (error instanceof ApiError) handleApiError(error);
      else setFormError("No se pudo crear el usuario.");
    }
  });

  return (
    <Dialog
      title="Nuevo usuario"
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

        <p className="text-caption text-text-secondary">
          Se creará con rol{" "}
          <span className="font-semibold text-text">Usuario</span>.
        </p>

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField
              id="user-email"
              label="Email"
              required
              hint="Se usará para iniciar sesión."
              error={fieldState.error?.message}
              inputProps={{
                type: "email",
                autoComplete: "email",
                maxLength: 254,
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
          name="password"
          render={({ field, fieldState }) => (
            <FormField
              id="user-password"
              label="Contraseña inicial"
              required
              hint="Mínimo 12 caracteres."
              error={fieldState.error?.message}
              inputProps={{
                type: "password",
                autoComplete: "new-password",
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
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormField
              id="user-confirm-password"
              label="Confirmar contraseña"
              required
              hint="Debe coincidir con la contraseña inicial."
              error={fieldState.error?.message}
              inputProps={{
                type: "password",
                autoComplete: "new-password",
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
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
            {isPending ? "Creando…" : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
