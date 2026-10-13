import type { SupplierDTO } from "@/types/supplier";
import { Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

type SuppliersListProps = {
  suppliers: SupplierDTO[];
  totalSuppliers: number;
  /** Abre el diálogo de edición; el segundo argumento es el botón disparador (para restaurar el foco al cerrar). */
  onEdit: (supplier: SupplierDTO, trigger: HTMLElement) => void;
  /** Abre el diálogo de confirmación de eliminación; el segundo argumento es el botón disparador. */
  onDelete: (supplier: SupplierDTO, trigger: HTMLElement) => void;
};

function emailOf(supplier: SupplierDTO): string {
  const email = supplier.email?.trim();
  return email ? email : "Sin email";
}

function phoneOf(supplier: SupplierDTO): string {
  const phone = supplier.phone?.trim();
  return phone ? phone : "Sin teléfono";
}

function countLabel(shown: number, total: number): string {
  if (shown === total) {
    return shown === 1
      ? "1 proveedor registrado"
      : `${shown} proveedores registrados`;
  }
  return `${shown} de ${total} proveedores`;
}

export function SuppliersList({
  suppliers,
  totalSuppliers,
  onEdit,
  onDelete,
}: SuppliersListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden desktop:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Listado de proveedores con nombre, email y teléfono.
          </caption>
          <thead>
            <tr className="bg-surface-nested text-label-sm uppercase text-text-secondary">
              <th scope="col" className="py-3 pl-0 pr-4 text-left">
                Nombre
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Email
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Teléfono
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {suppliers.map((supplier) => (
              <tr
                key={supplier._id}
                className="transition-colors hover:bg-surface-nested"
              >
                <td className="py-3 pl-0 pr-4 align-middle">
                  <span className="block truncate font-medium text-text">
                    {supplier.name}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-4 align-middle">
                  <span className="block truncate text-text-secondary">
                    {emailOf(supplier)}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-4 align-middle">
                  <span className="block truncate text-text-secondary">
                    {phoneOf(supplier)}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-0 text-right align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <IconButton
                      label={`Editar ${supplier.name}`}
                      icon={<Pencil size={16} />}
                      onClick={(event) =>
                        onEdit(supplier, event.currentTarget)
                      }
                    />
                    <IconButton
                      label={`Eliminar ${supplier.name}`}
                      icon={<Trash size={16} />}
                      onClick={(event) =>
                        onDelete(supplier, event.currentTarget)
                      }
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 desktop:hidden">
        {suppliers.map((supplier) => (
          <li key={supplier._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-text">
                    {supplier.name}
                  </p>
                  <p className="truncate text-caption text-text-secondary">
                    {emailOf(supplier)}
                  </p>
                  <p className="truncate text-caption text-text-secondary">
                    {phoneOf(supplier)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <IconButton
                    label={`Editar ${supplier.name}`}
                    icon={<Pencil size={16} />}
                    onClick={(event) => onEdit(supplier, event.currentTarget)}
                  />
                  <IconButton
                    label={`Eliminar ${supplier.name}`}
                    icon={<Trash size={16} />}
                    onClick={(event) => onDelete(supplier, event.currentTarget)}
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(suppliers.length, totalSuppliers)}
      </p>
    </div>
  );
}
