"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { MovementFormDialog } from "@/components/stock/MovementFormDialog";
import { StockMovementsList } from "@/components/stock/StockMovementsList";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  attachProducts,
  filterMovements,
  type MovementFilter,
} from "@/lib/dashboard";
import { toViewStatus, useMovements, useProducts } from "@/lib/queries";

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

const FILTERS: ReadonlyArray<{ value: MovementFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "IN", label: "Entradas" },
  { value: "OUT", label: "Salidas" },
];

function StockMovementsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className={cn("size-8 shrink-0 rounded-control", pulseClass)} />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span
                  className={cn("h-4 w-48 max-w-full rounded-sm", pulseClass)}
                />
                <span
                  className={cn("h-3 w-64 max-w-full rounded-sm", pulseClass)}
                />
              </span>
            </span>
            <span className={cn("h-6 w-16 shrink-0 rounded-pill", pulseClass)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StockMovementsView() {
  const movementsQuery = useMovements();
  const productsQuery = useProducts();
  const status = toViewStatus(movementsQuery);
  const [filter, setFilter] = useState<MovementFilter>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDialog = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    triggerRef.current?.focus();
  };

  const retry = () => {
    void movementsQuery.refetch();
  };

  const movements = movementsQuery.data ?? [];
  const filtered = filterMovements(movements, filter);
  const joined = attachProducts(filtered, productsQuery.data ?? []);

  let body: ReactNode;

  if (status === "loading") {
    body = <StockMovementsSkeleton />;
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p className="text-body text-text-secondary">
          {movementsQuery.error instanceof ApiError
            ? movementsQuery.error.message
            : "No se pudieron cargar los movimientos."}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (movements.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay movimientos registrados.
      </p>
    );
  } else if (joined.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay movimientos que coincidan con el filtro.
      </p>
    );
  } else {
    body = (
      <StockMovementsList
        movements={joined}
        totalMovements={movements.length}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5" inert={dialogOpen}>
        <PageHeader
          title="Movimientos de stock"
          subtitle="Historial global de entradas y salidas de stock."
          actions={
            <Button onClick={openDialog}>
              <Plus aria-hidden="true" size={16} />
              Registrar movimiento
            </Button>
          }
        />
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
                "h-10 rounded-pill px-3 text-label",
                "transition-colors duration-150 ease-emphasized",
                "motion-reduce:transition-none",
                filter === option.value
                  ? "bg-primary-soft text-primary"
                  : "text-neutral hover:bg-surface-nested",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <section
          aria-label="Listado de movimientos de stock"
          aria-busy={status === "loading"}
          className="flex flex-col gap-4"
        >
          {body}
        </section>
      </div>
      {dialogOpen ? <MovementFormDialog onClose={closeDialog} /> : null}
    </>
  );
}
