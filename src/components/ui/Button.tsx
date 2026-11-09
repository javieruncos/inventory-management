import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "accent";
type ButtonSize = "default" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-5 text-label",
  lg: "h-12 px-6 text-[15px]",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "rounded-control bg-primary text-white hover:bg-primary-alt focus-visible:outline-primary",
  secondary:
    "rounded-control border border-border-strong bg-surface text-secondary-btn-text hover:bg-surface-nested",
  accent:
    "rounded bg-[var(--login-primary)] font-semibold text-[var(--login-on-primary)] hover:bg-[var(--login-primary-hover)] focus-visible:outline-[var(--login-primary)]",
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
        "transition-colors duration-150 ease-emphasized",
        "active:translate-y-px motion-reduce:active:translate-y-0",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
