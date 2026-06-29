import { Bike, Package, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { ReportMetricCard } from "@/components/admin/reports/ReportMetricCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { formatCOP, useOrders } from "@/context/OrderContext";
import {
  buildDispatchLedger,
  filterDispatchesByPeriod,
  formatDispatchDate,
  HISTORY_PERIOD_OPTIONS,
  summarizeDispatchPeriod,
  type HistoryPeriod,
} from "@/lib/orderHistory";
import { cn } from "@/lib/utils";
import { usersMock } from "@/mocks/usersMock";

export function HistoryPanel() {
  const { orders, dispatchHistory } = useOrders();
  const [period, setPeriod] = useState<HistoryPeriod>("month");

  const ledger = useMemo(
    () => buildDispatchLedger(orders, dispatchHistory),
    [orders, dispatchHistory],
  );

  const summary = useMemo(
    () => summarizeDispatchPeriod(ledger, period),
    [ledger, period],
  );

  const periodRows = useMemo(
    () => filterDispatchesByPeriod(ledger, period),
    [ledger, period],
  );

  const courierName = (id: string) =>
    usersMock.find((u) => u.id === id)?.name ?? "Domiciliario";

  const courierAvatar = (id: string) =>
    usersMock.find((u) => u.id === id)?.avatar;

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label={`Comandas despachadas — ${summary.periodLabel}`}
          value={summary.dispatchedCount}
          hint="Listo → en ruta con domiciliario"
          accent="ink"
          formatAsCount
        />
        <ReportMetricCard
          label={`Ingresos en ventas — ${summary.periodLabel}`}
          value={summary.grossSales}
          hint="Total facturado al cliente"
          accent="primary"
        />
        <ReportMetricCard
          label={`Gastos en domicilios — ${summary.periodLabel}`}
          value={summary.deliveryExpenses}
          hint="Tarifas pagadas a repartidores"
          accent="muted"
        />
        <ReportMetricCard
          label={`Utilidad neta — ${summary.periodLabel}`}
          value={summary.netRevenue}
          hint="Ventas menos costo de domicilio"
          accent="primary"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/30 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Detalle de despachos</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {periodRows.length} registro{periodRows.length !== 1 ? "s" : ""}
          </p>
        </div>

        {periodRows.length === 0 ? (
          <div className="p-10 text-center">
            <Bike className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              Sin despachos en el periodo seleccionado
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {periodRows.map((row) => (
              <li
                key={`${row.orderId}-${row.dispatchedAt}`}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-semibold text-primary">{row.orderId}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDispatchDate(row.dispatchedAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium">{row.customerName}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserAvatar
                      name={courierName(row.deliveryPersonId)}
                      src={courierAvatar(row.deliveryPersonId)}
                      className="size-7"
                    />
                    <p className="text-xs text-muted-foreground">
                      {courierName(row.deliveryPersonId)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-end gap-4 sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="size-3" />
                      Venta
                    </p>
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatCOP(row.total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <Wallet className="size-3" />
                      Domicilio
                    </p>
                    <p className="font-mono text-sm font-semibold tabular-nums text-amber-brand">
                      -{formatCOP(row.deliveryFee)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
