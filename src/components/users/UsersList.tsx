import { UserMinus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { UserDTO } from "@/types/user";

type UsersListProps = {
  users: UserDTO[];
  totalUsers: number;
  currentUserId: string;
  onDeactivate: (user: UserDTO) => void;
};

const dateFormat = new Intl.DateTimeFormat("es", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function roleLabel(role: UserDTO["role"]): string {
  return role === "admin" ? "Administrador" : "Usuario";
}

function countLabel(shown: number, total: number): string {
  if (shown === total) {
    return shown === 1
      ? "1 usuario registrado"
      : `${shown} usuarios registrados`;
  }
  return `${shown} de ${total} usuarios`;
}

function UserStatus({ user }: { user: UserDTO }) {
  return (
    <StatusBadge
      variant={user.isActive ? "inStock" : "archived"}
      label={user.isActive ? "Activo" : "Inactivo"}
    />
  );
}

function canDeactivate(user: UserDTO, currentUserId: string): boolean {
  return user.isActive && user.id !== currentUserId;
}

export function UsersList({
  users,
  totalUsers,
  currentUserId,
  onDeactivate,
}: UsersListProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden desktop:block">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">
            Listado de usuarios con email, rol, estado y fecha de creación.
          </caption>
          <thead>
            <tr className="bg-surface-nested text-label-sm uppercase text-text-secondary">
              <th scope="col" className="py-3 pl-0 pr-4 text-left">
                Email
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Rol
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Estado
              </th>
              <th scope="col" className="py-3 pl-4 pr-4 text-left">
                Creado
              </th>
              <th scope="col" className="py-3 pl-4 pr-0 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {users.map((user) => {
              const deactivatable = canDeactivate(user, currentUserId);

              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-surface-nested"
                >
                  <td className="py-3 pl-0 pr-4 align-middle">
                    <span
                      title={user.email}
                      className="block max-w-[320px] truncate font-medium text-text"
                    >
                      {user.email}
                    </span>
                  </td>
                  <td className="py-3 pl-4 pr-4 align-middle text-text-secondary">
                    {roleLabel(user.role)}
                  </td>
                  <td className="py-3 pl-4 pr-4 align-middle">
                    <UserStatus user={user} />
                  </td>
                  <td className="py-3 pl-4 pr-4 align-middle">
                    <time
                      dateTime={user.createdAt}
                      className="whitespace-nowrap text-text-secondary"
                    >
                      {dateFormat.format(new Date(user.createdAt))}
                    </time>
                  </td>
                  <td className="py-3 pl-4 pr-0 text-right align-middle">
                    {deactivatable ? (
                      <IconButton
                        label={`Desactivar ${user.email}`}
                        icon={<UserMinus size={16} />}
                        onClick={() => onDeactivate(user)}
                      />
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-4 desktop:hidden">
        {users.map((user) => {
          const deactivatable = canDeactivate(user, currentUserId);

          return (
            <li key={user.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      title={user.email}
                      className="truncate text-body font-medium text-text"
                    >
                      {user.email}
                    </p>
                    <p className="mt-1 text-caption text-text-secondary">
                      {roleLabel(user.role)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <UserStatus user={user} />
                      <time
                        dateTime={user.createdAt}
                        className="text-caption text-text-secondary"
                      >
                        {dateFormat.format(new Date(user.createdAt))}
                      </time>
                    </div>
                  </div>
                  {deactivatable ? (
                    <IconButton
                      label={`Desactivar ${user.email}`}
                      icon={<UserMinus size={16} />}
                      onClick={() => onDeactivate(user)}
                    />
                  ) : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="text-caption text-text-secondary">
        {countLabel(users.length, totalUsers)}
      </p>
    </div>
  );
}
