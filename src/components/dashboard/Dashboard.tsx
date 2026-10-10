"use client";

import { useEffect, useState } from "react";
import { ArchiveX, Layers, Package, TriangleAlert } from "lucide-react";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";
import { LowStockCard } from "@/components/dashboard/LowStockCard";
import { RecentMovementsCard } from "@/components/dashboard/RecentMovementsCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ApiError, getMovements, getProducts } from "@/lib/api";
import { summarizeInventory } from "@/lib/dashboard";

type ResourceState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

const numberFormat = new Intl.NumberFormat("es");

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function Dashboard() {
  const [productsState, setProductsState] = useState<ResourceState<ProductDTO[]>>({
    status: "loading",
  });
  const [movementsState, setMovementsState] = useState<
    ResourceState<StockMovementDTO[]>
  >({ status: "loading" });
  const [productsNonce, setProductsNonce] = useState(0);
  const [movementsNonce, setMovementsNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getProducts(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProductsState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setProductsState({
          status: "error",
          message: errorMessageOf(error, "No se pudieron cargar los productos."),
        });
      });

    return () => controller.abort();
  }, [productsNonce]);

  useEffect(() => {
    const controller = new AbortController();

    getMovements(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setMovementsState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMovementsState({
          status: "error",
          message: errorMessageOf(error, "No se pudieron cargar los movimientos."),
        });
      });

    return () => controller.abort();
  }, [movementsNonce]);

  const products =
    productsState.status === "ready" ? productsState.data : null;
  const movements =
    movementsState.status === "ready" ? movementsState.data : null;

  const summary =
    productsState.status === "ready"
      ? summarizeInventory(productsState.data)
      : null;

  const retryProducts = () => {
    setProductsState({ status: "loading" });
    setProductsNonce((value) => value + 1);
  };

  const retryMovements = () => {
    setMovementsState({ status: "loading" });
    setMovementsNonce((value) => value + 1);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen operativo del inventario."
      />

      <section
        aria-label="Indicadores de inventario"
        aria-busy={productsState.status === "loading"}
        className="grid grid-cols-2 gap-5 max-[767px]:grid-cols-1 desktop:grid-cols-4"
      >
        {productsState.status === "loading"
          ? Array.from({ length: 4 }, (_, index) => (
              <Card key={index}>
                <DashboardSkeleton variant="kpis" />
              </Card>
            ))
          : productsState.status === "error"
            ? (
              <div
                role="alert"
                className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card max-[767px]:col-span-1 max-desktop:col-span-2 desktop:col-span-4"
              >
                <p className="text-body text-text-secondary">
                  {productsState.message}
                </p>
                <Button
                  variant="secondary"
                  onClick={retryProducts}
                >
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
          status={movementsState.status}
          movements={movements}
          products={products}
          totalMovements={movements ? movements.length : 0}
          errorMessage={
            movementsState.status === "error"
              ? movementsState.message
              : undefined
          }
          onRetry={retryMovements}
        />
        <LowStockCard
          className="desktop:col-span-5"
          status={productsState.status}
          products={products}
          errorMessage={
            productsState.status === "error"
              ? productsState.message
              : undefined
          }
          onRetry={retryProducts}
        />
      </div>
    </div>
  );
}
