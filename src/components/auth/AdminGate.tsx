"use client";

import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/LinkButton";
import { useCanManageUsers } from "@/lib/auth/useCanManageUsers";
import { useMe } from "@/lib/queries";

type AdminGateProps = {
  children: ReactNode;
};

export function AdminGate({ children }: AdminGateProps) {
  const { data: user } = useMe();
  const canManageUsers = useCanManageUsers();

  if (!user) return null;

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
