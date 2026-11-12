import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
  mapLoginError,
  submitLoginForm,
  validateLoginForm,
  type LoginFormValues,
} from "@/lib/loginForm";

describe("validateLoginForm", () => {
  it("valida correctamente credenciales válidas y normaliza email", () => {
    const input: LoginFormValues = {
      email: "  Admin@Example.COM ",
      password: "password123",
    };

    const result = validateLoginForm(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("admin@example.com");
      expect(result.data.password).toBe("password123");
    }
  });

  it("rechaza email inválido con mensaje en español", () => {
    const input: LoginFormValues = {
      email: "correo-invalido",
      password: "password123",
    };

    const result = validateLoginForm(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe("El email no es válido");
    }
  });

  it("rechaza contraseña vacía con mensaje en español", () => {
    const input: LoginFormValues = {
      email: "admin@example.com",
      password: "",
    };

    const result = validateLoginForm(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.password).toBe("La contraseña es obligatoria");
    }
  });
});

describe("mapLoginError", () => {
  it("retorna mensaje genérico sin revelar datos ante error 401 / UNAUTHORIZED", () => {
    const error = new ApiError({
      kind: "UNAUTHORIZED",
      status: 401,
      message: "Credenciales inválidas",
    });

    const result = mapLoginError(error);

    expect(result.generalError).toBe(
      "Credenciales inválidas. Verificá tu email y contraseña.",
    );
    expect(result.fieldErrors).toBeUndefined();
  });

  it("retorna errores de campo ante error VALIDATION", () => {
    const error = new ApiError({
      kind: "VALIDATION",
      status: 400,
      message: "Error de validación",
      issues: [
        { path: "email", message: "Email incorrecto" },
        { path: "password", message: "Contraseña muy corta" },
      ],
    });

    const result = mapLoginError(error);

    expect(result.fieldErrors).toEqual({
      email: "Email incorrecto",
      password: "Contraseña muy corta",
    });
  });

  it("retorna mensaje de conexión ante error status 0 o error genérico", () => {
    const networkError = new ApiError({
      kind: "INTERNAL",
      status: 0,
      message: "No se pudo conectar con el servidor",
    });

    const result = mapLoginError(networkError);

    expect(result.generalError).toBe(
      "No se pudo conectar con el servidor. Verificá tu conexión.",
    );
  });

  it("retorna mensaje de servidor ante error 500 INTERNAL", () => {
    const serverError = new ApiError({
      kind: "INTERNAL",
      status: 500,
      message: "Error interno en base de datos",
    });

    const result = mapLoginError(serverError);

    expect(result.generalError).toBe("Error interno en base de datos");
  });
});

describe("submitLoginForm", () => {
  it("limpia errores anteriores antes de procesar", async () => {
    const onClearErrors = vi.fn();
    const callbacks = {
      loginFn: vi.fn().mockResolvedValue({ id: "1", email: "a@b.com", role: "user" }),
      onSuccess: vi.fn(),
      onGeneralError: vi.fn(),
      onFieldError: vi.fn(),
      onClearErrors,
      setSubmitting: vi.fn(),
    };

    await submitLoginForm(
      { email: "admin@example.com", password: "secret" },
      callbacks,
    );

    expect(onClearErrors).toHaveBeenCalledTimes(1);
  });

  it("detiene el envío y reporta error de campo si la validación falla", async () => {
    const loginFn = vi.fn();
    const onFieldError = vi.fn();
    const setSubmitting = vi.fn();
    const onSuccess = vi.fn();

    const ok = await submitLoginForm(
      { email: "invalid-email", password: "" },
      {
        loginFn,
        onSuccess,
        onGeneralError: vi.fn(),
        onFieldError,
        onClearErrors: vi.fn(),
        setSubmitting,
      },
    );

    expect(ok).toBe(false);
    expect(loginFn).not.toHaveBeenCalled();
    expect(setSubmitting).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFieldError).toHaveBeenCalledWith("email", "El email no es válido");
    expect(onFieldError).toHaveBeenCalledWith(
      "password",
      "La contraseña es obligatoria",
    );
  });

  it("ejecuta loginFn y onSuccess ante credenciales válidas gestionando estado de carga", async () => {
    const loginFn = vi.fn().mockResolvedValue({
      id: "507f1f77bcf86cd799439011",
      email: "admin@example.com",
      role: "admin",
    });
    const onSuccess = vi.fn();
    const setSubmitting = vi.fn();

    const ok = await submitLoginForm(
      { email: "admin@example.com", password: "password123" },
      {
        loginFn,
        onSuccess,
        onGeneralError: vi.fn(),
        onFieldError: vi.fn(),
        onClearErrors: vi.fn(),
        setSubmitting,
      },
    );

    expect(ok).toBe(true);
    expect(loginFn).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);
    expect(setSubmitting).toHaveBeenNthCalledWith(2, false);
  });

  it("captura 401 y activa onGeneralError restaurando estado de carga", async () => {
    const loginFn = vi.fn().mockRejectedValue(
      new ApiError({
        kind: "UNAUTHORIZED",
        status: 401,
        message: "Credenciales inválidas",
      }),
    );
    const onGeneralError = vi.fn();
    const onSuccess = vi.fn();
    const setSubmitting = vi.fn();

    const ok = await submitLoginForm(
      { email: "admin@example.com", password: "wrong-password" },
      {
        loginFn,
        onSuccess,
        onGeneralError,
        onFieldError: vi.fn(),
        onClearErrors: vi.fn(),
        setSubmitting,
      },
    );

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onGeneralError).toHaveBeenCalledWith(
      "Credenciales inválidas. Verificá tu email y contraseña.",
    );
    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);
    expect(setSubmitting).toHaveBeenNthCalledWith(2, false);
  });
});

