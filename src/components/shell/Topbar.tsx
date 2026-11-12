"use client";

import type { Ref } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, LogOut, Menu } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { ApiError } from "@/lib/api";
import { buildLoginPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/cn";
import { useLogout, useMe } from "@/lib/queries";
import { notifyError } from "@/lib/sweetAlert";

type TopbarProps = {
  onOpenMenu: () => void;
  menuRef: Ref<HTMLButtonElement>;
  menuOpen: boolean;
};

export function Topbar({ onOpenMenu, menuRef, menuOpen }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof ApiError && error.status !== 0
          ? error.message || "No se pudo cerrar la sesión. Intentá nuevamente."
          : "No se pudo conectar con el servidor para cerrar la sesión. Verificá tu conexión.";
      await notifyError(message);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 desktop:px-8">
      <div className="flex items-center gap-3">
        <IconButton
          ref={menuRef}
          label="Abrir navegación"
          icon={<Menu size={16} />}
          aria-expanded={menuOpen}
          aria-controls="app-drawer"
          className="md:hidden"
          onClick={onOpenMenu}
        />
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? (
          <span
            aria-hidden="true"
            className="h-6 w-32 animate-pulse rounded-pill bg-surface-nested motion-reduce:animate-none"
          />
        ) : user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              title={user.email}
              className="max-w-[140px] truncate text-body-sm font-medium text-text sm:max-w-[200px] desktop:max-w-[300px]"
            >
              {user.email}
            </span>

            <span
              className={cn(
                "inline-flex h-6 shrink-0 items-center rounded-pill px-2.5 text-label-sm font-semibold whitespace-nowrap",
                user.role === "admin"
                  ? "bg-primary-soft text-primary"
                  : "bg-surface-nested text-neutral",
              )}
            >
              {user.role === "admin" ? "Admin" : "Usuario"}
            </span>

            <IconButton
              label="Cerrar sesión"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-pill border border-border-strong bg-surface px-2.5 text-label-sm font-semibold whitespace-nowrap text-text-secondary">
              <Eye aria-hidden="true" size={12} />
              Modo visitante
            </span>

            <LinkButton href={buildLoginPath(pathname)} variant="secondary">
              Iniciar sesión
            </LinkButton>
          </div>
        )}
      </div>
    </header>
  );
}
