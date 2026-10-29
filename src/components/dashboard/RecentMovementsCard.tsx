"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrendPill } from "@/components/ui/TrendPill";
import { cn } from "@/lib/cn";
import {
  DEFAULT_RECENT_MOVEMENTS_LIMIT,
  filterMovements,
  getRecentMovements,
  recentMovementsCountLabel,
  type MovementFilter,
} from "@/lib/dashboard";

type RecentMovementsCardProps = {
  status: "loading" | "error" | "ready";
  movements: StockMovementDTO[] | null;
  products: ProductDTO[] | null;
  productsStatus: "loading" | "error" | "ready";
  totalMovements: number;
  errorMessage?: string;
  onRetry: () => void;
  className?: string;
};

type ProductNamesNoticeProps = {
  status: "loading" | "error";
};

function ProductNamesNotice({ status }: ProductNamesNoticeProps) {
  if (status === "loading") {
    return (
      <p role="status" className="mb-3 text-caption text-text-secondary">
        Cargando nombres de productos…
      </p>
    );
  }

  return (
    <p className="mb-3 text-caption text-text-secondary">
      Los nombres de productos no están disponibles.
    </p>
  );
}

const FILTERS: ReadonlyArray<{ value: MovementFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "IN", label: "Entradas" },
  { value: "OUT", label: "Salidas" },
];

const dateFormat = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function RecentMovementsCard({
  status,
  movements,
  products,
  productsStatus,
  totalMovements,
  errorMessage,
  onRetry,
  className,
}: RecentMovementsCardProps) {
  const [filter, setFilter] = useState<MovementFilter>("ALL");
  const filtered = filterMovements(movements ?? [], filter);
  const recent = getRecentMovements(filtered, products ?? [], {
    limit: DEFAULT_RECENT_MOVEMENTS_LIMIT,
  });
  const hasMoreMovements = filtered.length > recent.length;

  let body: ReactNode;

  if (status === "loading") {
    body = <DashboardSkeleton variant="movements" />;
  } else if (status === "error") {
    body = (
      <div role="alert" className="flex flex-col items-start gap-3 py-4">
        <p className="text-body text-text-secondary">
          {errorMessage ?? "No se pudieron cargar los movimientos."}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  } else {
    if (recent.length === 0) {
      body = (
        <p className="py-4 text-body text-text-secondary">
          {totalMovements === 0
            ? "Todavía no hay movimientos de stock."
            : "No hay movimientos que coincidan con el filtro."}
        </p>
      );
    } else {
      body = (
        <>
          {productsStatus !== "ready" ? (
            <ProductNamesNotice status={productsStatus} />
          ) : null}
          <ul className="divide-y divide-divider">
            {recent.map((movement) => {
              const isIn = movement.type === "IN";
              const productName =
                movement.product?.name ??
                (productsStatus === "loading"
                  ? "Cargando…"
                  : productsStatus === "error"
                    ? "Nombre no disponible"
                    : "Producto no disponible");

              return (
                <li key={movement._id} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-control",
                      isIn
                        ? "bg-status-in-bg text-status-in-text"
                        : "bg-status-out-bg text-status-out-text",
                    )}
                  >
                    {isIn ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {movement.product ? (
                      <Link
                        href={`/products/${movement.productId}`}
                        className="truncate text-body font-medium text-text hover:text-primary"
                      >
                        {movement.product.name}
                      </Link>
                    ) : (
                      <span className="truncate text-body font-medium text-text">
                        {productName}
                      </span>
                    )}
                    <details className="group min-w-0">
                      <summary className="flex min-h-6 cursor-pointer list-none items-center gap-1 py-0.5 text-caption text-text-secondary [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1 truncate group-open:whitespace-pre-wrap group-open:overflow-visible group-open:break-words group-open:text-clip">
                          {movement.reason} ·{" "}
                          {dateFormat.format(new Date(movement.createdAt))}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className="size-3.5 shrink-0 transition-transform duration-150 ease-emphasized group-open:rotate-180"
                        />
                      </summary>
                    </details>
                  </div>
                  <TrendPill direction={isIn ? "up" : "down"}>
                    {`${isIn ? "+" : "-"}${movement.quantity} un.`}
                  </TrendPill>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-text-secondary">
              {recentMovementsCountLabel(recent.length, filtered.length)}
            </p>
            {hasMoreMovements ? (
              <Link
                href="/stock"
                aria-label="Ver todos los movimientos de stock"
                className="inline-flex h-10 items-center text-label text-primary hover:underline"
              >
                Ver todos
              </Link>
            ) : null}
          </div>
        </>
      );
    }
  }

  return (
    <Card
      aria-busy={
        status === "loading" ||
        (status === "ready" &&
          productsStatus === "loading" &&
          recent.length > 0)
      }
      className={cn("min-w-0", className)}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-heading-sm text-text text-balance">
            Movimientos recientes
          </h2>
          <p className="mt-1 max-w-prose text-body-sm text-text-secondary text-pretty">
            Últimos cambios de stock registrados.
          </p>
        </div>
        <div
          role="group"
          aria-label="Filtrar movimientos"
          className="flex w-full flex-wrap items-center justify-between gap-2 md:w-auto md:justify-start"
        >
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "h-11 rounded-pill px-3 text-label",
                "transition-colors duration-150 ease-emphasized",
                filter === option.value
                  ? "bg-primary-soft text-primary"
                  : "text-neutral hover:bg-surface-nested",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {body}
    </Card>
  );
}
