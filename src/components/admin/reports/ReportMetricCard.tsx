import type { ReactNode } from "react";
import { formatReportAmount } from "@/lib/salesReportFormat";

interface ReportMetricCardProps {
  label: string;
  value: number;
  hint: string;
  accent?: "primary" | "ink" | "muted";
  footer?: ReactNode;
  formatAsCount?: boolean;
}

export function ReportMetricCard({
  label,
  value,
  hint,
  accent = "muted",
  footer,
  formatAsCount = false,
}: ReportMetricCardProps) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "ink"
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-pretty sm:text-[11px]">
        {label}
      </p>
      <p className={`mt-2 break-words font-display text-xl font-semibold tabular-nums leading-tight sm:mt-3 sm:text-3xl ${accentClass}`}>
        {formatAsCount ? value.toLocaleString("es-CO") : formatReportAmount(value)}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground text-pretty sm:mt-2 sm:text-[11px]">
        {hint}
      </p>
      {footer ? <div className="mt-2 border-t border-border/60 pt-2">{footer}</div> : null}
    </div>
  );
}
