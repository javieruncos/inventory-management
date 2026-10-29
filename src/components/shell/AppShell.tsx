"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Main } from "@/components/shell/Main";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const DRAWER_EXIT_FALLBACK_MS = 400;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerWasOpen = useRef(false);
  const drawerIntent = useRef<"open" | "close">("close");

  const closeDrawer = useCallback(() => {
    drawerIntent.current = "close";
    setDrawerVisible(false);
    setDrawerOpen(false);
    if (prefersReducedMotion()) setDrawerMounted(false);
  }, []);

  /* Escape cierra el drawer y bloquea el scroll del fondo mientras está abierto. */
  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = drawerRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const isInside = active instanceof Node && panel.contains(active);

      if (!isInside) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeDrawer, drawerOpen]);

  /* El foco entra al drawer al abrirlo y vuelve al botón al cerrarlo. */
  useEffect(() => {
    if (drawerOpen) {
      drawerWasOpen.current = true;
      drawerRef.current?.focus();
      return;
    }

    if (!drawerWasOpen.current) return;

    drawerWasOpen.current = false;
    const menuButton = menuRef.current;
    if (menuButton && menuButton.getClientRects().length > 0) {
      menuButton.focus();
    }
  }, [drawerOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeDrawer();
    };

    desktopQuery.addEventListener("change", onBreakpointChange);

    return () => {
      desktopQuery.removeEventListener("change", onBreakpointChange);
    };
  }, [closeDrawer]);

  useEffect(() => {
    let exitTimeout: number | undefined;

    const frame = window.requestAnimationFrame(() => {
      if (drawerIntent.current === "open") {
        setDrawerVisible(true);
        return;
      }

      if (!drawerMounted) return;

      if (prefersReducedMotion()) {
        setDrawerMounted(false);
        return;
      }

      exitTimeout = window.setTimeout(() => {
        if (drawerIntent.current === "close") setDrawerMounted(false);
      }, DRAWER_EXIT_FALLBACK_MS);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (exitTimeout !== undefined) window.clearTimeout(exitTimeout);
    };
  }, [drawerOpen, drawerMounted]);

  const openDrawer = () => {
    drawerIntent.current = "open";
    setDrawerVisible(false);
    setDrawerMounted(true);
    setDrawerOpen(true);
  };

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
              onOpenMenu={openDrawer}
            />
            <Main>{children}</Main>
          </div>
        </div>
      </div>

      {drawerMounted ? (
        <div
          id="app-drawer"
          className={cn(
            "fixed inset-0 z-40 md:hidden",
            !drawerVisible && "pointer-events-none",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación"
          inert={!drawerOpen}
        >
          <button
            type="button"
            aria-label="Cerrar navegación"
            tabIndex={-1}
            className={cn(
              "absolute inset-0 bg-[rgba(15,23,42,0.4)] transition-opacity duration-[250ms] ease-emphasized motion-reduce:transition-none",
              drawerVisible ? "opacity-100" : "opacity-0",
            )}
            onClick={closeDrawer}
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            className={cn(
              "absolute inset-y-0 left-0 w-[250px] max-w-[85vw] overflow-y-auto overscroll-contain shadow-popover focus:outline-none",
              "transition-transform duration-[250ms] ease-emphasized motion-reduce:transition-none",
              drawerVisible ? "translate-x-0" : "-translate-x-full",
            )}
            onTransitionEnd={(event) => {
              if (
                drawerIntent.current !== "close" ||
                drawerOpen ||
                drawerVisible ||
                event.target !== event.currentTarget ||
                (event.propertyName !== "translate" &&
                  event.propertyName !== "transform") ||
                event.currentTarget.getBoundingClientRect().right > 1
              ) {
                return;
              }

              setDrawerMounted(false);
            }}
          >
            <IconButton
              label="Cerrar navegación"
              icon={<X size={16} />}
              className="absolute top-[18px] right-3 z-10"
              onClick={closeDrawer}
            />
            <Sidebar
              variant="full"
              className="flex"
              onNavigate={closeDrawer}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
