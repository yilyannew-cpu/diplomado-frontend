import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCOP } from "@/context/OrderContext";
import { courierOrdersApi } from "@/lib/api/endpoints/courierOrders";
import { mapApiOrders } from "@/lib/api/admin/mappers";
import { getOrderDeliveryFee } from "@/lib/deliveryFees";
import {
  getPeriodRange,
  HISTORY_PERIOD_OPTIONS,
  type HistoryPeriod,
} from "@/lib/orderHistory";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

function orderCompletedAt(order: Order): number {
  return order.statusEnteredAt || order.dispatchedAt || order.receivedAt || 0;
}

export function OrderHistoryView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<HistoryPeriod>("month");

  useEffect(() => {
    let cancelled = false;
    void courierOrdersApi
      .listMine()
      .then((raw) => {
        if (cancelled) return;
        setOrders(mapApiOrders(Array.isArray(raw) ? raw : []));
      })
      .catch((err) => {
        console.error("[OrderHistory] Error loading orders:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const periodMeta = useMemo(() => getPeriodRange(period), [period]);

  const history = useMemo(() => {
    const { from, to } = periodMeta;
    return orders
      .filter((o) => {
        if (user?.id && o.deliveryPersonId !== user.id) return false;
        if (o.status !== "Entregado") return false;
        const at = orderCompletedAt(o);
        return at >= from && at <= to;
      })
      .sort((a, b) => orderCompletedAt(b) - orderCompletedAt(a));
  }, [orders, user?.id, periodMeta]);

  const totalEarned = useMemo(
    () => history.reduce((sum, order) => sum + getOrderDeliveryFee(order), 0),
    [history],
  );

  const periodLabel =
    HISTORY_PERIOD_OPTIONS.find((opt) => opt.value === period)?.label ?? periodMeta.label;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando historial…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold font-display">Historial y Ganancias</h2>
        <p className="text-sm text-muted-foreground mt-1">Tus entregas completadas.</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {HISTORY_PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "min-h-10 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
              period === opt.value
                ? "bg-ink text-cream"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-emerald-600 text-white shadow-lg text-center">
        <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">
          Ganancias estimadas
        </p>
        <p className="text-4xl font-bold font-display mt-2">{formatCOP(totalEarned)}</p>
        <p className="text-emerald-200 text-xs mt-2">
          {history.length} entrega{history.length !== 1 ? "s" : ""} · {periodLabel.toLowerCase()}
        </p>
      </div>

      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay entregas en este periodo.
          </p>
        ) : (
          history.map((o) => {
            const earning = getOrderDeliveryFee(o);
            return (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-cream p-4 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{o.customerName}</p>
                </div>
                <span className="shrink-0 font-mono font-bold text-emerald-600">
                  + {formatCOP(earning)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
