import type { HistoryPeriod } from "@/lib/orderHistory";

export function mapHistoryPeriodToApi(
  period: HistoryPeriod,
): "today" | "month" | "year" {
  if (period === "day") return "today";
  return period;
}
