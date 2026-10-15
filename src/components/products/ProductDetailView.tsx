"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  DollarSign,
  Layers,
  Package,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendPill } from "@/components/ui/TrendPill";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getStockStatus } from "@/lib/dashboard";
import {
  isValidObjectId,
  toViewStatus,
  useCategories,
  useProduct,
  useProductMovements,
  useSuppliers,
} from "@/lib/queries";
import type { ProductDTO } from "@/types/product";
import type { StockMovementDTO } from "@/types/stockMovement";

const numberFormat = new Intl.NumberFormat("es");
const dateFormat = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

type StockBadge = {
  variant: "inStock" | "lowStock" | "outOfStock";
  label: string;
};

function badgeOf(product: ProductDTO): StockBadge {
  const status = getStockStatus(product);

  if (status === "normal") return { variant: "inStock", label: "En stock" };
  if (status === "lowStock") return { variant: "lowStock", label: "Stock bajo" };
  return { variant: "outOfStock", label: "Agotado" };
}

function movementLabel(total: number): string {
  return total === 1
    ? "1 movimiento registrado"
    : `${total} movimientos registrados`;
}

function BackLink() {
  return (
    <Link
      href="/products"
      className="inline-flex h-10 items-center gap-2 text-label text-primary hover:underline"
    >
      <ChevronLeft aria-hidden="true" size={16} />
      Volver a productos
    </Link>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <span className={cn("h-10 w-72 max-w-full rounded-sm", pulseClass)} />
      <div className="grid gap-4 desktop:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className={cn("size-9 rounded-control", pulseClass)} />
              <span className={cn("h-4 w-20 rounded-sm", pulseClass)} />
            </div>
            <span
              className={cn("mt-3 block h-8 w-28 rounded-sm", pulseClass)}
            />
          </div>
        ))}
      </div>
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <span className={cn("block h-4 w-40 rounded-sm", pulseClass)} />
        <span
          className={cn("mt-4 block h-24 w-full rounded-nested", pulseClass)}
        />
      </div>
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <span className={cn("block h-4 w-48 rounded-sm", pulseClass)} />
        <span
          className={cn("mt-4 block h-40 w-full rounded-nested", pulseClass)}
        />
      </div>
    </div>
  );
}

function MovementsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-1">
          <span className={cn("size-9 shrink-0 rounded-control", pulseClass)} />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={cn("h-4 w-24 rounded-sm", pulseClass)} />
            <span className={cn("h-3 w-48 max-w-full rounded-sm", pulseClass)} />
          </span>
          <span className={cn("h-6 w-16 shrink-0 rounded-pill", pulseClass)} />
        </div>
      ))}
    </div>
  );
}

type LookupStatus = "loading" | "error" | "ready";

type LookupValueProps = {
  status: LookupStatus;
  value?: string;
  emptyLabel: string;
  errorLabel: string;
};

function LookupValue({
  status,
  value,
  emptyLabel,
  errorLabel,
}: LookupValueProps) {
  if (status === "error") {
    return (
      <span className="flex flex-col gap-0.5">
        <span>No disponible</span>
        <span className="text-caption text-text-secondary">{errorLabel}</span>
      </span>
    );
  }

  if (status === "loading") {
    return <span className="text-text-secondary">Cargando…</span>;
  }

  return <>{value ?? emptyLabel}</>;
}

type DetailErrorProps = {
  message: string;
  onRetry?: () => void;
};

function DetailError({ message, onRetry }: DetailErrorProps) {
  return (
    <div className="flex flex-col items-start gap-3 py-4">
      <p
        role="alert"
        className="flex items-start gap-1.5 text-body text-status-out-text"
      >
        <TriangleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
        <span>{message}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
        <BackLink />
      </div>
    </div>
  );
}

type MovementRowProps = {
  movement: StockMovementDTO;
};

function MovementRow({ movement }: MovementRowProps) {
  const isIn = movement.type === "IN";

  return (
    <li className="flex items-center gap-3 py-3">
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
        <span className="truncate text-body font-medium text-text">
          {isIn ? "Entrada" : "Salida"}
        </span>
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
}

type MovementsSectionProps = {
  status: "loading" | "error" | "ready";
  movements: StockMovementDTO[];
  errorMessage?: string;
  onRetry: () => void;
};

function MovementsSection({
  status,
  movements,
  errorMessage,
  onRetry,
}: MovementsSectionProps) {
  let body;

  if (status === "loading") {
    body = <MovementsSkeleton />;
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-start gap-3 py-2">
        <p
          role="alert"
          className="flex items-start gap-1.5 text-body text-status-out-text"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-px size-4 shrink-0"
          />
          <span>
            {errorMessage ?? "No se pudieron cargar los movimientos."}
          </span>
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (movements.length === 0) {
    body = (
      <p className="py-2 text-body text-text-secondary">
        No hay movimientos registrados para este producto.
      </p>
    );
  } else {
    body = (
      <>
        <ul className="divide-y divide-divider">
          {movements.map((movement) => (
            <MovementRow key={movement._id} movement={movement} />
          ))}
        </ul>
        <p className="mt-4 text-caption text-text-secondary">
          {movementLabel(movements.length)}
        </p>
      </>
    );
  }

  return (
    <Card aria-busy={status === "loading"}>
      <CardHeader
        title="Movimientos de stock"
        description="Historial de entradas y salidas del producto."
      />
      {body}
    </Card>
  );
}

type ProductDetailViewProps = {
  productId: string;
};

export function ProductDetailView({ productId }: ProductDetailViewProps) {
  const productQuery = useProduct(productId);
  const movementsQuery = useProductMovements(productId);
  const categoriesQuery = useCategories();
  const suppliersQuery = useSuppliers();
  const status = toViewStatus(productQuery);

  if (!isValidObjectId(productId)) {
    return (
      <div className="flex flex-col gap-5">
        <BackLink />
        <PageHeader
          title="ID de producto no válido"
          subtitle="Revisá el enlace e intentá nuevamente."
        />
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-5" aria-busy="true">
        <BackLink />
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (status === "error") {
    const error = productQuery.error;
    const notFound = error instanceof ApiError && error.status === 404;

    const message = notFound
      ? "El producto no existe o fue eliminado."
      : error instanceof ApiError
        ? error.message
        : "No se pudo cargar el producto. Intentá nuevamente.";

    return (
      <div className="flex flex-col gap-5">
        <BackLink />
        <PageHeader title="Detalle de producto" />
        <DetailError
          message={message}
          onRetry={notFound ? undefined : () => void productQuery.refetch()}
        />
      </div>
    );
  }

  const product = productQuery.data;

  if (!product) {
    return null;
  }

  const badge = badgeOf(product);
  const category = (categoriesQuery.data ?? []).find(
    (item) => item._id === product.categoryId,
  );
  const supplier = product.supplierId
    ? (suppliersQuery.data ?? []).find(
        (item) => item._id === product.supplierId,
      )
    : undefined;
  const description = product.description?.trim();
  const categoriesStatus = toViewStatus(categoriesQuery);
  const suppliersStatus = toViewStatus(suppliersQuery);

  return (
    <div className="flex flex-col gap-5">
      <BackLink />
      <PageHeader
        title={product.name}
        subtitle={`SKU ${product.sku}`}
        actions={<StatusBadge variant={badge.variant} label={badge.label} />}
      />

      <div className="grid gap-4 desktop:grid-cols-3">
        <StatCard
          icon={<DollarSign aria-hidden="true" size={18} />}
          label="Precio"
          value={numberFormat.format(product.price)}
        />
        <StatCard
          icon={<Package aria-hidden="true" size={18} />}
          label="Stock actual"
          value={product.currentStock}
        />
        <StatCard
          icon={<Layers aria-hidden="true" size={18} />}
          label="Stock mínimo"
          value={product.minimumStock}
        />
      </div>

      <Card>
        <CardHeader title="Información" />
        <dl className="grid gap-x-8 gap-y-4 desktop:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-caption text-text-secondary">Descripción</dt>
            <dd className="mt-1 text-body text-text">
              {description ? description : "Sin descripción"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-caption text-text-secondary">Categoría</dt>
            <dd className="mt-1 text-body text-text">
              <LookupValue
                status={categoriesStatus}
                value={category?.name}
                emptyLabel="Sin categoría"
                errorLabel="No se pudo cargar la categoría."
              />
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-caption text-text-secondary">Proveedor</dt>
            <dd className="mt-1 text-body text-text">
              {product.supplierId ? (
                <LookupValue
                  status={suppliersStatus}
                  value={supplier?.name}
                  emptyLabel="Sin proveedor"
                  errorLabel="No se pudo cargar el proveedor."
                />
              ) : (
                "Sin proveedor"
              )}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-caption text-text-secondary">Fechas</dt>
            <dd className="mt-1 flex flex-col gap-0.5 text-body text-text">
              <time dateTime={product.createdAt}>
                Creado: {dateTimeFormat.format(new Date(product.createdAt))}
              </time>
              <time dateTime={product.updatedAt}>
                Actualizado:{" "}
                {dateTimeFormat.format(new Date(product.updatedAt))}
              </time>
            </dd>
          </div>
        </dl>
      </Card>

      <MovementsSection
        status={toViewStatus(movementsQuery)}
        movements={movementsQuery.data ?? []}
        errorMessage={
          movementsQuery.error instanceof ApiError
            ? movementsQuery.error.message
            : undefined
        }
        onRetry={() => void movementsQuery.refetch()}
      />
    </div>
  );
}
