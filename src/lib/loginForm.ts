import { ApiError } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/schemas/auth";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type LoginFormValidationResult =
  | { ok: true; data: LoginInput }
  | { ok: false; fieldErrors: LoginFormErrors };

export function validateLoginForm(
  values: LoginFormValues,
): LoginFormValidationResult {
  const result = loginSchema.safeParse(values);

  if (!result.success) {
    const fieldErrors: LoginFormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "password") {
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
    }
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: result.data };
}

export type LoginErrorResult = {
  generalError?: string;
  fieldErrors?: LoginFormErrors;
};

export function mapLoginError(error: unknown): LoginErrorResult {
  if (error instanceof ApiError) {
    if (error.kind === "UNAUTHORIZED" || error.status === 401) {
      return {
        generalError:
          "Credenciales inválidas. Verificá tu email y contraseña.",
      };
    }

    if (error.kind === "VALIDATION" && error.issues) {
      const fieldErrors: LoginFormErrors = {};
      for (const issue of error.issues) {
        if (issue.path === "email" || issue.path === "password") {
          fieldErrors[issue.path] = issue.message;
        }
      }
      return { fieldErrors };
    }

    if (error.status === 0) {
      return {
        generalError:
          "No se pudo conectar con el servidor. Verificá tu conexión.",
      };
    }

    return {
      generalError: error.message || "Error del servidor. Intentá nuevamente.",
    };
  }

  return {
    generalError:
      "No se pudo conectar con el servidor. Verificá tu conexión.",
  };
}

export type LoginSubmissionCallbacks = {
  loginFn: (input: LoginInput) => Promise<unknown>;
  onSuccess: () => void;
  onGeneralError: (message: string) => void;
  onFieldError: (field: keyof LoginFormValues, message: string) => void;
  onClearErrors: () => void;
  setSubmitting: (submitting: boolean) => void;
};

export async function submitLoginForm(
  values: LoginFormValues,
  callbacks: LoginSubmissionCallbacks,
): Promise<boolean> {
  callbacks.onClearErrors();

  const validation = validateLoginForm(values);
  if (!validation.ok) {
    for (const [field, message] of Object.entries(validation.fieldErrors)) {
      if (message) {
        callbacks.onFieldError(field as keyof LoginFormValues, message);
      }
    }
    return false;
  }

  callbacks.setSubmitting(true);
  try {
    await callbacks.loginFn(validation.data);
    callbacks.onSuccess();
    return true;
  } catch (error) {
    const errorResult = mapLoginError(error);
    if (errorResult.generalError) {
      callbacks.onGeneralError(errorResult.generalError);
    }
    if (errorResult.fieldErrors) {
      for (const [field, message] of Object.entries(errorResult.fieldErrors)) {
        if (message) {
          callbacks.onFieldError(field as keyof LoginFormValues, message);
        }
      }
    }
    return false;
  } finally {
    callbacks.setSubmitting(false);
  }
}

