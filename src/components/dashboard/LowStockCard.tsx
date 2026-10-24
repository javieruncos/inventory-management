import { type ReactNode } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { ProductDTO } from "@/types/product";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import { getLowStockAlerts, getStockStatus } from "@/lib/dashboard";

type LowStockCardProps = {
  status: "loading" | "ready";
  products: ProductDTO[] | null;
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
  className,
}: LowStockCardProps) {
  let body: ReactNode;

  if (status === "loading") {
    body = <DashboardSkeleton variant="lowStock" />;
  } else {
    const loadedProducts = products ?? [];
    const { alerts, total, hasMore } = getLowStockAlerts(loadedProducts);

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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-text-secondary">
              {attentionLabel(total)}
            </p>
            {hasMore ? (
              <Link
                href="/products"
                aria-label="Ver todos los productos"
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
