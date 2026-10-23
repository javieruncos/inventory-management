import Swal from "sweetalert2";

// Clases reutilizadas de la UI (Button.tsx, globals.css) para no introducir
// colores, radios, sombras ni z-index arbitrarios.
const POPUP_CLASS =
  "rounded-card border border-border bg-surface font-sans text-text shadow-dialog";
const TITLE_CLASS = "text-heading-sm text-text";
const TEXT_CLASS = "text-body text-text-secondary";
const ACTIONS_CLASS = "flex flex-wrap items-center justify-end gap-3";
const BUTTON_BASE =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-control px-5 text-label whitespace-nowrap transition-colors duration-150 ease-emphasized";
const CONFIRM_BUTTON_CLASS = `${BUTTON_BASE} bg-primary text-white hover:bg-primary-alt focus-visible:outline-primary`;
const CANCEL_BUTTON_CLASS = `${BUTTON_BASE} border border-border-strong bg-surface text-secondary-btn-text hover:bg-surface-nested`;

// Configuración base compartida: sin estilos automáticos de SweetAlert2, con
// clases de proyecto y gestión de foco accesible (retorno + foco inicial en
// cancelar, por ser un flujo destructivo). El movimiento reducido lo cubre la
// regla global de globals.css.
const swal = Swal.mixin({
  buttonsStyling: false,
  returnFocus: true,
  focusCancel: true,
  customClass: {
    popup: POPUP_CLASS,
    title: TITLE_CLASS,
    htmlContainer: TEXT_CLASS,
    actions: ACTIONS_CLASS,
    confirmButton: CONFIRM_BUTTON_CLASS,
    cancelButton: CANCEL_BUTTON_CLASS,
  },
});

const toast = swal.mixin({
  toast: true,
  position: "bottom-end",
  timer: 2500,
  timerProgressBar: true,
  showConfirmButton: false,
});

export type ConfirmDeleteOptions = {
  title: string;
  text: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => Promise<void>;
};

// Resultado tipado: distingue confirmación, cancelación y fallo sin `any`
// ni conversiones inseguras. El error se devuelve al llamador para que decida
// cómo mostrarlo (no se presenta desde aquí).
export type ConfirmDeleteResult =
  | { status: "confirmed" }
  | { status: "cancelled" }
  | { status: "failed"; error: unknown };

type ConfirmOutcome = { ok: true } | { ok: false; error: unknown };

export async function confirmDelete({
  title,
  text,
  confirmText,
  cancelText,
  onConfirm,
}: ConfirmDeleteOptions): Promise<ConfirmDeleteResult> {
  const result = await swal.fire<ConfirmOutcome>({
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    showLoaderOnConfirm: true,
    allowOutsideClick: false,
    preConfirm: async () => {
      try {
        await onConfirm();
        return { ok: true };
      } catch (error) {
        return { ok: false, error };
      }
    },
  });

  if (!result.isConfirmed) {
    return { status: "cancelled" };
  }

  const outcome = result.value;

  if (outcome && outcome.ok === false) {
    return { status: "failed", error: outcome.error };
  }

  return { status: "confirmed" };
}

export async function notifySuccess(message: string): Promise<void> {
  await toast.fire({ icon: "success", title: message });
}

export async function notifyError(message: string): Promise<void> {
  await swal.fire({ icon: "error", title: message, confirmButtonText: "Entendido" });
}
