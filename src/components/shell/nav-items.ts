import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  FolderTree,
  LayoutDashboard,
  Package,
  Truck,
} from "lucide-react";

export type NavItem = {
  label: string;
  /** null = sección preparada que aún no navega (vista no construida). */
  href: string | null;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Productos", href: "/products", icon: Package },
  { label: "Categorías", href: "/categories", icon: FolderTree },
  { label: "Proveedores", href: "/suppliers", icon: Truck },
  { label: "Movimientos de stock", href: "/stock", icon: ArrowLeftRight },
];
