import { useState } from "react";
import { Bike, Package, RefreshCw, Truck } from "lucide-react";
import { formatCOP } from "@/context/OrderContext";
import type { OrderFilter } from "@/hooks/useOperationsTracking";
import { useOperationsTracking } from "@/hooks/useOperationsTracking";
import type { CourierAvailability } from "@/lib/api/types/operations";
import { ORDER_STATUS_LABEL } from "@/lib/api/types/operations";
import { cn } from "@/lib/utils";

const ORDER_FILTERS: Array<{ id: OrderFilter; label: string }> = [
  { id: "activos", label: "Todos activos" },
  { id: "EnCamino", label: "En camino" },
  { id: "EnPreparacion", label: "Preparando" },
  { id: "Recibido", label: "Pendientes" },
];

const AVAILABILITY_LABEL: Record<CourierAvailability, string> = {
  disponible: "Disponible",
  en_ruta: "En ruta / ocupado",
  offline: "Offline",
};

const AVAILABILITY_CLASS: Record<CourierAvailability, string> = {
  disponible: "bg-emerald-500/10 text-emerald-700",
  en_ruta: "bg-primary/10 text-primary",
  offline: "bg-muted text-muted-foreground",
};

function formatOrderTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OperationsPanel() {
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("activos");
  const { orders, couriers, metrics, loading, error, refresh } = useOperationsTracking(orderFilter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Seguimiento en tiempo real de pedidos y domiciliarios.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {metrics && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="En progreso" value={metrics.orders_in_progress} />
          <KpiCard label="En camino" value={metrics.orders_en_camino} />
          <KpiCard label="Sin asignar" value={metrics.orders_pendientes_asignacion} />
          <KpiCard label="Prom. entrega" value={`${metrics.avg_delivery_minutes} min`} />
          <KpiCard label="Disp. libres" value={metrics.couriers_available} />
          <KpiCard label="En ruta" value={metrics.couriers_en_ruta} />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Package className="size-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Pedidos</h3>
            <div className="ml-auto flex flex-wrap gap-1">
              {ORDER_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderFilter(f.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
                    orderFilter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Cargando pedidos…</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay pedidos para este filtro.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold">{order.order_number}</p>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {order.customer_name} · {order.restaurant_name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground/80">
                      {order.courier_name
                        ? `Domiciliario: ${order.courier_name}`
                        : "Sin domiciliario asignado"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-semibold tabular-nums">{formatCOP(order.total_cop)}</p>
                    <p className="text-muted-foreground">{formatOrderTime(order.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Bike className="size-4 text-primary" />
            <h3 className="font-display text-sm font-semibold">Domiciliarios activos</h3>
          </div>

          {loading && couriers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando domiciliarios…
            </div>
          ) : couriers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay domiciliarios activos.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {couriers.map((courier) => (
                <div key={courier.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{courier.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{courier.email}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        AVAILABILITY_CLASS[courier.availability],
                      )}
                    >
                      {AVAILABILITY_LABEL[courier.availability]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="size-3" />
                      {courier.active_orders} pedido{courier.active_orders !== 1 ? "s" : ""}
                    </span>
                    {courier.vehicle && <span className="truncate">{courier.vehicle}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
