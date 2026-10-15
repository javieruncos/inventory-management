"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductsList } from "@/components/products/ProductsList";
import { ProductsSkeleton } from "@/components/products/ProductsSkeleton";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getStockStatus, type StockStatus } from "@/lib/dashboard";
import { toViewStatus, useDeleteProduct, useProducts } from "@/lib/queries";
import type { ProductDTO } from "@/types/product";

type StatusFilter = "ALL" | StockStatus;

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; product: ProductDTO }
  | null;

const FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "normal", label: "En stock" },
  { value: "lowStock", label: "Stock bajo" },
  { value: "outOfStock", label: "Agotado" },
];

export function ProductsView() {
  const productsQuery = useProducts();
  const deleteMutation = useDeleteProduct();
  const status = toViewStatus(productsQuery);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const listSectionRef = useRef<HTMLElement | null>(null);

  const openCreate = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDialog({ mode: "create" });
  };

  const openEdit = (product: ProductDTO, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDialog({ mode: "edit", product });
  };

  const closeDialog = useCallback(() => {
    setDialog(null);
    triggerRef.current?.focus();
  }, []);

  const openDelete = (product: ProductDTO, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDeleteError(null);
    setConfirmDelete(product);
  };

  const cancelDelete = () => {
    if (deleteMutation.isPending) return;
    setConfirmDelete(null);
    setDeleteError(null);
    triggerRef.current?.focus();
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete || deleteMutation.isPending) return;

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(confirmDelete._id);
      setConfirmDelete(null);
      setDeleteError(null);
      listSectionRef.current?.focus();
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el producto. Intentá nuevamente.",
      );
    }
  };

  const products = productsQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const matchesFilter =
      filter === "ALL" || getStockStatus(product) === filter;
    const matchesSearch =
      normalizedSearch === "" ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.sku.toLowerCase().includes(normalizedSearch);
    return matchesFilter && matchesSearch;
  });

  const retry = () => {
    void productsQuery.refetch();
  };

  let body: ReactNode;

  if (status === "loading") {
    body = <ProductsSkeleton />;
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p className="text-body text-text-secondary">
          {productsQuery.error instanceof ApiError
            ? productsQuery.error.message
            : "No se pudieron cargar los productos."}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (products.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay productos registrados.
      </p>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between">
          <div className="w-full desktop:w-72">
            <FormField
              id="products-search"
              label="Buscar"
              inputProps={{
                type: "search",
                placeholder: "Buscar por nombre o SKU",
                value: search,
                onChange: (event) => setSearch(event.target.value),
              }}
            />
          </div>
          <div
            role="group"
            aria-label="Filtrar por estado de stock"
            className="flex flex-wrap items-center gap-2"
          >
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "h-10 rounded-pill px-3 text-label",
                  "transition-colors duration-150 ease-emphasized",
                  filter === option.value
                    ? "bg-primary-soft text-primary"
                    : "text-neutral hover:bg-surface-nested",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-body text-text-secondary">
            {normalizedSearch !== ""
              ? "No hay productos que coincidan con la búsqueda."
              : "No hay productos con ese estado de stock."}
          </p>
        ) : (
          <ProductsList
            products={filtered}
            totalProducts={products.length}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-5"
        inert={dialog !== null || confirmDelete !== null}
      >
        <PageHeader
          title="Products"
          subtitle="Catálogo de productos del inventario."
          actions={
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" size={16} />
              Nuevo producto
            </Button>
          }
        />
        <section
          ref={listSectionRef}
          tabIndex={-1}
          aria-label="Listado de productos"
          aria-busy={status === "loading"}
          className="flex flex-col gap-4"
        >
          {body}
        </section>
      </div>
      {dialog ? (
        <ProductFormDialog
          key={dialog.mode === "edit" ? dialog.product._id : "create"}
          mode={dialog.mode}
          product={dialog.mode === "edit" ? dialog.product : null}
          onClose={closeDialog}
        />
      ) : null}
      {confirmDelete ? (
        <Dialog
          title="Eliminar producto"
          onClose={cancelDelete}
          closeDisabled={deleteMutation.isPending}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-body font-medium text-text">
                {confirmDelete.name}
              </p>
              <p className="text-caption text-text-secondary">
                SKU: {confirmDelete.sku}
              </p>
            </div>
            <p className="text-body text-text-secondary">
              Se quitará del listado y del inventario. El registro se
              conservará archivado; no se elimina de forma permanente.
            </p>
            {deleteError ? (
              <p
                role="alert"
                className="flex items-start gap-1.5 text-body text-status-out-text"
              >
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-px size-4 shrink-0"
                />
                <span>{deleteError}</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={cancelDelete}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
              </Button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
