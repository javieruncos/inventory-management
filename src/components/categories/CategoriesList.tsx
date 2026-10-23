import type { CategoryDTO } from "@/types/category";
import { Pencil, Trash } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

type CategoriesListProps = {
  categories: CategoryDTO[];
  totalCategories: number;
  /** Abre el diálogo de edición; el segundo argumento es el botón disparador (para restaurar el foco al cerrar). */
  onEdit: (category: CategoryDTO, trigger: HTMLElement) => void;
  /** Abre el diálogo de confirmación de eliminación; el segundo argumento es el botón disparador. */
  onDelete: (category: CategoryDTO, trigger: HTMLElement) => void;
};

function descriptionOf(category: CategoryDTO): string {
  const description = category.description?.trim();
  return description ? description : "Sin descripción";
}

function countLabel(shown: number, total: number): string {
  if (shown === total) {
    return shown === 1
      ? "1 categoría registrada"
      : `${shown} categorías registradas`;
  }
  return `${shown} de ${total} categorías`;
}

export function CategoriesList({
  categories,
  totalCategories,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden desktop:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Listado de categorías con nombre y descripción.
          </caption>
          <thead>
            <tr className="bg-surface-nested text-label-sm uppercase text-text-secondary">
              <th scope="col" className="py-3 pl-0 pr-4 text-left">
                Nombre
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {categories.map((category) => (
              <tr
                key={category._id}
                className="transition-colors hover:bg-surface-nested"
              >
                <td className="py-3 pl-0 pr-4 align-middle">
                  <span className="block truncate font-medium text-text">
                    {category.name}
                  </span>
                  <span className="block truncate text-caption text-text-secondary">
                    {descriptionOf(category)}
                  </span>
                </td>
                <td className="py-3 pl-4 pr-0 text-right align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <IconButton
                      label={`Editar ${category.name}`}
                      icon={<Pencil size={16} />}
                      onClick={(event) =>
                        onEdit(category, event.currentTarget)
                      }
                    />
                    <IconButton
                      label={`Eliminar ${category.name}`}
                      icon={<Trash size={16} />}
                      onClick={(event) =>
                        onDelete(category, event.currentTarget)
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
        {categories.map((category) => (
          <li key={category._id}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-text">
                    {category.name}
                  </p>
                  <p className="truncate text-caption text-text-secondary">
                    {descriptionOf(category)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
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
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(categories.length, totalCategories)}
      </p>
    </div>
  );
}
