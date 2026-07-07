import { getOrderDeliveryFee } from "@/lib/deliveryFees";
import type { DispatchRecord } from "@/mocks/dispatchHistoryMock";
import type { Order } from "@/mocks/ordersMock";

export type HistoryPeriod = "day" | "month" | "year";

export const HISTORY_PERIOD_OPTIONS: { value: HistoryPeriod; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "month", label: "Mes actual" },
  { value: "year", label: "Año actual" },
];

const DISPATCHED_STATUSES: Order["status"][] = ["En Camino", "Entregado"];

export function orderToDispatchRecord(order: Order, dispatchedAt: number): DispatchRecord {
  return {
    orderId: order.id,
    customerName: order.customerName,
    total: order.total,
    deliveryFee: getOrderDeliveryFee(order),
    deliveryPersonId: order.deliveryPersonId ?? "sin-asignar",
    dispatchedAt,
  };
}

/** Une despachos en vivo (órdenes) con el histórico persistido. */
export function buildDispatchLedger(
  orders: Order[],
  history: DispatchRecord[],
): DispatchRecord[] {
  const fromOrders = orders
    .filter(
      (o) =>
        o.dispatchedAt &&
        o.deliveryPersonId &&
        DISPATCHED_STATUSES.includes(o.status),
    )
    .map((o) => orderToDispatchRecord(o, o.dispatchedAt!));

  const liveIds = new Set(fromOrders.map((r) => r.orderId));
  const archived = history.filter((r) => !liveIds.has(r.orderId));

  return [...fromOrders, ...archived].sort((a, b) => b.dispatchedAt - a.dispatchedAt);
}

function startOfDay(ref: Date): number {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(ref: Date): number {
  const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfYear(ref: Date): number {
  const d = new Date(ref.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getPeriodRange(period: HistoryPeriod, reference = new Date()): {
  from: number;
  to: number;
  label: string;
} {
  const to = reference.getTime();
  switch (period) {
    case "day":
      return { from: startOfDay(reference), to, label: "hoy" };
    case "month":
      return {
        from: startOfMonth(reference),
        to,
        label: reference.toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
      };
    case "year":
      return {
        from: startOfYear(reference),
        to,
        label: String(reference.getFullYear()),
      };
  }
}

export function filterDispatchesByPeriod(
  records: DispatchRecord[],
  period: HistoryPeriod,
  reference = new Date(),
): DispatchRecord[] {
  const { from, to } = getPeriodRange(period, reference);
  return records.filter((r) => r.dispatchedAt >= from && r.dispatchedAt <= to);
}

export interface DispatchPeriodSummary {
  dispatchedCount: number;
  grossSales: number;
  deliveryExpenses: number;
  netRevenue: number;
  periodLabel: string;
}

export function summarizeDispatchPeriod(
  records: DispatchRecord[],
  period: HistoryPeriod,
  reference = new Date(),
): DispatchPeriodSummary {
  const filtered = filterDispatchesByPeriod(records, period, reference);
  const grossSales = filtered.reduce((sum, r) => sum + r.total, 0);
  const deliveryExpenses = filtered.reduce((sum, r) => sum + r.deliveryFee, 0);

  return {
    dispatchedCount: filtered.length,
    grossSales,
    deliveryExpenses,
    netRevenue: grossSales - deliveryExpenses,
    periodLabel: getPeriodRange(period, reference).label,
  };
}

export function formatDispatchDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
