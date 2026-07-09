import { TrendingUp, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import { formatReportAmount } from "@/lib/salesReportFormat";
import type { MonthlySalesReport, ReportDateRange } from "@/lib/salesReports";
import type { CourierPayoutRow } from "@/lib/salesReports";
import type { ApiSalesReport } from "@/lib/api/types/admin";

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
  const { fetchSalesReport } = useAdmin();
  const [internalRange, setInternalRange] = useState<ReportDateRange>({ preset: "month" });
  const dateRange = controlledRange ?? internalRange;
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ApiSalesReport | null>(null);
  const [months, setMonths] = useState<MonthlySalesReport[]>([]);
  const [courierPayouts, setCourierPayouts] = useState<CourierPayoutRow[]>([]);
  const [rangeLabel, setRangeLabel] = useState("Este mes");
  const [ytdRealNetProfit, setYtdRealNetProfit] = useState(0);
  const [ytdCourierPayout, setYtdCourierPayout] = useState(0);
  const [ytdNetProfit, setYtdNetProfit] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSalesReport(dateRange)
      .then((report) => {
        if (cancelled) return;
        setPeriod(report.period);
        setMonths(report.months);
        setCourierPayouts(report.courierPayouts);
        setRangeLabel(report.rangeLabel);
        setYtdRealNetProfit(report.ytdRealNetProfit);
        setYtdCourierPayout(report.ytdCourierPayout);
        setYtdNetProfit(report.ytdNetProfit);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange, fetchSalesReport]);

  const chartData = useMemo(
    () =>
      months.map((month) => ({
        label: month.label.replace(/\s\d{4}$/, ""),
        netProfit: month.netProfit,
        courierPayout: month.courierPayout,
      })),
    [months],
  );

  const periodLabel = rangeLabel.toLowerCase();

  if (loading || !period) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Cargando reportes de ventas…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label={`Ganancia neta — ${periodLabel}`}
          value={period.net_profit}
          hint={`${period.delivered_orders} entregas · margen ${period.margin_percent}%`}
          accent="primary"
          footer={
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Comisiones app (5%):{" "}
              <span className="font-mono text-amber-brand">
                -{formatReportAmount(period.app_commissions)}
              </span>
              {" · "}
              Neto real:{" "}
              <span className="font-semibold text-foreground">
                {formatReportAmount(period.real_net_profit)}
              </span>
            </p>
          }
        />
        <ReportMetricCard
          label={`Pago domiciliarios — ${periodLabel}`}
          value={period.courier_payout}
          hint="Tarifas de domicilio del periodo"
          accent="ink"
        />
        <ReportMetricCard
          label={`Facturación bruta — ${periodLabel}`}
          value={period.gross_sales}
          hint="Ventas totales incl. domicilio"
          accent="muted"
        />
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Acumulado año
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-display text-2xl font-semibold tabular-nums text-primary sm:text-3xl">
              {formatReportAmount(ytdRealNetProfit)}
            </p>
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Domiciliarios: {formatReportAmount(ytdCourierPayout)} · Neto operativo:{" "}
            {formatReportAmount(ytdNetProfit)}
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
          <FinancialDetailTable months={months} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <CourierPayoutList couriers={courierPayouts} periodLabel={rangeLabel} />
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Wallet className="size-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">Ganancia neta</span> = facturación bruta
            menos domiciliarios. El{" "}
            <span className="font-medium text-foreground">neto real</span> descuenta además la
            comisión de la app (5%).
          </p>
        </div>
      </section>
    </div>
  );
}
