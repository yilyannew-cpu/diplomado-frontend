import { Bike } from "lucide-react";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

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
    <div className="space-y-4 sm:space-y-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {HISTORY_PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "min-h-10 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:px-4",
              period === opt.value
                ? "bg-ink text-cream"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
          <div className="px-4 py-12 text-center sm:px-5">
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
              className="border-b border-border px-3 py-3.5 last:border-b-0 sm:px-5 sm:py-4 md:grid md:grid-cols-12 md:items-center md:py-3"
            >
              {/* Móvil: card con labels */}
              <div className="space-y-2.5 md:hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pedido
                    </p>
                    <p className="font-mono text-sm font-semibold">{row.order_id}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatCOP(row.total)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-sm">{row.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <UserAvatar name={row.courier_name} className="size-8" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Domiciliario
                    </p>
                    <p className="truncate text-sm">{row.courier_name}</p>
                  </div>
                </div>
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>Domicilio {formatCOP(row.delivery_fee)}</span>
                  <span>{formatDispatchDate(new Date(row.dispatched_at).getTime())}</span>
                </div>
              </div>

              {/* Desktop */}
              <span className="hidden font-mono text-sm font-semibold md:col-span-2 md:block">
                {row.order_id}
              </span>
              <span className="hidden text-sm md:col-span-3 md:block">{row.customer_name}</span>
              <div className="hidden items-center gap-2 md:col-span-2 md:flex">
                <UserAvatar name={row.courier_name} className="size-8" />
                <span className="truncate text-sm">{row.courier_name}</span>
              </div>
              <span className="hidden font-mono text-sm font-semibold tabular-nums md:col-span-2 md:block md:text-right">
                {formatCOP(row.total)}
              </span>
              <span className="hidden font-mono text-xs tabular-nums text-muted-foreground md:col-span-1 md:block md:text-right">
                {formatCOP(row.delivery_fee)}
              </span>
              <span className="hidden text-xs text-muted-foreground md:col-span-2 md:block md:text-right">
                {formatDispatchDate(new Date(row.dispatched_at).getTime())}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
