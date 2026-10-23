"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes } from "lucide-react";
import { NAV_ITEMS } from "@/components/shell/nav-items";
import { cn } from "@/lib/cn";

type SidebarProps = {
  /**
   * "rail": sidebar persistente 76–250px (labels visibles solo en desktop).
   * "full": instancia de drawer móvil con labels siempre visibles.
   */
  variant?: "rail" | "full";
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({
  variant = "rail",
  onNavigate,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const labelClass =
    variant === "rail" ? "sr-only desktop:not-sr-only" : undefined;

  return (
    <aside
      className={cn(
        "h-dvh shrink-0 flex-col border-e border-border bg-surface-shell",
        className,
      )}
    >
      {/* Marca alineada con la altura del topbar (68px) */}
      <div className="flex h-[68px] shrink-0 items-center gap-3 border-b border-border px-4">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary"
        >
          <Boxes size={18} />
        </span>
        <span
          className={cn("min-w-0 truncate text-label text-text", labelClass)}
        >
          Inventory Management
        </span>
      </div>

      <nav
        aria-label="Navegación principal"
        className="min-h-0 flex-1 overflow-y-auto p-3"
      >
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href !== null &&
              (item.href === "/"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`));
            const ItemIcon = item.icon;

            const itemClasses = cn(
              "flex h-10 items-center gap-3 rounded-control px-3 text-body",
              "transition-colors duration-150 ease-emphasized",
              variant === "rail" &&
                "max-desktop:justify-center max-desktop:px-0",
              isActive
                ? "bg-primary-soft font-semibold text-primary"
                : item.href !== null
                  ? "font-medium text-neutral hover:bg-surface-nested hover:text-text"
                  : "font-medium text-neutral",
            );

            return (
              <li key={item.label}>
                {item.href !== null ? (
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    title={variant === "rail" ? item.label : undefined}
                    className={itemClasses}
                    onClick={onNavigate}
                  >
                    <ItemIcon
                      aria-hidden="true"
                      size={18}
                      className="shrink-0"
                    />
                    <span className={cn("truncate", labelClass)}>
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  /* Sección preparada: aún no navega (la vista no existe). */
                  <span
                    title={variant === "rail" ? item.label : undefined}
                    className={cn(itemClasses, "cursor-default")}
                  >
                    <ItemIcon
                      aria-hidden="true"
                      size={18}
                      className="shrink-0"
                    />
                    <span className={cn("truncate", labelClass)}>
                      {item.label}
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
