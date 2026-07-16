/**
 * Tipos e interfaces para los reportes de ventas del panel Admin.
 *
 * Antes este archivo también contenía funciones de cálculo que procesaban
 * datos mock localmente. Ahora el backend hace esos cálculos y los envía
 * ya listos vía API (/reports/sales, /reports/courier-payouts).
 * Solo quedan las definiciones de tipo que los componentes de React necesitan.
 */

// ── Tipos de Período / Rango de Fechas ──────────────────────────────

export type ReportDatePreset = "today" | "week" | "month" | "year" | "custom";

export interface ReportDateRange {
  preset: ReportDatePreset;
  customFrom?: string;
  customTo?: string;
}

export const REPORT_DATE_PRESETS: { value: ReportDatePreset; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Mes actual" },
  { value: "year", label: "Año actual" },
  { value: "custom", label: "Rango personalizado" },
];

// ── Tipos de Reporte Mensual ────────────────────────────────────────

/** Clave de mes ISO: YYYY-MM */
export interface MonthlySalesSnapshot {
  monthKey: string;
  label: string;
  grossSales: number;
  courierPayout: number;
  deliveredOrders: number;
}

export interface MonthlySalesReport extends MonthlySalesSnapshot {
  netProfit: number;
  appCommissions: number;
  realNetProfit: number;
  marginPercent: number;
}

// ── Tipos de Resumen de Período ─────────────────────────────────────

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

// ── Tipos de Pago a Domiciliarios ───────────────────────────────────

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

// ── Tipo Resumen General ────────────────────────────────────────────

export interface SalesReportsSummary {
  months: MonthlySalesReport[];
  period: PeriodSummary;
  courierPayouts: CourierPayoutRow[];
  ytdNetProfit: number;
  ytdCourierPayout: number;
  ytdRealNetProfit: number;
  rangeLabel: string;
}
