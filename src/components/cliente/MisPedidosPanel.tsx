import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, MapPin, Package, RefreshCw, Store } from "lucide-react";
import { formatCOP, useCliente } from "@/context/ClienteContext";
import { mapApiOrders } from "@/lib/api/admin/mappers";
import { clientOrdersApi } from "@/lib/api/endpoints/clientOrders";
import { ApiError } from "@/lib/api/errors";
import { getOrderDeliveryFee, getOrderProductSales } from "@/lib/deliveryFees";
import type { Order, OrderStatus } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<OrderStatus, string> = {
  Recibido: "Recibido",
  "En Cocina": "En cocina",
  Listo: "Listo",
  Recogido: "Recogido",
  "En Camino": "En camino",
  Entregado: "Entregado",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  Recibido: "bg-blue-100 text-blue-700",
  "En Cocina": "bg-amber-100 text-amber-800",
  Listo: "bg-emerald-100 text-emerald-700",
  Recogido: "bg-violet-100 text-violet-700",
  "En Camino": "bg-primary/15 text-primary",
  Entregado: "bg-green-100 text-green-700",
};

function formatOrderDate(order: Order) {
  if (order.receivedAt && Number.isFinite(order.receivedAt)) {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.receivedAt));
  }
  return order.createdAt || "—";
}

export function MisPedidosPanel() {
  const { restaurants, setClientTab, refreshTracking } = useCliente();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const raw = await clientOrdersApi.myHistory(40);
      setOrders(mapApiOrders(raw));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar tu historial de pedidos.";
      setError(message);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const restaurantName = (order: Order) => {
    if (order.restaurantId) {
      const found = restaurants.find((r) => r.id === order.restaurantId);
      if (found) return found.name;
    }
    return "Restaurante";
  };

  const openTracking = async (order: Order) => {
    setClientTab("tracking");
    await refreshTracking(order.id);
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px]">
            Historial
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Mis pedidos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Solo ves los pedidos realizados con tu cuenta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Cargando tus pedidos…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Reintentar
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
          <ClipboardList className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="font-display text-lg font-semibold">Aún no tienes pedidos</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando confirms un pedido desde el menú, aparecerá aquí.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const deliveryFee = getOrderDeliveryFee(order);
            const productsTotal = getOrderProductSales(order);
            const canTrack = order.status !== "Entregado";
            return (
              <li
                key={order.orderId ?? order.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-muted-foreground">
                      {order.id}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                      <Store className="size-3.5 text-muted-foreground" />
                      {restaurantName(order)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatOrderDate(order)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      STATUS_STYLE[order.status],
                    )}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span className="line-clamp-2">{order.address}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  <span>
                    {order.items.length} producto{order.items.length === 1 ? "" : "s"} · Subtotal{" "}
                    {formatCOP(productsTotal)} · Domicilio {formatCOP(deliveryFee)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="font-mono text-base font-bold text-foreground">
                    {formatCOP(order.total)}
                  </p>
                  {canTrack ? (
                    <button
                      type="button"
                      onClick={() => void openTracking(order)}
                      className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Ver seguimiento
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
