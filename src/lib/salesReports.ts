import { calcGatewayFee } from "@/lib/salesReportFormat";
import { getOrderDeliveryFee } from "@/lib/deliveryFees";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/deliveryLimits";
import {
  currentMonthCourierPayoutsMock,
  monthlySalesHistoryMock,
  type MonthlySalesSnapshot,
} from "@/mocks/salesReportsMock";
import type { Order } from "@/mocks/ordersMock";
import { usersMock } from "@/mocks/usersMock";
import { getCourierRating } from "@/lib/courierRatings";

const DELIVERED_STATUS: Order["status"] = "Entregado";

export type ReportDatePreset = "today" | "week" | "month" | "year" | "custom";

export interface ReportDateRange {
  preset: ReportDatePreset;
  customFrom?: string;
  customTo?: string;
}

export interface MonthlySalesReport extends MonthlySalesSnapshot {
  netProfit: number;
  appCommissions: number;
  realNetProfit: number;
  marginPercent: number;
}

export type CourierSettlementStatus = "liquidado" | "pendiente";

export interface CourierPayoutRow {
  courierId: string;
  courierName: string;
  courierAvatar?: string;
  vehicle?: string;
  deliveries: number;
  settledAmount: number;
  pendingAmount: number;
  status: CourierSettlementStatus;
  averageRating: number;
  reviewCount: number;
}

export interface PeriodSummary {
  grossSales: number;
  courierPayout: number;
  appCommissions: number;
  netProfit: number;
  realNetProfit: number;
  deliveredOrders: number;
  marginPercent: number;
  label: string;
}

export interface SalesReportsSummary {
  months: MonthlySalesReport[];
  period: PeriodSummary;
  courierPayouts: CourierPayoutRow[];
  ytdNetProfit: number;
  ytdCourierPayout: number;
  ytdRealNetProfit: number;
  rangeLabel: string;
}

export const REPORT_DATE_PRESETS: { value: ReportDatePreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Mes actual" },
  { value: "year", label: "Año actual" },
  { value: "custom", label: "Rango personalizado" },
];

function currentMonthKey(reference = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function enrichMonth(row: MonthlySalesSnapshot): MonthlySalesReport {
  const appCommissions = calcGatewayFee(row.grossSales);
  const netProfit = row.grossSales - row.courierPayout;
  const realNetProfit = netProfit - appCommissions;
  const marginPercent =
    row.grossSales > 0 ? Math.round((netProfit / row.grossSales) * 100) : 0;
  return { ...row, netProfit, appCommissions, realNetProfit, marginPercent };
}

function liveDeliveredContribution(orders: Order[]): MonthlySalesSnapshot {
  const delivered = orders.filter((o) => o.status === DELIVERED_STATUS);
  return {
    monthKey: currentMonthKey(),
    label: "Hoy",
    grossSales: delivered.reduce((sum, o) => sum + o.total, 0),
    courierPayout: delivered.reduce(
      (sum, o) => sum + (o.deliveryPersonId ? getOrderDeliveryFee(o) : 0),
      0,
    ),
    deliveredOrders: delivered.length,
  };
}

function mergeCurrentMonth(
  base: MonthlySalesSnapshot,
  live: MonthlySalesSnapshot,
): MonthlySalesSnapshot {
  return {
    ...base,
    grossSales: base.grossSales + live.grossSales,
    courierPayout: base.courierPayout + live.courierPayout,
    deliveredOrders: base.deliveredOrders + live.deliveredOrders,
  };
}

function scaleSnapshot(row: MonthlySalesSnapshot, factor: number): MonthlySalesSnapshot {
  return {
    ...row,
    grossSales: Math.round(row.grossSales * factor),
    courierPayout: Math.round(row.courierPayout * factor),
    deliveredOrders: Math.max(factor > 0 ? 1 : 0, Math.round(row.deliveredOrders * factor)),
  };
}

function buildAllMonths(orders: Order[]): MonthlySalesReport[] {
  const live = liveDeliveredContribution(orders);
  const activeKey = currentMonthKey();

  return monthlySalesHistoryMock.map((row) => {
    const merged = row.monthKey === activeKey ? mergeCurrentMonth(row, live) : row;
    return enrichMonth(merged);
  });
}

function getRangeLabel(range: ReportDateRange): string {
  const preset = REPORT_DATE_PRESETS.find((p) => p.value === range.preset);
  if (range.preset !== "custom") return preset?.label ?? "Periodo";
  if (range.customFrom && range.customTo) {
    return `${range.customFrom} — ${range.customTo}`;
  }
  return "Rango personalizado";
}

function filterMonthsByRange(
  allMonths: MonthlySalesReport[],
  range: ReportDateRange,
  orders: Order[],
): MonthlySalesReport[] {
  const activeKey = currentMonthKey();
  const current = allMonths.find((m) => m.monthKey === activeKey) ?? allMonths.at(-1)!;

  switch (range.preset) {
    case "year":
      return allMonths;
    case "month":
      return allMonths.filter((m) => m.monthKey === activeKey);
    case "week":
      return [enrichMonth({ ...scaleSnapshot(current, 7 / 30), label: "Esta semana" })];
    case "today": {
      const live = liveDeliveredContribution(orders);
      if (live.grossSales > 0) {
        return [enrichMonth(live)];
      }
      return [enrichMonth(scaleSnapshot(current, 1 / 30))];
    }
    case "custom": {
      const from = range.customFrom?.slice(0, 7);
      const to = range.customTo?.slice(0, 7);
      return allMonths.filter((m) => {
        if (from && m.monthKey < from) return false;
        if (to && m.monthKey > to) return false;
        return true;
      });
    }
    default:
      return allMonths.filter((m) => m.monthKey === activeKey);
  }
}

function aggregatePeriod(months: MonthlySalesReport[], label: string): PeriodSummary {
  const grossSales = months.reduce((s, m) => s + m.grossSales, 0);
  const courierPayout = months.reduce((s, m) => s + m.courierPayout, 0);
  const appCommissions = months.reduce((s, m) => s + m.appCommissions, 0);
  const netProfit = months.reduce((s, m) => s + m.netProfit, 0);
  const realNetProfit = months.reduce((s, m) => s + m.realNetProfit, 0);
  const deliveredOrders = months.reduce((s, m) => s + m.deliveredOrders, 0);
  const marginPercent = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

  return {
    grossSales,
    courierPayout,
    appCommissions,
    netProfit,
    realNetProfit,
    deliveredOrders,
    marginPercent,
    label,
  };
}

function buildCourierPayoutRows(orders: Order[]): CourierPayoutRow[] {
  const byCourier = new Map<
    string,
    { deliveries: number; settledAmount: number; pendingAmount: number }
  >();

  for (const row of currentMonthCourierPayoutsMock) {
    byCourier.set(row.courierId, {
      deliveries: row.deliveries,
      settledAmount: row.payout,
      pendingAmount: 0,
    });
  }

  for (const order of orders) {
    if (!order.deliveryPersonId) continue;
    const current = byCourier.get(order.deliveryPersonId) ?? {
      deliveries: 0,
      settledAmount: 0,
      pendingAmount: 0,
    };

    if (order.status === DELIVERED_STATUS) {
      byCourier.set(order.deliveryPersonId, {
        deliveries: current.deliveries + 1,
        settledAmount: current.settledAmount + getOrderDeliveryFee(order),
        pendingAmount: current.pendingAmount,
      });
    } else if (ACTIVE_DELIVERY_STATUSES.has(order.status)) {
      byCourier.set(order.deliveryPersonId, {
        deliveries: current.deliveries + 1,
        settledAmount: current.settledAmount,
        pendingAmount: current.pendingAmount + getOrderDeliveryFee(order),
      });
    }
  }

  return [...byCourier.entries()]
    .map(([courierId, stats]) => {
      const courier = usersMock.find((u) => u.id === courierId);
      const rating = getCourierRating(courierId);
      return {
        courierId,
        courierName: courier?.name ?? "Domiciliario",
        courierAvatar: courier?.avatar,
        vehicle: courier?.vehicle,
        deliveries: stats.deliveries,
        settledAmount: stats.settledAmount,
        pendingAmount: stats.pendingAmount,
        status: stats.pendingAmount > 0 ? "pendiente" : "liquidado",
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
      };
    })
    .sort(
      (a, b) =>
        b.settledAmount + b.pendingAmount - (a.settledAmount + a.pendingAmount) ||
        a.courierName.localeCompare(b.courierName, "es"),
    );
}

export function buildSalesReports(
  orders: Order[],
  range: ReportDateRange = { preset: "month" },
): SalesReportsSummary {
  const allMonths = buildAllMonths(orders);
  const months = filterMonthsByRange(allMonths, range, orders);
  const rangeLabel = getRangeLabel(range);
  const period = aggregatePeriod(months, rangeLabel);

  const ytdNetProfit = allMonths.reduce((s, m) => s + m.netProfit, 0);
  const ytdCourierPayout = allMonths.reduce((s, m) => s + m.courierPayout, 0);
  const ytdRealNetProfit = allMonths.reduce((s, m) => s + m.realNetProfit, 0);

  return {
    months,
    period,
    courierPayouts: buildCourierPayoutRows(orders),
    ytdNetProfit,
    ytdCourierPayout,
    ytdRealNetProfit,
    rangeLabel,
  };
}
