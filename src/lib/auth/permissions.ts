import type { AuthUser } from "@/lib/api";

type UserRole = AuthUser["role"] | null | undefined;

export function canManageCatalog(role: UserRole): boolean {
  return role === "admin";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
