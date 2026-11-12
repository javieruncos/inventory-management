import { cn } from "@/lib/cn";

type ProductsSkeletonProps = {
  className?: string;
  canManage?: boolean;
};

const pulseClass = "animate-pulse motion-reduce:animate-none bg-surface-nested";

const TABLE_ROWS = 5;
const CARD_ROWS = 4;
const FILTER_WIDTHS = ["w-16", "w-20", "w-24", "w-20"];

export function ProductsSkeleton({
  className,
  canManage = false,
}: ProductsSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} aria-hidden="true">
      <div className="flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between">
        <div className="flex w-full flex-col gap-1.5 desktop:w-72">
          <span className={cn("h-4 w-14 rounded-sm", pulseClass)} />
          <span className={cn("h-10 w-full rounded-control", pulseClass)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_WIDTHS.map((width, index) => (
            <span
              key={index}
              className={cn("h-10 rounded-pill", width, pulseClass)}
            />
          ))}
        </div>
      </div>

      <div className="hidden desktop:block">
        <div className="flex items-center gap-4 bg-surface-nested py-3">
          <span className={cn("h-3 w-20 rounded-sm", pulseClass)} />
          <span className="ml-auto flex items-center gap-6">
            {["w-14", "w-12", "w-12", "w-16", ...(canManage ? ["w-16"] : [])].map(
              (width, index) => (
                <span
                  key={index}
                  className={cn("h-3 rounded-sm", width, pulseClass)}
                />
              ),
            )}
          </span>
        </div>
        <div>
          {Array.from({ length: TABLE_ROWS }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-divider py-3"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  className={cn("h-4 w-52 max-w-full rounded-sm", pulseClass)}
                />
                <span className={cn("h-3 w-24 rounded-sm", pulseClass)} />
              </span>
              <span className={cn("h-4 w-14 rounded-sm", pulseClass)} />
              <span className={cn("h-4 w-12 rounded-sm", pulseClass)} />
              <span className={cn("h-4 w-12 rounded-sm", pulseClass)} />
              <span className={cn("h-6 w-20 rounded-pill", pulseClass)} />
              {canManage ? (
                <span className="flex items-center gap-2">
                  <span className={cn("size-8 rounded-control", pulseClass)} />
                  <span className={cn("size-8 rounded-control", pulseClass)} />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-4 desktop:hidden">
        {Array.from({ length: CARD_ROWS }, (_, index) => (
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
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={cn("h-6 w-24 rounded-pill", pulseClass)}
                />
                {canManage ? (
                  <>
                    <span
                      className={cn("size-8 rounded-control", pulseClass)}
                    />
                    <span
                      className={cn("size-8 rounded-control", pulseClass)}
                    />
                  </>
                ) : null}
              </span>
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
