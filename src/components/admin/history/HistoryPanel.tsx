import { Bike, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ReportMetricCard } from "@/components/admin/reports/ReportMetricCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import {
  formatDispatchDate,
  HISTORY_PERIOD_OPTIONS,
  type HistoryPeriod,
} from "@/lib/orderHistory";
import { cn } from "@/lib/utils";

export function HistoryPanel() {
  const { dispatchRecords, dispatchSummary, refreshDispatchHistory } = useAdmin();
  const [period, setPeriod] = useState<HistoryPeriod>("month");

  useEffect(() => {
    void refreshDispatchHistory(period);
  }, [period, refreshDispatchHistory]);

  const summary = useMemo(() => {
    if (!dispatchSummary) {
      return { dispatchedCount: 0, totalSales: 0, totalDeliveryPay: 0 };
    }
    const dispatchedCount =
      period === "day"
        ? dispatchSummary.today
        : period === "year"
          ? dispatchSummary.year
          : dispatchSummary.month;

    const totalSales = dispatchRecords.reduce((sum, row) => sum + row.total, 0);
    const totalDeliveryPay = dispatchRecords.reduce((sum, row) => sum + row.delivery_fee, 0);

    return { dispatchedCount, totalSales, totalDeliveryPay };
  }, [dispatchRecords, dispatchSummary, period]);

  const periodRows = dispatchRecords;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {HISTORY_PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
              period === opt.value
                ? "bg-ink text-cream"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ReportMetricCard
          label="Despachos"
          value={summary.dispatchedCount}
          hint={`Pedidos enviados a ruta — ${HISTORY_PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase()}`}
          accent="primary"
          formatAsCount
        />
        <ReportMetricCard
          label="Facturación despachada"
          value={summary.totalSales}
          hint="Total de pedidos despachados en el periodo"
          accent="ink"
        />
        <ReportMetricCard
          label="Pago domicilios"
          value={summary.totalDeliveryPay}
          hint="Suma de tarifas de domicilio"
          accent="muted"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid md:grid-cols-12">
          <span className="col-span-2">Pedido</span>
          <span className="col-span-3">Cliente</span>
          <span className="col-span-2">Domiciliario</span>
          <span className="col-span-2 text-right">Total</span>
          <span className="col-span-1 text-right">Domicilio</span>
          <span className="col-span-2 text-right">Despachado</span>
        </div>

        {periodRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Bike className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Sin despachos en este periodo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los pedidos despachados desde cocina aparecerán aquí.
            </p>
          </div>
        ) : (
          periodRows.map((row) => (
            <div
              key={`${row.order_id}-${row.dispatched_at}`}
              className="border-b border-border px-5 py-4 last:border-b-0 md:grid md:grid-cols-12 md:items-center md:py-3"
            >
              <span className="font-mono text-sm font-semibold md:col-span-2">{row.order_id}</span>
              <span className="mt-1 block text-sm md:col-span-3 md:mt-0">{row.customer_name}</span>
              <div className="mt-2 flex items-center gap-2 md:col-span-2 md:mt-0">
                <UserAvatar name={row.courier_name} className="size-8" />
                <span className="truncate text-sm">{row.courier_name}</span>
              </div>
              <span className="mt-2 block font-mono text-sm font-semibold tabular-nums md:col-span-2 md:mt-0 md:text-right">
                {formatCOP(row.total)}
              </span>
              <span className="mt-1 block font-mono text-xs tabular-nums text-muted-foreground md:col-span-1 md:mt-0 md:text-right">
                {formatCOP(row.delivery_fee)}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground md:col-span-2 md:mt-0 md:text-right">
                {formatDispatchDate(new Date(row.dispatched_at).getTime())}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
