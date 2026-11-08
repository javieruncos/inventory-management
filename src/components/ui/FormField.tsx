import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type FormFieldTone = "default" | "dark";

type FormFieldProps = {
  /** id compartido entre label y control (obligatorio para htmlFor). */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  tone?: FormFieldTone;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "required">;
};

export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  tone = "default",
  leadingIcon,
  trailingAction,
  inputRef,
  inputProps,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const isDark = tone === "dark";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={
          isDark
            ? "text-[13px] font-medium leading-[18px] text-[var(--login-text)]"
            : "text-label text-text"
        }
      >
        {label}
        {required ? (
          <span
            aria-hidden="true"
            className={
              isDark
                ? "ml-1 text-[var(--login-primary)]"
                : "ml-1 text-status-out-text"
            }
          >
            *
          </span>
        ) : null}
      </label>
      <div className={leadingIcon || trailingAction ? "relative" : undefined}>
        {leadingIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--login-text-muted)] [&_svg]:size-4"
          >
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={id}
          required={required}
          ref={inputRef}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            isDark
              ? cn(
                  "h-11 w-full rounded border bg-[var(--login-surface)] text-base text-[var(--login-text-strong)] placeholder:text-[var(--login-text-subtle)] md:h-12 md:text-body",
                  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--login-focus)]",
                  error
                    ? "border-[var(--login-error)]"
                    : "border-[var(--login-border-input)]",
                  leadingIcon ? "pl-10" : "pl-3",
                  trailingAction ? "pr-12" : "pr-3",
                )
              : cn(
                  /* text-base en mobile evita el zoom de iOS (<16px); 14px desde tablet */
                  "h-10 w-full rounded-control border bg-surface px-3 text-base text-text placeholder:text-text-secondary md:text-body",
                  error
                    ? "border-status-out-text"
                    : "border-border-strong",
                ),
          )}
          {...inputProps}
        />
        {trailingAction ? (
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            {trailingAction}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p
          id={hintId}
          className={
            isDark
              ? "text-caption text-[var(--login-text-muted)]"
              : "text-caption text-text-secondary"
          }
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className={cn(
            "flex items-start gap-1.5 text-caption",
            isDark
              ? "text-[var(--login-error)]"
              : "text-status-out-text",
          )}
        >
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
