import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { courierOrdersApi } from "@/lib/api/endpoints/courierOrders";
import { mapApiOrders } from "@/lib/api/admin/mappers";
import { formatCOP } from "@/context/OrderContext";
import type { Order } from "@/mocks/ordersMock";
import { Loader2 } from "lucide-react";

const EARNING_PER_DELIVERY_COP = 5000;

export function OrderHistoryView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  const history = useMemo(
    () =>
      orders.filter(
        (o) =>
          (!user?.id || o.deliveryPersonId === user.id) && o.status === "Entregado",
      ),
    [orders, user?.id],
  );
  const totalEarned = history.length * EARNING_PER_DELIVERY_COP;

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
      <div className="p-6 rounded-2xl bg-emerald-600 text-white shadow-lg text-center">
        <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">
          Ganancias estimadas
        </p>
        <p className="text-4xl font-bold font-display mt-2">{formatCOP(totalEarned)}</p>
        <p className="text-emerald-200 text-xs mt-2">
          {history.length} entregas realizadas
        </p>
      </div>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aún no tienes entregas completadas.
          </p>
        ) : (
          history.map((o) => (
            <div
              key={o.id}
              className="p-4 rounded-2xl bg-cream border border-border shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                <p className="font-semibold text-sm mt-0.5">{o.customerName}</p>
              </div>
              <span className="font-mono font-bold text-emerald-600">
                + {formatCOP(EARNING_PER_DELIVERY_COP)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
