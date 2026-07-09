import type { ReportDateRange } from "@/lib/salesReports";

export function reportRangeToQuery(range: ReportDateRange): {
  preset: string;
  from?: string;
  to?: string;
} {
  if (range.preset === "custom") {
    return {
      preset: "custom",
      from: range.customFrom,
      to: range.customTo,
    };
  }
  return { preset: range.preset };
}

export function reportRangeToDates(range: ReportDateRange): { from: string; to: string } {
  const today = new Date();
  const toKey = (d: Date) => d.toISOString().slice(0, 10);

  if (range.preset === "custom" && range.customFrom && range.customTo) {
    return { from: range.customFrom, to: range.customTo };
  }

  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  switch (range.preset) {
    case "today":
      return { from: toKey(start), to: toKey(today) };
    case "week": {
      start.setDate(start.getDate() - 6);
      return { from: toKey(start), to: toKey(today) };
    }
    case "year": {
      start.setMonth(0, 1);
      return { from: toKey(start), to: toKey(today) };
    }
    case "month":
    default: {
      start.setDate(1);
      return { from: toKey(start), to: toKey(today) };
    }
  }
}

export function historyPeriodToQuery(period: "today" | "month" | "year"): {
  period: string;
} {
  return { period };
}

const PRESET_LABELS: Record<string, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  year: "Este año",
  custom: "Periodo personalizado",
};

export function reportRangeLabel(range: ReportDateRange): string {
  if (range.preset === "custom" && range.customFrom && range.customTo) {
    return `${range.customFrom} — ${range.customTo}`;
  }
  return PRESET_LABELS[range.preset] ?? range.preset;
}
