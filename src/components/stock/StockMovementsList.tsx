import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TrendPill } from "@/components/ui/TrendPill";
import type { MovementWithProduct } from "@/lib/dashboard";
import { cn } from "@/lib/cn";

type StockMovementsListProps = {
  movements: MovementWithProduct[];
  totalMovements: number;
};

const dateFormat = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function productNameOf(movement: MovementWithProduct): string {
  return movement.product?.name ?? "Producto no disponible";
}

function typeLabel(movement: MovementWithProduct): string {
  return movement.type === "IN" ? "Entrada" : "Salida";
}

function quantityLabel(movement: MovementWithProduct): string {
  const sign = movement.type === "IN" ? "+" : "-";
  return `${sign}${movement.quantity} un.`;
}

function countLabel(shown: number, total: number): string {
  if (shown === total) {
    return shown === 1
      ? "1 movimiento registrado"
      : `${shown} movimientos registrados`;
  }
  return `${shown} de ${total} movimientos`;
}

function TypeMark({ movement }: { movement: MovementWithProduct }) {
  const isIn = movement.type === "IN";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-control",
        isIn
          ? "bg-status-in-bg text-status-in-text"
          : "bg-status-out-bg text-status-out-text",
      )}
    >
      {isIn ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
    </span>
  );
}

export function StockMovementsList({
  movements,
  totalMovements,
}: StockMovementsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden desktop:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Listado de movimientos de stock con producto, tipo, cantidad,
            motivo y fecha.
          </caption>
          <thead>
            <tr className="bg-surface-nested text-label-sm uppercase text-text-secondary">
              <th scope="col" className="py-3 pl-0 pr-4 text-left">
                Producto
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Tipo
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Cantidad
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Motivo
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {movements.map((movement) => (
              <tr
                key={movement._id}
                className="transition-colors hover:bg-surface-nested"
              >
                <td className="py-3 pl-0 pr-4 align-middle">
                  <span className="block truncate font-medium text-text">
                    {productNameOf(movement)}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-4 align-middle">
                  <span className="flex items-center gap-2">
                    <TypeMark movement={movement} />
                    <span
                      className={cn(
                        movement.type === "IN"
                          ? "text-status-in-text"
                          : "text-status-out-text",
                      )}
                    >
                      {typeLabel(movement)}
                    </span>
                  </span>
                </td>
                <td className="py-3 pl-4 pr-4 align-middle">
                  <TrendPill direction={movement.type === "IN" ? "up" : "down"}>
                    {quantityLabel(movement)}
                  </TrendPill>
                </td>
                <td className="py-3 pl-4 pr-4 align-middle">
                  <span className="block truncate text-text-secondary">
                    {movement.reason}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-0 text-right align-middle">
                  <time
                    dateTime={movement.createdAt}
                    className="block truncate text-text-secondary"
                  >
                    {dateFormat.format(new Date(movement.createdAt))}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 desktop:hidden">
        {movements.map((movement) => (
          <li key={movement._id}>
            <Card>
              <div className="flex items-start gap-3">
                <TypeMark movement={movement} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-body font-medium text-text">
                      {productNameOf(movement)}
                    </p>
                    <TrendPill
                      direction={movement.type === "IN" ? "up" : "down"}
                    >
                      {quantityLabel(movement)}
                    </TrendPill>
                  </div>
                  <p className="truncate text-caption text-text-secondary">
                    {typeLabel(movement)} · {movement.reason}
                  </p>
                  <time
                    dateTime={movement.createdAt}
                    className="truncate text-caption text-text-secondary"
                  >
                    {dateFormat.format(new Date(movement.createdAt))}
                  </time>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(movements.length, totalMovements)}
      </p>
    </div>
  );
}
