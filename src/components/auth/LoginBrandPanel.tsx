import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  Boxes,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";

type CapabilityProps = {
  icon: ReactNode;
  label: string;
  description: string;
};

function Capability({ icon, label, description }: CapabilityProps) {
  return (
    <div className="rounded border border-[var(--login-border)] bg-[var(--login-surface-raised)] p-[clamp(0.5rem,1.2dvh,0.75rem)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--login-text-muted)]">
          {label}
        </span>
        <span className="text-[var(--login-primary)]" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-[clamp(0.25rem,1dvh,0.5rem)] text-body-sm text-[var(--login-text)]">
        {description}
      </p>
    </div>
  );
}

export function LoginBrandPanel() {
  return (
    <aside
      aria-label="Información del sistema"
      className="flex flex-col border-b border-[var(--login-border)] bg-primary-soft px-5 py-[clamp(1rem,3dvh,2.5rem)] [@media(max-height:600px)]:py-3 md:h-full md:border-b-0 md:border-r md:px-10"
    >
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="inline-flex items-center gap-2 rounded border border-[var(--login-border)] bg-[var(--login-surface)] px-3 py-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-[var(--login-primary)]"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--login-text-muted)]">
            Inventory Management
          </span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--login-text-subtle)]">
          Plataforma de inventario
        </p>
      </div>

      <div className="w-full max-w-[640px] py-[clamp(1rem,4dvh,4rem)] [@media(max-height:600px)]:py-3 md:my-auto">
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded border border-[var(--login-border-strong)] bg-[var(--login-surface)] text-[var(--login-primary)] md:size-12">
            <Boxes size={24} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--login-primary)]">
              Gestión de inventario
            </p>
            <p className="mt-1 text-[18px] font-semibold leading-[26px] tracking-[-0.015em] text-[var(--login-text)]">
              Sistema de inventario
            </p>
          </div>
        </div>

        <h1 className="mt-[clamp(1.25rem,3dvh,2rem)] text-balance text-[30px] font-bold leading-[36px] tracking-[-0.03em] text-[var(--login-text-strong)] [@media(max-height:600px)]:mt-3 md:text-[32px] md:leading-[38px] lg:text-[40px] lg:leading-[48px]">
          Inventory Management
        </h1>
        <p className="mt-[clamp(0.75rem,1.5dvh,1rem)] max-w-[560px] text-body text-[var(--login-text-muted)] [@media(max-height:600px)]:mt-2 md:text-body-lg">
          Solución completa para llevar el control de productos, movimientos y
          proveedores.
        </p>

        <div className="mt-[clamp(1rem,3dvh,2.5rem)] hidden rounded-lg border border-[var(--login-border)] bg-[var(--login-surface)] p-[clamp(0.75rem,1.8dvh,1rem)] shadow-card md:block">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--login-border)] pb-[clamp(0.5rem,1.2dvh,0.75rem)]">
            <div className="flex items-center gap-2">
              <Boxes
                size={16}
                aria-hidden="true"
                className="text-[var(--login-primary)]"
              />
              <span className="text-body-sm font-semibold text-[var(--login-text)]">
                Operaciones centralizadas
              </span>
            </div>
            <span className="text-caption text-[var(--login-text-muted)]">
              Productos, stock y movimientos
            </span>
          </div>

          <div className="mt-[clamp(0.5rem,1.2dvh,0.75rem)] flex items-center justify-between gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--login-text-subtle)]">
              Cobertura del sistema
            </span>
            <span className="text-caption text-[var(--login-text-muted)]">
              Módulos disponibles
            </span>
          </div>

          <div className="mt-[clamp(0.5rem,1.2dvh,0.75rem)] grid grid-cols-2 gap-2">
            <Capability
              icon={<Package size={14} />}
              label="Productos"
              description="Catálogo y control"
            />
            <Capability
              icon={<Users size={14} />}
              label="Proveedores"
              description="Directorio y contacto"
            />
            <Capability
              icon={<Boxes size={14} />}
              label="Stock"
              description="Estado y alertas"
            />
            <Capability
              icon={<ArrowLeftRight size={14} />}
              label="Movimientos"
              description="Entradas y salidas"
            />
          </div>
        </div>
      </div>

      <div className="hidden items-center justify-between gap-4 border-t border-[var(--login-border)] pt-[clamp(0.75rem,2dvh,1.25rem)] md:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={16}
            aria-hidden="true"
            className="text-[var(--login-primary)]"
          />
          <span className="text-body-sm text-[var(--login-text-muted)]">
            Acceso restringido a personal autorizado
          </span>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--login-text-subtle)]">
          Inventory Management
        </span>
      </div>
    </aside>
  );
}
