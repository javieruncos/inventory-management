import { type ReactNode } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { ProductDTO } from "@/types/product";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { getStockStatus, sortByCriticality } from "@/lib/dashboard";

type LowStockCardProps = {
  status: "loading" | "error" | "ready";
  products: ProductDTO[] | null;
  errorMessage?: string;
  onRetry: () => void;
  className?: string;
};

function attentionLabel(alertCount: number): string {
  return alertCount === 1
    ? "1 producto requiere atención"
    : `${alertCount} productos requieren atención`;
}

export function LowStockCard({
  status,
  products,
  errorMessage,
  onRetry,
  className,
}: LowStockCardProps) {
  let body: ReactNode;

  if (status === "loading") {
    body = <DashboardSkeleton variant="lowStock" />;
  } else if (status === "error") {
    body = (
      <div role="alert" className="flex flex-col items-start gap-3 py-4">
        <p className="text-body text-text-secondary">
          {errorMessage ?? "No se pudieron cargar los productos."}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  } else {
    const loadedProducts = products ?? [];
    const alerts = sortByCriticality(
      loadedProducts.filter(
        (product) => getStockStatus(product) !== "normal",
      ),
    );

    if (loadedProducts.length === 0) {
      body = (
        <p className="py-4 text-body text-text-secondary">
          No hay productos registrados.
        </p>
      );
    } else if (alerts.length === 0) {
      body = (
        <p className="py-4 text-body text-text-secondary">
          Sin productos bajo el umbral.
        </p>
      );
    } else {
      body = (
        <>
          <ul className="divide-y divide-divider">
            {alerts.map((product) => {
              const stockStatus = getStockStatus(product);

              return (
                <li
                  key={product._id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="flex min-w-0 flex-col">
                    <Link
                      href={`/products/${product._id}`}
                      className="truncate text-body font-medium text-text hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <span className="truncate text-caption text-text-secondary">
                      {product.sku} · Punto de reorden: {product.minimumStock}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge
                      variant={
                        stockStatus === "outOfStock"
                          ? "outOfStock"
                          : "lowStock"
                      }
                      label={
                        stockStatus === "outOfStock" ? "Agotado" : "Stock bajo"
                      }
                    />
                    <span className="text-caption tabular-nums text-text-secondary">
                      Actual: {product.currentStock}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-caption text-text-secondary">
            {attentionLabel(alerts.length)}
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
        title="Stock bajo"
        description="Productos por debajo del umbral o agotados."
        actions={
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center text-status-out-text"
          >
            <TriangleAlert size={16} />
          </span>
        }
      />
      {body}
    </Card>
  );
}
