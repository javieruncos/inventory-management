import { cn } from "@/lib/cn";

const pulseClass =
  "animate-pulse motion-reduce:animate-none bg-surface-nested";

const rows = Array.from({ length: 4 }, (_, index) => index);

export function UsersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="hidden desktop:block">
        <div className="flex items-center gap-4 bg-surface-nested py-3">
          <span className={cn("h-3 w-40 rounded-sm", pulseClass)} />
          <span className={cn("h-3 w-16 rounded-sm", pulseClass)} />
          <span className={cn("h-3 w-16 rounded-sm", pulseClass)} />
          <span className={cn("h-3 w-24 rounded-sm", pulseClass)} />
          <span className={cn("ml-auto size-8 rounded-control", pulseClass)} />
        </div>
        {rows.map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-divider py-3"
          >
            <span className={cn("h-4 w-56 rounded-sm", pulseClass)} />
            <span className={cn("h-3 w-20 rounded-sm", pulseClass)} />
            <span className={cn("h-6 w-20 rounded-pill", pulseClass)} />
            <span className={cn("h-3 w-24 rounded-sm", pulseClass)} />
            <span
              className={cn("ml-auto size-8 rounded-control", pulseClass)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 desktop:hidden">
        {rows.map((row) => (
          <div
            key={row}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span
                  className={cn("h-4 w-56 max-w-full rounded-sm", pulseClass)}
                />
                <span
                  className={cn("h-3 w-24 max-w-full rounded-sm", pulseClass)}
                />
                <span className="flex items-center gap-2">
                  <span className={cn("h-6 w-20 rounded-pill", pulseClass)} />
                  <span className={cn("h-3 w-24 rounded-sm", pulseClass)} />
                </span>
              </span>
              <span className={cn("size-8 rounded-control", pulseClass)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
