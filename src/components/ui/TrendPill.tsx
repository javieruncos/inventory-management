import { cn } from "@/lib/cn";

type TrendPillProps = {
  direction: "up" | "down";
  children: string;
};

const directionClasses = {
  up: "bg-status-in-bg text-status-in-text",
  down: "bg-status-out-bg text-status-out-text",
} as const;

export function TrendPill({ direction, children }: TrendPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-pill px-2.5 text-label-sm whitespace-nowrap",
        directionClasses[direction],
      )}
    >
      {children}
    </span>
  );
}
