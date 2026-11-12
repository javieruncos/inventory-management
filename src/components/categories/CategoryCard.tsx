import Link from "next/link";
import { Package, Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";
import type { CategoryDTO } from "@/types/category";

const numberFormat = new Intl.NumberFormat("es");

type CategoryCardProps = {
  category: CategoryDTO;
  productCount: number | null;
  canManage: boolean;
  onEdit: (category: CategoryDTO, trigger: HTMLElement) => void;
  onDelete: (category: CategoryDTO, trigger: HTMLElement) => void;
};

function descriptionOf(category: CategoryDTO): string {
  const description = category.description?.trim();
  return description ? description : "Sin descripción";
}

function initialOf(category: CategoryDTO): string {
  return (
    Array.from(category.name.trim())[0]?.toLocaleUpperCase("es") ?? "?"
  );
}

function productCountLabel(productCount: number | null): string {
  if (productCount === null) return "—";
  if (productCount === 1) return "1 producto";
  return `${numberFormat.format(productCount)} productos`;
}

export function CategoryCard({
  category,
  productCount,
  canManage,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const usage =
    productCount === null
      ? null
      : productCount > 0
        ? { variant: "inStock" as const, label: "En uso" }
        : { variant: "archived" as const, label: "Sin productos" };

  return (
    <Card className="group relative h-full transition-all duration-150 ease-emphasized hover:border-border-strong hover:shadow-popover focus-within:border-border-strong">
      <Link
        href={`/products?category=${category._id}`}
        className="absolute inset-0 z-10 rounded-card"
      >
        <span className="sr-only">Ver productos de {category.name}</span>
      </Link>

      <div className="pointer-events-none relative flex h-full flex-col gap-4">
        <div
          className={cn(
            "flex items-start gap-3",
            canManage && "pr-20",
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-nested bg-primary-soft text-label text-primary"
          >
            {initialOf(category)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-heading-sm text-text transition-colors group-hover:text-primary">
              {category.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-body-sm text-text-secondary">
              {descriptionOf(category)}
            </p>
          </div>
        </div>

        <dl className="mt-auto flex items-center justify-between gap-3 rounded-nested bg-surface-nested p-3">
          <div className="flex h-6 min-w-0 items-center gap-2">
            <dt className="sr-only">Productos</dt>
            <Package
              aria-hidden="true"
              size={16}
              className="shrink-0 text-text-secondary"
            />
            <dd className="truncate text-label tabular-nums text-text">
              {productCountLabel(productCount)}
            </dd>
          </div>
          <div className="flex h-6 shrink-0 items-center">
            <dt className="sr-only">Estado</dt>
            <dd>
              {usage ? (
                <StatusBadge variant={usage.variant} label={usage.label} />
              ) : (
                <span className="inline-flex h-6 items-center text-label text-text-secondary">
                  —
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {canManage ? (
        <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
          <IconButton
            label={`Editar ${category.name}`}
            icon={<Pencil size={16} />}
            onClick={(event) => onEdit(category, event.currentTarget)}
          />
          <IconButton
            label={`Eliminar ${category.name}`}
            icon={<Trash size={16} />}
            onClick={(event) => onDelete(category, event.currentTarget)}
          />
        </div>
      ) : null}
    </Card>
  );
}
