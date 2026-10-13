"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus, TriangleAlert } from "lucide-react";
import { SuppliersList } from "@/components/suppliers/SuppliersList";
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  toViewStatus,
  useDeleteSupplier,
  useSuppliers,
} from "@/lib/queries";
import type { SupplierDTO } from "@/types/supplier";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; supplier: SupplierDTO }
  | null;

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

function contactLineOf(supplier: SupplierDTO): string {
  return [supplier.email, supplier.phone]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");
}

function SuppliersSkeleton() {
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

export function SuppliersView() {
  const suppliersQuery = useSuppliers();
  const deleteMutation = useDeleteSupplier();
  const status = toViewStatus(suppliersQuery);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDelete, setConfirmDelete] = useState<SupplierDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const listSectionRef = useRef<HTMLElement | null>(null);

  const openCreate = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDialog({ mode: "create" });
  };

  const openEdit = (supplier: SupplierDTO, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDialog({ mode: "edit", supplier });
  };

  const closeDialog = useCallback(() => {
    setDialog(null);
    triggerRef.current?.focus();
  }, []);

  const openDelete = (supplier: SupplierDTO, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setDeleteError(null);
    setConfirmDelete(supplier);
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
          : "No se pudo eliminar el proveedor. Intentá nuevamente.",
      );
    }
  };

  const retry = () => {
    void suppliersQuery.refetch();
  };

  const suppliers = suppliersQuery.data ?? [];

  let body: ReactNode;

  if (status === "loading") {
    body = <SuppliersSkeleton />;
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p className="text-body text-text-secondary">
          {suppliersQuery.error instanceof ApiError
            ? suppliersQuery.error.message
            : "No se pudieron cargar los proveedores."}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (suppliers.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay proveedores registrados.
      </p>
    );
  } else {
    body = (
      <SuppliersList
        suppliers={suppliers}
        totalSuppliers={suppliers.length}
        onEdit={openEdit}
        onDelete={openDelete}
      />
    );
  }

  return (
    <>
      <div
        className="flex flex-col gap-5"
        inert={dialog !== null || confirmDelete !== null}
      >
        <PageHeader
          title="Suppliers"
          subtitle="Proveedores del inventario."
          actions={
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" size={16} />
              Nuevo proveedor
            </Button>
          }
        />
        <section
          ref={listSectionRef}
          tabIndex={-1}
          aria-label="Listado de proveedores"
          aria-busy={status === "loading"}
          className="flex flex-col gap-4"
        >
          {body}
        </section>
      </div>
      {dialog ? (
        <SupplierFormDialog
          key={dialog.mode === "edit" ? dialog.supplier._id : "create"}
          mode={dialog.mode}
          supplier={dialog.mode === "edit" ? dialog.supplier : null}
          onClose={closeDialog}
        />
      ) : null}
      {confirmDelete ? (
        <Dialog
          title="Eliminar proveedor"
          onClose={cancelDelete}
          closeDisabled={deleteMutation.isPending}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-body font-medium text-text">
                {confirmDelete.name}
              </p>
              {contactLineOf(confirmDelete) ? (
                <p className="text-caption text-text-secondary">
                  {contactLineOf(confirmDelete)}
                </p>
              ) : null}
            </div>
            <p className="text-body text-text-secondary">
              Se quitará del listado de proveedores. Los proveedores que tengan
              productos asociados no se pueden eliminar.
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
