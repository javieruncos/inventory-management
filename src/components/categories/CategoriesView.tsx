"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { CategoriesList } from "@/components/categories/CategoriesList";
import { CategoryFormDialog } from "@/components/categories/CategoryFormDialog";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  toViewStatus,
  useCategories,
  useDeleteCategory,
} from "@/lib/queries";
import { confirmDelete, notifyError } from "@/lib/sweetAlert";
import type { CategoryDTO } from "@/types/category";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; category: CategoryDTO }
  | null;

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

function CategoriesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span
                className={cn("h-4 w-48 max-w-full rounded-sm", pulseClass)}
              />
              <span
                className={cn("h-3 w-64 max-w-full rounded-sm", pulseClass)}
              />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={cn("size-8 rounded-control", pulseClass)} />
              <span className={cn("size-8 rounded-control", pulseClass)} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoriesView() {
  const categoriesQuery = useCategories();
  const deleteMutation = useDeleteCategory();
  const status = toViewStatus(categoriesQuery);
  const [dialog, setDialog] = useState<DialogState>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const listSectionRef = useRef<HTMLElement | null>(null);

  const openCreate = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDialog({ mode: "create" });
  };

  const openEdit = (category: CategoryDTO, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDialog({ mode: "edit", category });
  };

  const closeDialog = useCallback(() => {
    setDialog(null);
    triggerRef.current?.focus();
  }, []);

  const handleDelete = async (category: CategoryDTO) => {
    const result = await confirmDelete({
      title: "Eliminar categoría",
      text: `Se quitará "${category.name}" del listado de categorías. Las categorías que tengan productos asociados no se pueden eliminar.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(category._id);
      },
    });

    if (result.status === "failed") {
      await notifyError(
        result.error instanceof ApiError
          ? result.error.message
          : "No se pudo eliminar la categoría. Intentá nuevamente.",
      );
      return;
    }

    if (result.status === "confirmed") {
      listSectionRef.current?.focus();
    }
  };

  const retry = () => {
    void categoriesQuery.refetch();
  };

  const categories = categoriesQuery.data ?? [];

  let body: ReactNode;

  if (status === "loading") {
    body = <CategoriesSkeleton />;
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p className="text-body text-text-secondary">
          {categoriesQuery.error instanceof ApiError
            ? categoriesQuery.error.message
            : "No se pudieron cargar las categorías."}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (categories.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay categorías registradas.
      </p>
    );
  } else {
    body = (
      <CategoriesList
        categories={categories}
        totalCategories={categories.length}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-5"
        inert={dialog !== null}
      >
        <PageHeader
          title="Categories"
          subtitle="Categorías del inventario."
          actions={
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" size={16} />
              Nueva categoría
            </Button>
          }
        />
        <section
          ref={listSectionRef}
          tabIndex={-1}
          aria-label="Listado de categorías"
          aria-busy={status === "loading"}
          className="flex flex-col gap-4"
        >
          {body}
        </section>
      </div>
      {dialog ? (
        <CategoryFormDialog
          key={dialog.mode === "edit" ? dialog.category._id : "create"}
          mode={dialog.mode}
          category={dialog.mode === "edit" ? dialog.category : null}
          onClose={closeDialog}
        />
      ) : null}
    </>
  );
}
