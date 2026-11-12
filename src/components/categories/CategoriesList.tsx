import { CategoryCard } from "@/components/categories/CategoryCard";
import type { CategoryDTO } from "@/types/category";

type CategoriesListProps = {
  categories: CategoryDTO[];
  totalCategories: number;
  productCounts: ReadonlyMap<string, number> | null;
  canManage: boolean;
  /** Abre el diálogo de edición; el segundo argumento es el botón disparador (para restaurar el foco al cerrar). */
  onEdit: (category: CategoryDTO, trigger: HTMLElement) => void;
  /** Abre el diálogo de confirmación de eliminación; el segundo argumento es el botón disparador. */
  onDelete: (category: CategoryDTO, trigger: HTMLElement) => void;
};

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
  productCounts,
  canManage,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category._id} className="h-full">
            <CategoryCard
              category={category}
              productCount={
                productCounts ? (productCounts.get(category._id) ?? 0) : null
              }
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(categories.length, totalCategories)}
      </p>
    </div>
  );
}
