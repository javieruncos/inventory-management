import { cn } from "@/lib/cn";

type DashboardSkeletonVariant = "kpis" | "movements" | "lowStock";

type DashboardSkeletonProps = {
  variant: DashboardSkeletonVariant;
  className?: string;
};

const pulseClass = "animate-pulse motion-reduce:animate-none bg-surface-nested";

export function DashboardSkeleton({
  variant,
  className,
}: DashboardSkeletonProps) {
  if (variant === "kpis") {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-hidden="true">
        <div className="flex items-center gap-3">
          <span className={cn("size-9 shrink-0 rounded-control", pulseClass)} />
          <span className={cn("h-4 w-28 rounded-sm", pulseClass)} />
        </div>
        <span className={cn("h-8 w-20 rounded-sm", pulseClass)} />
      </div>
    );
  }

  if (variant === "movements") {
    return (
      <ul className={cn("flex flex-col", className)} aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 py-3">
            <span className={cn("size-9 shrink-0 rounded-control", pulseClass)} />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className={cn("h-4 w-40 max-w-full rounded-sm", pulseClass)} />
              <span className={cn("h-3 w-56 max-w-full rounded-sm", pulseClass)} />
            </span>
            <span className={cn("h-6 w-16 shrink-0 rounded-pill", pulseClass)} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("flex flex-col", className)} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex items-center justify-between gap-3 py-3">
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={cn("h-4 w-44 max-w-full rounded-sm", pulseClass)} />
            <span className={cn("h-3 w-32 max-w-full rounded-sm", pulseClass)} />
          </span>
          <span className="flex shrink-0 flex-col items-end gap-2">
            <span className={cn("h-6 w-20 rounded-pill", pulseClass)} />
            <span className={cn("h-3 w-14 rounded-sm", pulseClass)} />
          </span>
        </li>
      ))}
    </ul>
  );
}
