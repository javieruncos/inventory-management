"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { buildLoginPath } from "@/lib/auth/redirect";
import { useCanManageUsers } from "@/lib/auth/useCanManageUsers";
import { cn } from "@/lib/cn";
import { useMe } from "@/lib/queries";

type AdminGateProps = {
  children: ReactNode;
};

const pulseClass = "animate-pulse motion-reduce:animate-none bg-surface-nested";

function AdminGateSkeleton() {
  return (
    <Card className="max-w-[560px]" aria-busy="true">
      <span className="sr-only">Verificando permisos</span>
      <div className="flex items-start gap-3" aria-hidden="true">
        <span className={cn("size-9 shrink-0 rounded-control", pulseClass)} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className={cn("h-5 w-48 max-w-full rounded-sm", pulseClass)} />
          <span className={cn("h-4 w-72 max-w-full rounded-sm", pulseClass)} />
        </div>
      </div>
      <span
        aria-hidden="true"
        className={cn("mt-5 block h-9 w-32 rounded-control", pulseClass)}
      />
    </Card>
  );
}

export function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const canManageUsers = useCanManageUsers();

  useEffect(() => {
    if (user === null) {
      router.replace(buildLoginPath(pathname));
    }
  }, [pathname, router, user]);

  if (!user) {
    return isLoading ? <AdminGateSkeleton /> : null;
  }

  if (!canManageUsers) {
    return (
      <Card className="max-w-[560px]">
        <div role="alert" className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-status-out-bg text-status-out-text">
            <ShieldAlert aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-heading-md text-text">Acceso restringido</h1>
            <p className="mt-1 text-body text-text-secondary">
              Esta sección está disponible solo para administradores.
            </p>
          </div>
        </div>
        <LinkButton href="/" variant="secondary" className="mt-5">
          Volver al inicio
        </LinkButton>
      </Card>
    );
  }

  return <>{children}</>;
}
