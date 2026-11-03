"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import { UsersList } from "@/components/users/UsersList";
import { UsersSkeleton } from "@/components/users/UsersSkeleton";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { toViewStatus, useDeactivateUser, useMe, useUsers } from "@/lib/queries";
import { confirmDelete, notifyError, notifySuccess } from "@/lib/sweetAlert";
import type { UserDTO } from "@/types/user";

function deactivateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      (error.kind === "FORBIDDEN" || error.kind === "CONFLICT") &&
      error.message
    ) {
      return error.message;
    }
    if (error.kind === "NOT_FOUND") {
      return "El usuario ya no existe. Actualizá el listado.";
    }
  }
  return "No se pudo desactivar el usuario. Intentá nuevamente.";
}

export function UsersView() {
  const { data: currentUser } = useMe();
  const usersQuery = useUsers();
  const deactivateMutation = useDeactivateUser();
  const status = toViewStatus(usersQuery);
  const [dialogOpen, setDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const listSectionRef = useRef<HTMLElement | null>(null);

  const currentUserId = currentUser?.id ?? "";

  const openCreate = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setDialogOpen(true);
  };

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    triggerRef.current?.focus();
  }, []);

  const handleDeactivate = async (user: UserDTO) => {
    if (!user.isActive || user.id === currentUserId) return;

    const result = await confirmDelete({
      title: "Desactivar usuario",
      text: `La cuenta "${user.email}" quedará inactiva y no podrá iniciar sesión. No se ofrece reactivación desde esta interfaz.`,
      confirmText: "Desactivar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        await deactivateMutation.mutateAsync(user.id);
      },
    });

    if (result.status === "failed") {
      await notifyError(deactivateErrorMessage(result.error));
      return;
    }

    if (result.status === "confirmed") {
      void notifySuccess("Usuario desactivado");
      listSectionRef.current?.focus();
    }
  };

  const retry = () => {
    void usersQuery.refetch();
  };

  const users = usersQuery.data ?? [];

  let body: ReactNode;

  if (status === "loading") {
    body = <UsersSkeleton />;
  } else if (status === "error") {
    body = (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p className="text-body text-text-secondary">
          {usersQuery.error instanceof ApiError
            ? usersQuery.error.message
            : "No se pudieron cargar los usuarios."}
        </p>
        <Button variant="secondary" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  } else if (users.length === 0) {
    body = (
      <p className="text-body text-text-secondary">
        No hay usuarios registrados.
      </p>
    );
  } else {
    body = (
      <UsersList
        users={users}
        totalUsers={users.length}
        currentUserId={currentUserId}
        onDeactivate={handleDeactivate}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5" inert={dialogOpen}>
        <PageHeader
          title="Usuarios"
          subtitle="Cuentas de acceso al sistema."
          actions={
            <Button onClick={openCreate}>
              <Plus aria-hidden="true" size={16} />
              Nuevo usuario
            </Button>
          }
        />
        <section
          ref={listSectionRef}
          tabIndex={-1}
          aria-label="Listado de usuarios"
          aria-busy={status === "loading"}
          className="flex flex-col gap-4"
        >
          {body}
        </section>
      </div>
      {dialogOpen ? <UserFormDialog onClose={closeDialog} /> : null}
    </>
  );
}
