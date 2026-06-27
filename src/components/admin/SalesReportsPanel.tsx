import { TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CourierPayoutList } from "@/components/admin/reports/CourierPayoutList";
import { FinancialDetailTable } from "@/components/admin/reports/FinancialDetailTable";
import { ReportMetricCard } from "@/components/admin/reports/ReportMetricCard";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCOP, useOrders } from "@/context/OrderContext";
import {
  formatReportAmount,
  PAYMENT_GATEWAY_FEE_RATE,
} from "@/lib/salesReportFormat";
import { buildSalesReports, type ReportDateRange } from "@/lib/salesReports";

const chartConfig = {
  netProfit: { label: "Ganancia neta", color: "var(--color-chart-2)" },
  courierPayout: { label: "Pago domiciliarios", color: "var(--color-chart-4)" },
};

export function SalesReportsPanel({
  dateRange: controlledRange,
  onDateRangeChange,
}: {
  dateRange?: ReportDateRange;
  onDateRangeChange?: (range: ReportDateRange) => void;
} = {}) {
  const { orders } = useOrders();
  const [internalRange, setInternalRange] = useState<ReportDateRange>({ preset: "month" });
  const dateRange = controlledRange ?? internalRange;
  const setDateRange = onDateRangeChange ?? setInternalRange;

  const report = useMemo(
    () => buildSalesReports(orders, dateRange),
    [orders, dateRange],
  );

  const chartData = report.months.map((month) => ({
    label: month.label.replace(" 2025", ""),
    netProfit: month.netProfit,
    courierPayout: month.courierPayout,
  }));

  const periodLabel = report.rangeLabel.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label={`Ganancia neta — ${periodLabel}`}
          value={report.period.netProfit}
          hint={`${report.period.deliveredOrders} entregas · margen ${report.period.marginPercent}%`}
          accent="primary"
          footer={
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Pasarela ({(PAYMENT_GATEWAY_FEE_RATE * 100).toFixed(1)}%):{" "}
              <span className="font-mono text-amber-brand">
                -{formatReportAmount(report.period.appCommissions)}
              </span>
              {" · "}
              Neto real:{" "}
              <span className="font-semibold text-foreground">
                {formatReportAmount(report.period.realNetProfit)}
              </span>
            </p>
          }
        />
        <ReportMetricCard
          label={`Pago domiciliarios — ${periodLabel}`}
          value={report.period.courierPayout}
          hint="Tarifas de domicilio del periodo"
          accent="ink"
        />
        <ReportMetricCard
          label={`Facturación bruta — ${periodLabel}`}
          value={report.period.grossSales}
          hint="Ventas totales incl. domicilio"
          accent="muted"
        />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Acumulado año
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-display text-2xl font-semibold tabular-nums text-primary sm:text-3xl">
              {formatReportAmount(report.ytdRealNetProfit)}
            </p>
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Domiciliarios: {formatReportAmount(report.ytdCourierPayout)} · Neto operativo:{" "}
            {formatReportAmount(report.ytdNetProfit)}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Evolución mensual
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">
            Ganancias vs. pago a domiciliarios
          </h2>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
          <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`}
              fontSize={11}
              width={44}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => formatCOP(Number(value))} />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="netProfit" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="courierPayout" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <FinancialDetailTable months={report.months} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <CourierPayoutList
            couriers={report.courierPayouts}
            periodLabel={report.rangeLabel}
          />
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Wallet className="size-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Ganancia neta</span> = facturación bruta
            menos domiciliarios. El{" "}
            <span className="font-medium text-foreground">neto real</span> descuenta además la
            comisión de la pasarela de pagos ({(PAYMENT_GATEWAY_FEE_RATE * 100).toFixed(1)}%).
          </p>
        </div>
      </section>
    </div>
  );
}
