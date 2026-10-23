import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type LinkButtonVariant = "primary" | "secondary";

type LinkButtonProps = {
  href: string;
  variant?: LinkButtonVariant;
  className?: string;
  children: ReactNode;
};

const variantClasses: Record<LinkButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-alt focus-visible:outline-primary",
  secondary:
    "border border-border-strong bg-surface text-secondary-btn-text hover:bg-surface-nested",
};

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-control px-5 text-label whitespace-nowrap",
        "transition-colors duration-150 ease-emphasized",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
