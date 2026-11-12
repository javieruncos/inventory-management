import type { ReactNode } from "react";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** Nombre accesible obligatorio (el botón no tiene texto visible). */
  label: string;
  icon: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export function IconButton({
  label,
  icon,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-control bg-surface-nested text-neutral",
        "transition-colors duration-150 ease-emphasized",
        "hover:bg-primary-soft hover:text-primary-alt",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="grid place-items-center">
        {icon}
      </span>
    </button>
  );
}
