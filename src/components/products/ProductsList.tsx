import type { ProductDTO } from "@/types/product";
import Link from "next/link";
import { Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStockStatus } from "@/lib/dashboard";

const numberFormat = new Intl.NumberFormat("es");

type ProductsListProps = {
  products: ProductDTO[];
  totalProducts: number;
  /** Abre el diálogo de edición; el segundo argumento es el botón disparador (para restaurar el foco al cerrar). */
  onEdit: (product: ProductDTO, trigger: HTMLElement) => void;
  /** Abre el diálogo de confirmación de eliminación; el segundo argumento es el botón disparador. */
  onDelete: (product: ProductDTO, trigger: HTMLElement) => void;
};

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

function countLabel(shown: number, total: number): string {
  if (shown === total) {
    return shown === 1
      ? "1 producto registrado"
      : `${shown} productos registrados`;
  }
  return `${shown} de ${total} productos`;
}

export function ProductsList({
  products,
  totalProducts,
  onEdit,
  onDelete,
}: ProductsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden desktop:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Listado de productos con precio, stock y estado.
          </caption>
          <thead>
            <tr className="bg-surface-nested text-label-sm uppercase text-text-secondary">
              <th scope="col" className="py-3 pl-0 pr-4 text-left">
                Producto
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Precio
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actual
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Mínimo
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Estado
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {products.map((product) => {
              const badge = badgeOf(product);

              return (
                <tr
                  key={product._id}
                  className="transition-colors hover:bg-surface-nested"
                >
                  <td className="py-3 pl-0 pr-4 align-middle">
                    <Link
                      href={`/products/${product._id}`}
                      className="block truncate font-medium text-text hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <span className="block truncate text-caption text-text-secondary">
                      {product.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {numberFormat.format(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {product.currentStock}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {product.minimumStock}
                  </td>
                  <td className="py-3 px-4 text-right align-middle">
                    <StatusBadge variant={badge.variant} label={badge.label} />
                  </td>
                  <td className="py-3 pl-4 pr-0 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        label={`Editar ${product.name}`}
                        icon={<Pencil size={16} />}
                        onClick={(event) =>
                          onEdit(product, event.currentTarget)
                        }
                      />
                      <IconButton
                        label={`Eliminar ${product.name}`}
                        icon={<Trash size={16} />}
                        onClick={(event) =>
                          onDelete(product, event.currentTarget)
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 desktop:hidden">
        {products.map((product) => {
          const badge = badgeOf(product);

          return (
            <li key={product._id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-text">
                      <Link
                        href={`/products/${product._id}`}
                        className="hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </p>
                    <p className="truncate text-caption text-text-secondary">
                      {product.sku}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge
                      variant={badge.variant}
                      label={badge.label}
                    />
                    <IconButton
                      label={`Editar ${product.name}`}
                      icon={<Pencil size={16} />}
                      onClick={(event) =>
                        onEdit(product, event.currentTarget)
                      }
                    />
                    <IconButton
                      label={`Eliminar ${product.name}`}
                      icon={<Trash size={16} />}
                      onClick={(event) =>
                        onDelete(product, event.currentTarget)
                      }
                    />
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-nested bg-surface-nested p-3">
                  <div className="min-w-0">
                    <dt className="text-caption text-text-secondary">
                      Precio
                    </dt>
                    <dd className="truncate text-label tabular-nums text-text">
                      {numberFormat.format(product.price)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-caption text-text-secondary">
                      Actual
                    </dt>
                    <dd className="text-label tabular-nums text-text">
                      {product.currentStock}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-caption text-text-secondary">
                      Mínimo
                    </dt>
                    <dd className="text-label tabular-nums text-text">
                      {product.minimumStock}
                    </dd>
                  </div>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(products.length, totalProducts)}
      </p>
    </div>
  );
}
