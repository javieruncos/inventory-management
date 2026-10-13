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
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: FolderTree },
  { label: "Suppliers", href: null, icon: Truck },
  { label: "Stock Movements", href: null, icon: ArrowLeftRight },
];
