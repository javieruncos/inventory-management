import { cn } from "@/lib/cn";

type ProductsSkeletonProps = {
  className?: string;
};

const pulseClass = "animate-pulse motion-reduce:animate-none bg-surface-nested";

export function ProductsSkeleton({ className }: ProductsSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-hidden="true">
      <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between">
        <div className="flex w-full flex-col gap-1.5 desktop:w-72">
          <span className={cn("h-4 w-14 rounded-sm", pulseClass)} />
          <span className={cn("h-10 w-full rounded-control", pulseClass)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={cn("h-8 w-20 rounded-pill", pulseClass)}
            />
          ))}
        </div>
      </div>
      <ul className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li
            key={index}
            className="rounded-card border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span
                  className={cn("h-4 w-48 max-w-full rounded-sm", pulseClass)}
                />
                <span
                  className={cn("h-3 w-28 max-w-full rounded-sm", pulseClass)}
                />
              </span>
              <span
                className={cn("h-6 w-24 shrink-0 rounded-pill", pulseClass)}
              />
            </div>
            <span
              className={cn("mt-3 block h-12 w-full rounded-nested", pulseClass)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
