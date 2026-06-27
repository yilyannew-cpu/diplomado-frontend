import type { ReactNode } from "react";
import { formatReportAmount } from "@/lib/salesReportFormat";

interface ReportMetricCardProps {
  label: string;
  value: number;
  hint: string;
  accent?: "primary" | "ink" | "muted";
  footer?: ReactNode;
}

export function ReportMetricCard({
  label,
  value,
  hint,
  accent = "muted",
  footer,
}: ReportMetricCardProps) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "ink"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-3 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${accentClass}`}>
        {formatReportAmount(value)}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
      {footer ? <div className="mt-2 border-t border-border/60 pt-2">{footer}</div> : null}
    </div>
  );
}
