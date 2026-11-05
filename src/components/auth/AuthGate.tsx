"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSessionGateState } from "@/lib/auth/sessionGate";
import { useMe } from "@/lib/queries";

type AuthGateProps = {
  children: ReactNode;
};

function SessionLoadingFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-8">
      <Card className="w-full max-w-[420px]">
        <div
          role="status"
          aria-busy="true"
          className="flex min-h-20 items-center justify-center gap-3"
        >
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin text-primary motion-reduce:animate-none"
          />
          <span className="text-body text-text-secondary">
            Verificando sesión…
          </span>
        </div>
      </Card>
    </div>
  );
}

function SessionErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-8">
      <Card className="w-full max-w-[460px]">
        <div role="alert" className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-status-out-bg text-status-out-text">
            <TriangleAlert aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="text-heading-sm text-text">
              No pudimos verificar tu sesión
            </h1>
            <p className="mt-1 text-body text-text-secondary">
              Hubo un problema de conexión con el servidor. Tu sesión no se
              modificó.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </Card>
    </div>
  );
}

export function RequireAuth({ children }: AuthGateProps) {
  const router = useRouter();
  const session = useMe();
  const state = getSessionGateState(session);

  useEffect(() => {
    if (state === "anonymous") {
      router.replace("/login");
    }
  }, [router, state]);

  if (state === "authenticated") {
    return <>{children}</>;
  }

  if (state === "error") {
    return <SessionErrorFallback onRetry={() => void session.refetch()} />;
  }

  return <SessionLoadingFallback />;
}

export function GuestOnly({ children }: AuthGateProps) {
  const router = useRouter();
  const session = useMe();
  const state = getSessionGateState(session);

  useEffect(() => {
    if (state === "authenticated") {
      router.replace("/");
    }
  }, [router, state]);

  if (state === "anonymous") {
    return <>{children}</>;
  }

  if (state === "error") {
    return <SessionErrorFallback onRetry={() => void session.refetch()} />;
  }

  return <SessionLoadingFallback />;
}
