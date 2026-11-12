import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type SelectProps = {
  /** id compartido entre label y control (obligatorio para htmlFor). */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  selectProps?: Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "required"
  >;
  children: ReactNode;
};

export function Select({
  id,
  label,
  hint,
  error,
  required = false,
  selectProps,
  children,
}: SelectProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-text">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-status-out-text">
            *
          </span>
        ) : null}
      </label>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            /* text-base en mobile evita el zoom de iOS (<16px); 14px desde tablet */
            "h-10 w-full appearance-none rounded-control border bg-surface py-2 pl-3 pr-9 text-base text-text md:text-body",
            error ? "border-status-out-text" : "border-border-strong",
          )}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-caption text-status-out-text"
        >
          <TriangleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
