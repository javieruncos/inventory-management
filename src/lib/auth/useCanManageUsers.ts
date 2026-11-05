"use client";

import { canManageUsers } from "@/lib/auth/permissions";
import { useMe } from "@/lib/queries";

export function useCanManageUsers(): boolean {
  const { data: user } = useMe();

  return canManageUsers(user?.role);
}
