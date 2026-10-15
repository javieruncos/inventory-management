"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
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
  totalMovements: number;
  errorMessage?: string;
  onRetry: () => void;
  className?: string;
};

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
  totalMovements,
  errorMessage,
  onRetry,
  className,
}: RecentMovementsCardProps) {
  const [filter, setFilter] = useState<MovementFilter>("ALL");

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
    const filtered = filterMovements(movements ?? [], filter);
    const recent = getRecentMovements(filtered, products ?? [], {
      limit: DEFAULT_RECENT_MOVEMENTS_LIMIT,
    });

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
          <ul className="divide-y divide-divider">
            {recent.map((movement) => {
              const isIn = movement.type === "IN";
              const productName =
                products === null
                  ? "—"
                  : (movement.product?.name ?? "Producto no disponible");

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
                  <span className="flex min-w-0 flex-1 flex-col">
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
                    <span className="truncate text-caption text-text-secondary">
                      {movement.reason} ·{" "}
                      {dateFormat.format(new Date(movement.createdAt))}
                    </span>
                  </span>
                  <TrendPill direction={isIn ? "up" : "down"}>
                    {`${isIn ? "+" : "-"}${movement.quantity} un.`}
                  </TrendPill>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-caption text-text-secondary">
            {recentMovementsCountLabel(recent.length, filtered.length)}
          </p>
        </>
      );
    }
  }

  return (
    <Card
      aria-busy={status === "loading"}
      className={cn("min-w-0", className)}
    >
      <CardHeader
        title="Movimientos recientes"
        description="Últimos cambios de stock registrados."
        actions={
          <div
            role="group"
            aria-label="Filtrar movimientos"
            className="flex flex-wrap items-center gap-2"
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
        }
      />
      {body}
    </Card>
  );
}
