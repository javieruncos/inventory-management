"use client";

import { ArchiveX, Layers, Package, TriangleAlert } from "lucide-react";
import { LowStockCard } from "@/components/dashboard/LowStockCard";
import { RecentMovementsCard } from "@/components/dashboard/RecentMovementsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ApiError } from "@/lib/api";
import { summarizeInventory } from "@/lib/dashboard";
import { toViewStatus, useMovements, useProducts } from "@/lib/queries";

const numberFormat = new Intl.NumberFormat("es");

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function Dashboard() {
  const productsQuery = useProducts();
  const movementsQuery = useMovements();

  const productsStatus = toViewStatus(productsQuery);
  const movementsStatus = toViewStatus(movementsQuery);

  const products = productsQuery.data ?? null;
  const movements = movementsQuery.data ?? null;

  const summary = productsQuery.data
    ? summarizeInventory(productsQuery.data)
    : null;

  const productsErrorMessage =
    productsStatus === "error"
      ? errorMessageOf(
          productsQuery.error,
          "No se pudieron cargar los productos.",
        )
      : undefined;

  const movementsErrorMessage =
    movementsStatus === "error"
      ? errorMessageOf(
          movementsQuery.error,
          "No se pudieron cargar los movimientos.",
        )
      : undefined;

  const retryProducts = () => {
    void productsQuery.refetch();
  };

  const retryMovements = () => {
    void movementsQuery.refetch();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen operativo del inventario."
      />

      <section
        aria-label="Indicadores de inventario"
        aria-busy={productsStatus === "loading"}
        className="grid grid-cols-2 gap-5 max-[767px]:grid-cols-1 desktop:grid-cols-4"
      >
        {productsStatus === "loading"
          ? Array.from({ length: 4 }, (_, index) => (
              <Card key={index}>
                <DashboardSkeleton variant="kpis" />
              </Card>
            ))
          : productsStatus === "error"
            ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card max-[767px]:col-span-1 max-desktop:col-span-2 desktop:col-span-4"
              >
                <p className="text-body text-text-secondary">
                  {productsErrorMessage}
                </p>
                <Button variant="secondary" onClick={retryProducts}>
                  Reintentar
                </Button>
              </div>
            )
            : summary
              ? (
                <>
                  <StatCard
                    icon={<Package size={18} />}
                    label="Productos totales"
                    value={numberFormat.format(summary.totalProducts)}
                  />
                  <StatCard
                    icon={<Layers size={18} />}
                    label="Unidades en stock"
                    value={numberFormat.format(summary.totalUnits)}
                  />
                  <StatCard
                    icon={<TriangleAlert size={18} />}
                    label="Stock bajo"
                    value={numberFormat.format(summary.lowStockCount)}
                  />
                  <StatCard
                    icon={<ArchiveX size={18} />}
                    label="Stock agotado"
                    value={numberFormat.format(summary.outOfStockCount)}
                  />
                </>
              )
              : null}
      </section>

      <div className="grid grid-cols-1 items-start gap-5 desktop:grid-cols-12">
        <RecentMovementsCard
          className="desktop:col-span-7"
          status={movementsStatus}
          movements={movements}
          products={products}
          totalMovements={movements ? movements.length : 0}
          errorMessage={movementsErrorMessage}
          onRetry={retryMovements}
        />
        <LowStockCard
          className="desktop:col-span-5"
          status={productsStatus}
          products={products}
          errorMessage={productsErrorMessage}
          onRetry={retryProducts}
        />
      </div>
    </div>
  );
}
