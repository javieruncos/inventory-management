"use client";

import { canManageCatalog } from "@/lib/auth/permissions";
import { useMe } from "@/lib/queries";

export function useCanManageCatalog(): boolean {
  const { data: user } = useMe();

  return canManageCatalog(user?.role);
}
