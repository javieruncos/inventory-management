import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { TrendPill } from "@/components/ui/TrendPill";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down";
    label: string;
  };
};

export function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-control bg-primary-soft text-primary"
        >
          {icon}
        </span>
        <span className="min-w-0 text-body-sm text-text-secondary">
          {label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-stat tabular-nums text-text">{value}</span>
        {trend ? (
          <TrendPill direction={trend.direction}>{trend.label}</TrendPill>
        ) : null}
      </div>
    </Card>
  );
}
