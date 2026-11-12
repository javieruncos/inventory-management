import { cn } from "@/lib/cn";

type StatusBadgeVariant = "inStock" | "lowStock" | "outOfStock" | "archived";

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  /** Etiqueta textual obligatoria: el color nunca es el único indicador. */
  label: string;
};

const variantClasses: Record<StatusBadgeVariant, string> = {
  inStock: "bg-status-in-bg text-status-in-text",
  lowStock: "bg-status-low-bg text-status-low-text",
  outOfStock: "bg-status-out-bg text-status-out-text",
  archived: "bg-status-archived-bg text-status-archived-text",
};

const dotClasses: Record<StatusBadgeVariant, string> = {
  inStock: "bg-status-in-dot",
  lowStock: "bg-status-low-dot",
  outOfStock: "bg-status-out-dot",
  archived: "bg-status-archived-dot",
};

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-pill px-2.5 text-label-sm whitespace-nowrap",
        variantClasses[variant],
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", dotClasses[variant])}
      />
      {label}
    </span>
  );
}
