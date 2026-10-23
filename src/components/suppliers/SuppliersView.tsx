"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { SuppliersList } from "@/components/suppliers/SuppliersList";
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  toViewStatus,
  useDeleteSupplier,
  useSuppliers,
} from "@/lib/queries";
import { confirmDelete, notifyError, notifySuccess } from "@/lib/sweetAlert";
import type { SupplierDTO } from "@/types/supplier";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; supplier: SupplierDTO }
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

  const handleDelete = async (supplier: SupplierDTO) => {
    const result = await confirmDelete({
      title: "Eliminar proveedor",
      text: `Se quitará "${supplier.name}" del listado de proveedores. Los proveedores que tengan productos asociados no se pueden eliminar.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(supplier._id);
      },
    });

    if (result.status === "failed") {
      await notifyError(deleteErrorMessage(result.error));
      return;
    }

    if (result.status === "confirmed") {
      void notifySuccess("Proveedor eliminado");
      listSectionRef.current?.focus();
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
          title="Proveedores"
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
    </>
  );
}
