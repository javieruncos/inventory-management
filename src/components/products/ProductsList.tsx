import type { ProductDTO } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getStockStatus } from "@/lib/dashboard";

const numberFormat = new Intl.NumberFormat("es");

type ProductsListProps = {
  products: ProductDTO[];
  totalProducts: number;
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

export function ProductsList({ products, totalProducts }: ProductsListProps) {
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
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Estado
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
                    <span className="block truncate font-medium text-text">
                      {product.name}
                    </span>
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
                  <td className="py-3 pl-4 pr-0 text-right align-middle">
                    <StatusBadge variant={badge.variant} label={badge.label} />
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
                      {product.name}
                    </p>
                    <p className="truncate text-caption text-text-secondary">
                      {product.sku}
                    </p>
                  </div>
                  <StatusBadge variant={badge.variant} label={badge.label} />
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
