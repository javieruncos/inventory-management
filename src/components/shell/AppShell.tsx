"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Main } from "@/components/shell/Main";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { IconButton } from "@/components/ui/IconButton";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerWasOpen = useRef(false);

  /* Escape cierra el drawer y bloquea el scroll del fondo mientras está abierto. */
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  /* El foco entra al drawer al abrirlo y vuelve al botón al cerrarlo. */
  useEffect(() => {
    if (drawerOpen) {
      drawerWasOpen.current = true;
      drawerRef.current?.focus();
    } else if (drawerWasOpen.current) {
      drawerWasOpen.current = false;
      menuRef.current?.focus();
    }
  }, [drawerOpen]);

  return (
    <>
      <div ref={shellRef} inert={drawerOpen} className="min-h-dvh">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-label focus:text-primary focus:shadow-popover"
        >
          Saltar al contenido
        </a>

        <div className="flex min-h-dvh">
          <Sidebar className="sticky top-0 hidden w-[76px] md:flex desktop:w-[250px]" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              menuRef={menuRef}
              menuOpen={drawerOpen}
              onOpenMenu={() => setDrawerOpen(true)}
            />
            <Main>{children}</Main>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <div
          id="app-drawer"
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navegación"
        >
          <button
            type="button"
            aria-label="Cerrar navegación"
            tabIndex={-1}
            className="absolute inset-0 bg-[rgba(15,23,42,0.4)]"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className="absolute inset-y-0 left-0 w-[250px] max-w-[85vw] overflow-y-auto overscroll-contain shadow-popover focus:outline-none"
          >
            <IconButton
              label="Cerrar navegación"
              icon={<X size={16} />}
              className="absolute top-[18px] right-3 z-10"
              onClick={() => setDrawerOpen(false)}
            />
            <Sidebar
              variant="full"
              className="flex"
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
