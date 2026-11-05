"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Boxes, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import {
  submitLoginForm,
  type LoginFormValues,
} from "@/lib/loginForm";
import { useLogin } from "@/lib/queries";


function IdentitySection() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8 h-full text-[#dfe2ee]">
      <span
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center rounded-control bg-primary-soft text-primary"
      >
        <Boxes size={32} />
      </span>
      <h1 className="text-heading-lg font-semibold text-primary">Inventory Management</h1>
      <p className="mt-2 text-body-sm text-text-secondary max-w-sm">
        Solución completa para llevar el control de productos, movimientos y proveedores.
      </p>
    </div>
  );
}

export default function LoginPage() {

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();


  const { control, handleSubmit, setError, clearErrors } =
    useForm<LoginFormValues>({
      defaultValues: {
        email: "",
        password: "",
      },
    });

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;

    await submitLoginForm(values, {
      loginFn: (input) => loginMutation.mutateAsync(input),
      onSuccess: () => {
        router.replace("/");
      },
      onGeneralError: (message) => {
        setGeneralError(message);
      },
      onFieldError: (field, message) => {
        setError(field, { type: "manual", message });
      },
      onClearErrors: () => {
        setGeneralError(null);
        clearErrors();
      },
      setSubmitting: setIsSubmitting,
    });
  });

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Identity section */}
      <div className="flex w-full items-center justify-center p-12 bg-[#0f131c] text-[#dfe2ee]">
        <IdentitySection />
      </div>

      {/* Form column */}
      <div className="flex w-full items-center justify-center p-12 bg-[#0f131c] text-[#dfe2ee]">
        <Card className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-heading-sm font-semibold text-text">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-body-sm text-text-secondary">
              Ingresá tus credenciales para acceder al sistema de inventario.
            </p>
          </div>

          {generalError ? (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-control border border-status-out-text/30 bg-status-out-bg p-3 text-body-sm text-status-out-text"
            >
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{generalError}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <FormField
                  id="login-email"
                  label="Email"
                  required
                  error={fieldState.error?.message}
                  inputProps={{
                    type: "email",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    autoComplete: "email",
                    placeholder: "usuario@ejemplo.com",
                    disabled: isSubmitting,
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <FormField
                  id="login-password"
                  label="Contraseña"
                  required
                  error={fieldState.error?.message}
                  inputProps={{
                    type: "password",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    autoComplete: "current-password",
                    placeholder: "••••••••",
                    disabled: isSubmitting,
                  }}
                />
              )}
            />

            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
    

  
}
