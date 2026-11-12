"use client";

import {
  useCallback,
  useMemo,
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
import { useCanManageCatalog } from "@/lib/auth/useCanManageCatalog";
import { cn } from "@/lib/cn";
import {
  toViewStatus,
  useCategories,
  useDeleteCategory,
  useProducts,
} from "@/lib/queries";
import { confirmDelete, notifyError, notifySuccess } from "@/lib/sweetAlert";
import type { CategoryDTO } from "@/types/category";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; category: CategoryDTO }
  | null;

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "CONFLICT" && error.message) return error.message;
    if (error.kind === "NOT_FOUND") {
      return "El registro ya no existe. Actualizá el listado.";
    }
  }
  return "No se pudo completar la operación. Intentá nuevamente.";
}

function CategoriesSkeleton({ canManage }: { canManage: boolean }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="relative h-full rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <div
            className={cn(
              "flex items-start gap-3",
              canManage && "pr-20",
            )}
          >
            <span
              className={cn("size-11 shrink-0 rounded-nested", pulseClass)}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span
                className={cn("h-4 w-40 max-w-full rounded-sm", pulseClass)}
              />
              <span
                className={cn("h-3 w-full max-w-full rounded-sm", pulseClass)}
              />
              <span
                className={cn("h-3 w-2/3 max-w-full rounded-sm", pulseClass)}
              />
            </span>
          </div>
          {canManage ? (
            <span className="absolute right-5 top-5 flex shrink-0 items-center gap-2">
              <span className={cn("size-8 rounded-control", pulseClass)} />
              <span className={cn("size-8 rounded-control", pulseClass)} />
            </span>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-nested bg-surface-nested p-3">
            <span className={cn("h-8 rounded-sm", pulseClass)} />
            <span className={cn("h-8 rounded-sm", pulseClass)} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoriesView() {
  const canManage = useCanManageCatalog();
  const categoriesQuery = useCategories();
  const productsQuery = useProducts();
  const deleteMutation = useDeleteCategory();
  const status = toViewStatus(categoriesQuery);
  const productCounts = useMemo(() => {
    if (!productsQuery.data) return null;

    const counts = new Map<string, number>();
    for (const product of productsQuery.data) {
      counts.set(
        product.categoryId,
        (counts.get(product.categoryId) ?? 0) + 1,
      );
    }
    return counts;
  }, [productsQuery.data]);
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
      await notifyError(deleteErrorMessage(result.error));
      return;
    }

    if (result.status === "confirmed") {
      void notifySuccess("Categoría eliminada");
      listSectionRef.current?.focus();
    }
  };

  const retry = () => {
    void categoriesQuery.refetch();
  };

  const retryProductCounts = () => {
    void productsQuery.refetch();
  };

  const categories = categoriesQuery.data ?? [];

  let body: ReactNode;

  if (status === "loading") {
    body = <CategoriesSkeleton canManage={canManage} />;
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
      <>
        {productsQuery.isError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <p className="text-body text-text-secondary">
              No se pudieron cargar los conteos de productos.
            </p>
            <Button variant="secondary" onClick={retryProductCounts}>
              Reintentar
            </Button>
          </div>
        ) : null}
        <CategoriesList
          categories={categories}
          totalCategories={categories.length}
          productCounts={productCounts}
          canManage={canManage}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </>
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-5"
        inert={dialog !== null}
      >
        <PageHeader
          title="Categorías"
          subtitle="Categorías del inventario."
          actions={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" size={16} />
                Nueva categoría
              </Button>
            ) : undefined
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
