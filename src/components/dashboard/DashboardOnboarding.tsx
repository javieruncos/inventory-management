import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

const STEPS = [
  {
    title: "Prepará las categorías",
    description:
      "Usá una categoría existente o creá una nueva para agrupar tus productos.",
    href: "/categories",
    action: "Ir a Categorías",
  },
  {
    title: "Cargá tus productos",
    description: "Registrá nombre, SKU, precio y stock mínimo.",
    href: "/products",
    action: "Ir a Productos",
  },
  {
    title: "Iniciá el stock",
    description:
      "Registrá una entrada para dejar el inventario listo para operar.",
    href: "/stock",
    action: "Ir a Movimientos",
  },
] as const;

export function DashboardOnboarding() {
  return (
    <Card>
      <CardHeader
        title="Todavía no hay productos registrados"
        description="Para empezar a operar, seguí este orden recomendado. El dashboard se completará a medida que cargues datos."
      />
      <ol className="grid gap-4 desktop:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.href}
            className="flex flex-col items-start gap-3 rounded-nested bg-surface-nested p-4"
          >
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center rounded-control bg-primary-soft text-label text-primary"
            >
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="text-heading-sm text-text">{step.title}</h3>
              <p className="text-body-sm text-text-secondary">
                {step.description}
              </p>
            </div>
            <Link
              href={step.href}
              className="mt-auto inline-flex h-10 items-center gap-1.5 text-label text-primary hover:underline"
            >
              {step.action}
              <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
