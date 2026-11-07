"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { getSessionGateState } from "@/lib/auth/sessionGate";
import { useMe } from "@/lib/queries";

type FallbackTone = "default" | "dark";

type AuthGateProps = {
  children: ReactNode;
};

type GuestOnlyProps = AuthGateProps & {
  fallbackTone?: FallbackTone;
};

type FallbackSurfaceProps = {
  tone: FallbackTone;
  className?: string;
  children: ReactNode;
};

function FallbackSurface({ tone, className, children }: FallbackSurfaceProps) {
  if (tone === "dark") {
    return (
      <div
        className={cn(
          "w-full rounded-lg border border-[var(--login-border)] bg-[var(--login-surface)] p-5 shadow-card",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return <Card className={cn("w-full", className)}>{children}</Card>;
}

function SessionLoadingFallback({ tone }: { tone: FallbackTone }) {
  return (
    <div
      className={cn(
        "grid min-h-dvh place-items-center px-4 py-8",
        tone === "dark"
          ? "login-theme bg-[var(--login-bg)]"
          : "bg-canvas",
      )}
    >
      <FallbackSurface tone={tone} className="max-w-[420px]">
        <div
          role="status"
          aria-busy="true"
          className="flex min-h-20 items-center justify-center gap-3"
        >
          <Loader2
            aria-hidden="true"
            className={cn(
              "size-4 animate-spin motion-reduce:animate-none",
              tone === "dark"
                ? "text-[var(--login-primary)]"
                : "text-primary",
            )}
          />
          <span
            className={
              tone === "dark"
                ? "text-body text-[var(--login-text-muted)]"
                : "text-body text-text-secondary"
            }
          >
            Verificando sesión…
          </span>
        </div>
      </FallbackSurface>
    </div>
  );
}

function SessionErrorFallback({
  onRetry,
  tone,
}: {
  onRetry: () => void;
  tone: FallbackTone;
}) {
  return (
    <div
      className={cn(
        "grid min-h-dvh place-items-center px-4 py-8",
        tone === "dark"
          ? "login-theme bg-[var(--login-bg)]"
          : "bg-canvas",
      )}
    >
      <FallbackSurface tone={tone} className="max-w-[460px]">
        <div role="alert" className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center",
              tone === "dark"
                ? "rounded bg-[var(--login-error-bg)] text-[var(--login-error)]"
                : "rounded-control bg-status-out-bg text-status-out-text",
            )}
          >
            <TriangleAlert aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h1
              className={
                tone === "dark"
                  ? "text-heading-sm text-[var(--login-text-strong)]"
                  : "text-heading-sm text-text"
              }
            >
              No pudimos verificar tu sesión
            </h1>
            <p
              className={
                tone === "dark"
                  ? "mt-1 text-body text-[var(--login-text-muted)]"
                  : "mt-1 text-body text-text-secondary"
              }
            >
              Hubo un problema de conexión con el servidor. Tu sesión no se
              modificó.
            </p>
          </div>
        </div>
        <Button
          variant={tone === "dark" ? "accent" : "secondary"}
          className="mt-5 w-full"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      </FallbackSurface>
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
    return (
      <SessionErrorFallback
        onRetry={() => void session.refetch()}
        tone="default"
      />
    );
  }

  return <SessionLoadingFallback tone="default" />;
}

export function GuestOnly({
  children,
  fallbackTone = "default",
}: GuestOnlyProps) {
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
    return (
      <SessionErrorFallback
        onRetry={() => void session.refetch()}
        tone={fallbackTone}
      />
    );
  }

  return <SessionLoadingFallback tone={fallbackTone} />;
}
