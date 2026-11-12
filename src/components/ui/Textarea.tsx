import type { TextareaHTMLAttributes } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type TextareaProps = {
  /** id compartido entre label y control (obligatorio para htmlFor). */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "required"
  >;
};

export function Textarea({
  id,
  label,
  hint,
  error,
  required = false,
  textareaProps,
}: TextareaProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-text">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-status-out-text">
            *
          </span>
        ) : null}
      </label>
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          /* text-base en mobile evita el zoom de iOS (<16px); 14px desde tablet */
          "min-h-24 w-full resize-y rounded-control border bg-surface px-3 py-2 text-base text-text placeholder:text-text-secondary md:text-body",
          error ? "border-status-out-text" : "border-border-strong",
        )}
        {...textareaProps}
      />
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
