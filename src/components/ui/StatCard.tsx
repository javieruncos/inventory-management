import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { TrendPill } from "@/components/ui/TrendPill";
import { cn } from "@/lib/cn";

export type StatCardAccent = {
  card?: string;
  tint?: string;
  bar?: string;
  icon?: string;
};

export type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
  compactOnMobile?: boolean;
  accent?: StatCardAccent;
};

export function StatCard({
  icon,
  label,
  value,
  trend,
  compactOnMobile = false,
  accent,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative isolate overflow-hidden",
        "flex flex-col gap-3",
        compactOnMobile &&
          "max-[767px]:flex-row max-[767px]:items-center max-[767px]:gap-3",
        accent?.card,
      )}
    >
      {accent?.tint ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            accent.tint,
          )}
        />
      ) : null}
      {accent?.bar ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-0.5",
            accent.bar,
          )}
        />
      ) : null}
      <div className="relative z-10 flex min-w-0 items-center gap-3 max-[767px]:flex-1">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-control",
            accent?.icon
              ? accent.icon
              : "bg-primary-soft text-primary",
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 text-body-sm text-text-secondary">
          {label}
        </span>
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-2 max-[767px]:shrink-0">
        <span className="text-stat tabular-nums text-text">{value}</span>
        {trend ? (
          <TrendPill direction={trend.direction}>{trend.label}</TrendPill>
        ) : null}
      </div>
    </Card>
  );
}
