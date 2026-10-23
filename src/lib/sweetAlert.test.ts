import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const fire = vi.fn();
  const mixin = vi.fn();

  // Emula el comportamiento real de `Swal.mixin`: las opciones del mixin se
  // fusionan en cada `fire` posterior.
  const build = (base: Record<string, unknown> = {}) => ({
    fire: (options: Record<string, unknown> = {}) =>
      fire({ ...base, ...options }),
    mixin: (extra: Record<string, unknown> = {}) =>
      build({ ...base, ...extra }),
  });

  mixin.mockImplementation((base: Record<string, unknown> = {}) => build(base));

  return { fire, mixin };
});

vi.mock("sweetalert2", () => ({
  default: { fire: mocks.fire, mixin: mocks.mixin, isLoading: () => false },
}));

import { confirmDelete, notifyError, notifySuccess } from "@/lib/sweetAlert";

type FireOptions = {
  toast?: boolean;
  position?: string;
  timer?: number;
  timerProgressBar?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  showLoaderOnConfirm?: boolean;
  allowOutsideClick?: boolean;
  icon?: string;
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  buttonsStyling?: boolean;
  returnFocus?: boolean;
  focusCancel?: boolean;
  customClass?: Record<string, string>;
  preConfirm?: () => Promise<unknown>;
};

function firstFireOptions(): FireOptions {
  return mocks.fire.mock.calls[0]?.[0] as FireOptions;
}

// Simula el ciclo de vida de Swal en una confirmación: al confirmar, Swal
// ejecuta `preConfirm` y resuelve con su valor. Es el comportamiento documentado
// de la librería, no un detalle interno nuestro.
function confirmImplementation() {
  return async (options: FireOptions) => {
    const value = options.preConfirm ? await options.preConfirm() : undefined;
    return { isConfirmed: true, isDismissed: false, value };
  };
}

const OPTIONS = {
  title: "Eliminar producto",
  text: "Se quitará del listado.",
  confirmText: "Eliminar",
  cancelText: "Cancelar",
};

describe("configuración compartida de SweetAlert2", () => {
  beforeEach(() => {
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true, isDismissed: false });
  });

  it("desactiva el estilo automático y aplica las clases personalizadas", async () => {
    await notifyError("Error de prueba");

    const options = firstFireOptions();

    expect(options.buttonsStyling).toBe(false);
    expect(options.returnFocus).toBe(true);
    expect(options.focusCancel).toBe(true);
    expect(options.customClass).toMatchObject({
      popup: expect.any(String),
      title: expect.any(String),
      htmlContainer: expect.any(String),
      actions: expect.any(String),
      confirmButton: expect.any(String),
      cancelButton: expect.any(String),
    });
  });
});

describe("notifySuccess", () => {
  beforeEach(() => {
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: false, isDismissed: true });
  });

  it("configura un toast breve en bottom-end sin botón de confirmación", async () => {
    await notifySuccess("Producto eliminado");

    const options = firstFireOptions();

    expect(options).toMatchObject({
      toast: true,
      position: "bottom-end",
      timerProgressBar: true,
      showConfirmButton: false,
      icon: "success",
      title: "Producto eliminado",
    });
    expect(typeof options.timer).toBe("number");
  });
});

describe("notifyError", () => {
  beforeEach(() => {
    mocks.fire.mockReset();
    mocks.fire.mockResolvedValue({ isConfirmed: true, isDismissed: false });
  });

  it("muestra el mensaje recibido sin exponer detalles internos", async () => {
    const message = "No se pudo eliminar la categoría.";
    await notifyError(message);

    const options = firstFireOptions();

    expect(options).toMatchObject({ icon: "error", title: message });

    const serialized = JSON.stringify(options);
    expect(serialized).not.toMatch(/cause|stack|mongodb:\/\//i);
  });
});

describe("confirmDelete", () => {
  beforeEach(() => {
    mocks.fire.mockReset();
  });

  it("no ejecuta onConfirm si el usuario cancela", async () => {
    mocks.fire.mockResolvedValue({ isConfirmed: false, isDismissed: true });
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    const result = await confirmDelete({ ...OPTIONS, onConfirm });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "cancelled" });
  });

  it("ejecuta onConfirm exactamente una vez al confirmar", async () => {
    mocks.fire.mockImplementation(confirmImplementation());
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    const result = await confirmDelete({ ...OPTIONS, onConfirm });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: "confirmed" });
    expect(mocks.fire).toHaveBeenCalledTimes(1);
  });

  it("no trata como exitosa una operación que falla y devuelve el error", async () => {
    mocks.fire.mockImplementation(confirmImplementation());
    const failure = new Error("El proveedor está en uso por productos");
    const onConfirm = vi.fn().mockRejectedValue(failure);

    const result = await confirmDelete({ ...OPTIONS, onConfirm });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.error).toBe(failure);
    }
    expect(mocks.fire).toHaveBeenCalledTimes(1);
  });

  it("activa el estado de carga y desactiva el cierre por clic fuera", async () => {
    mocks.fire.mockImplementation(confirmImplementation());
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    await confirmDelete({ ...OPTIONS, onConfirm });

    const options = firstFireOptions();

    expect(options.showLoaderOnConfirm).toBe(true);
    expect(options.allowOutsideClick).toBe(false);
    expect(options.showCancelButton).toBe(true);
  });

  it("distingue confirmación, cancelación y fallo con tipos seguros", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    mocks.fire.mockImplementation(confirmImplementation());
    const confirmed = await confirmDelete({ ...OPTIONS, onConfirm });
    expect(confirmed.status).toBe("confirmed");

    mocks.fire.mockResolvedValueOnce({ isConfirmed: false, isDismissed: true });
    const cancelled = await confirmDelete({ ...OPTIONS, onConfirm });
    expect(cancelled.status).toBe("cancelled");

    mocks.fire.mockImplementation(confirmImplementation());
    onConfirm.mockRejectedValueOnce(new Error("boom"));
    const failed = await confirmDelete({ ...OPTIONS, onConfirm });
    expect(failed.status).toBe("failed");
  });
});
