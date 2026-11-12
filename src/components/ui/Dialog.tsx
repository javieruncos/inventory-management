"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

type DialogProps = {
  title: string;
  onClose: () => void;
  /** Bloquea cierre (Escape, backdrop, X) mientras hay una mutación en curso. */
  closeDisabled?: boolean;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function Dialog({
  title,
  onClose,
  closeDisabled = false,
  children,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!closeDisabled) onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const isInside = active instanceof Node && panel.contains(active);

      if (!isInside) {
        event.preventDefault();
        focusables[0].focus();
        return;
      }

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, closeDisabled]);

  const requestClose = () => {
    if (!closeDisabled) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={requestClose}
        className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          tabIndex={-1}
          className="pointer-events-auto flex max-h-[85dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-dialog focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <h2
              id={titleId}
              className="min-w-0 text-heading-sm text-text text-balance"
            >
              {title}
            </h2>
            <IconButton
              label="Cerrar"
              icon={<X size={16} />}
              onClick={requestClose}
              disabled={closeDisabled}
            />
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
