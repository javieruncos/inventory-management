"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TriangleAlert,
} from "lucide-react";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import {
  submitLoginForm,
  type LoginFormValues,
} from "@/lib/loginForm";
import { useLogin } from "@/lib/queries";

export default function LoginPage() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();

  const { control, handleSubmit, setError, clearErrors, setFocus } =
    useForm<LoginFormValues>({
      defaultValues: {
        email: "",
        password: "",
      },
    });

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;

    let firstInvalidField: keyof LoginFormValues | null = null;

    await submitLoginForm(values, {
      loginFn: (input) => loginMutation.mutateAsync(input),
      onSuccess: () => {
        router.replace("/");
      },
      onGeneralError: (message) => {
        setGeneralError(message);
      },
      onFieldError: (field, message) => {
        if (!firstInvalidField) firstInvalidField = field;
        setError(field, { type: "manual", message });
      },
      onClearErrors: () => {
        setGeneralError(null);
        clearErrors();
      },
      setSubmitting: setIsSubmitting,
    });

    const fieldToFocus = firstInvalidField;
    if (fieldToFocus) {
      requestAnimationFrame(() => setFocus(fieldToFocus));
    }
  });

  return (
    <div className="login-theme flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto bg-[var(--login-bg)] text-[var(--login-text)] md:grid md:grid-cols-2">
      <LoginBrandPanel />

      <section
        aria-labelledby="login-heading"
        className="login-form-panel flex min-h-0 w-full min-w-0 flex-1 items-center justify-center px-5 py-[clamp(1.25rem,4dvh,3rem)] [@media(max-height:600px)]:py-4 md:px-10"
      >
        <div className="w-full max-w-[528px]">
          <div className="mb-[clamp(1rem,2.5dvh,1.75rem)] [@media(max-height:600px)]:mb-3">
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--login-accent-text)]">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[var(--login-accent-text)]"
              />
              Portal de acceso seguro
            </p>
            <h2
              id="login-heading"
              className="mt-3 text-[clamp(2rem,2.8vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--login-text-strong)] [@media(max-height:600px)]:mt-2"
            >
              Iniciar sesión
            </h2>
            <p className="mt-2 text-pretty text-body text-[var(--login-text-muted)] md:text-body-lg">
              Ingresá tus credenciales para acceder al sistema de inventario.
            </p>
          </div>

          {generalError ? (
            <div
              role="alert"
              className="mb-[clamp(0.75rem,2dvh,1.25rem)] flex items-start gap-2 rounded border border-[var(--login-error-border)] bg-[var(--login-error-bg)] p-3 text-body-sm text-[var(--login-error)]"
            >
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{generalError}</span>
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            noValidate
            aria-busy={isSubmitting}
            className="flex flex-col gap-[clamp(0.875rem,2dvh,1.25rem)] [@media(max-height:600px)]:gap-3"
          >
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <FormField
                  id="login-email"
                  label="Correo electrónico"
                  required
                  tone="dark"
                  leadingIcon={<Mail />}
                  error={fieldState.error?.message}
                  inputRef={field.ref}
                  inputProps={{
                    name: "email",
                    type: "email",
                    value: field.value,
                    onChange: field.onChange,
                    onBlur: field.onBlur,
                    autoComplete: "email",
                    placeholder: "nombre@empresa.com",
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
                  tone="dark"
                  leadingIcon={<Lock />}
                  trailingAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                      className="grid size-11 place-items-center rounded text-[var(--login-text-muted)] transition-colors hover:text-[var(--login-text-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-primary)]"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  }
                  error={fieldState.error?.message}
                  inputRef={field.ref}
                  inputProps={{
                    name: "password",
                    type: showPassword ? "text" : "password",
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
              variant="accent"
              size="lg"
              className="mt-1 w-full"
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
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
