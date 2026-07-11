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
    // dateRange es un objeto controlado; serializamos para no refetch por identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dateRange)]);

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
      <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground sm:p-12">
        Cargando reportes de ventas…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <ReportMetricCard
          label={`Ganancia neta — ${periodLabel}`}
          value={period.net_profit}
          hint={`${period.delivered_orders} entregas · margen ${period.margin_percent}%`}
          accent="primary"
          footer={
            <p className="text-[10px] leading-relaxed text-muted-foreground text-pretty">
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
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
            Acumulado año
          </p>
          <div className="mt-2 flex items-end justify-between gap-3 sm:mt-3">
            <p className="font-display text-xl font-semibold tabular-nums text-primary sm:text-3xl">
              {formatReportAmount(ytdRealNetProfit)}
            </p>
            <TrendingUp className="size-4 text-emerald-600 sm:size-5" />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground text-pretty sm:text-[11px]">
            Domiciliarios: {formatReportAmount(ytdCourierPayout)}
            <span className="mx-1 hidden sm:inline">·</span>
            <span className="mt-0.5 block sm:mt-0 sm:inline">
              Neto operativo: {formatReportAmount(ytdNetProfit)}
            </span>
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 sm:mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
            Evolución mensual
          </p>
          <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">
            Ganancias vs. pago a domiciliarios
          </h2>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full sm:h-[320px]">
          <BarChart data={chartData} margin={{ left: 0, right: 4, top: 8, bottom: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(Number(v) / 1_000_000)}M`}
              fontSize={10}
              width={36}
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

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <FinancialDetailTable months={months} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <CourierPayoutList couriers={courierPayouts} periodLabel={rangeLabel} />
        </section>
      </div>

      <section className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-3.5 sm:p-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Wallet className="size-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-pretty sm:text-sm">
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
