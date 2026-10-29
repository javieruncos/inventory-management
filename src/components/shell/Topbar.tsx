"use client";

import type { Ref } from "react";
import { Menu } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

type TopbarProps = {
  onOpenMenu: () => void;
  menuRef: Ref<HTMLButtonElement>;
  menuOpen: boolean;
};

export function Topbar({ onOpenMenu, menuRef, menuOpen }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 border-b border-border bg-surface px-4 desktop:px-8">
      <IconButton
        ref={menuRef}
        label="Abrir navegación"
        icon={<Menu size={16} />}
        aria-expanded={menuOpen}
        aria-controls="app-drawer"
        className="md:hidden"
        onClick={onOpenMenu}
      />
    </header>
  );
}
