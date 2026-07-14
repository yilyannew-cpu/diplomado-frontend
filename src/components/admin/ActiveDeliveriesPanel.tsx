import { useMemo } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CourierRatingBadge } from "@/components/shared/CourierRatingBadge";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import { mapApiStatusToFrontend } from "@/lib/api/admin/mappers";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import type { OrderStatus } from "@/mocks/ordersMock";

function statusBadgeClass(status: OrderStatus): string {
  if (status === "En Camino") return "bg-primary/15 text-primary";
  if (status === "Recogido") return "bg-amber-brand/15 text-amber-brand";
  return "bg-secondary text-muted-foreground";
}

export function ActiveDeliveriesPanel() {
  const { activeDeliveries } = useAdmin();

  const rows = useMemo(() => activeDeliveries, [activeDeliveries]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center sm:p-10">
        <p className="text-sm font-medium text-foreground">Sin domicilios en ruta</p>
        <p className="mt-2 text-xs text-muted-foreground text-pretty">
          Los pedidos asignados aparecerán aquí. El estado se actualiza cuando el domiciliario
          marca entregas desde su app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        El pago al domiciliario es la suma del costo de domicilio cobrado en la factura de cada
        pedido en ruta.
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground lg:grid lg:grid-cols-12 lg:gap-3">
          <span className="col-span-2">Domiciliario</span>
          <span className="col-span-3">Pedidos</span>
          <span className="col-span-1">Calificación</span>
          <span className="col-span-2">Zona</span>
          <span className="col-span-2 text-right">Pago domicilio</span>
          <span className="col-span-2 text-center">Estado</span>
        </div>

        {rows.map((row) => (
          <div key={row.courier_id} className="border-b border-border last:border-b-0">
            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              <div className="flex items-start gap-3">
                <UserAvatar
                  name={row.courier_name}
                  src={resolveLogoUrl(row.courier_avatar) ?? row.courier_avatar ?? undefined}
                  className="size-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold" title={row.courier_name}>
                      {row.courier_name}
                    </p>
                    <p className="shrink-0 font-mono text-xs font-semibold tabular-nums text-primary sm:text-sm">
                      {formatCOP(row.total_delivery_pay)}
                    </p>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {row.vehicle ?? "Sin vehículo"}
                  </p>
                  <CourierRatingBadge
                    averageRating={row.average_rating}
                    reviewCount={0}
                    className="mt-1"
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {row.orders.map((order) => {
                  const status = mapApiStatusToFrontend(order.status);
                  return (
                    <li
                      key={order.order_id}
                      className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono font-semibold">{order.order_id}</p>
                          <p className="mt-0.5 truncate">{order.customer_name}</p>
                          <p className="mt-1 min-w-0 break-words text-muted-foreground">{order.address}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="hidden items-start gap-3 px-5 py-4 lg:grid lg:grid-cols-12">
              <div className="col-span-2 flex items-center gap-3">
                <UserAvatar
                  name={row.courier_name}
                  src={resolveLogoUrl(row.courier_avatar) ?? row.courier_avatar ?? undefined}
                  className="size-10 shrink-0"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.courier_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {row.vehicle ?? "Sin vehículo"}
                  </p>
                </div>
              </div>

              <ul className="col-span-3 space-y-1.5 text-xs">
                {row.orders.map((order) => (
                  <li key={order.order_id}>
                    <span className="font-mono font-medium">{order.order_id}</span>
                    <span className="text-muted-foreground"> · {order.customer_name}</span>
                  </li>
                ))}
              </ul>

              <div className="col-span-1">
                <CourierRatingBadge
                  averageRating={row.average_rating}
                  reviewCount={0}
                />
              </div>

              <p className="col-span-2 text-xs text-muted-foreground">
                {row.zones.join(" · ")}
              </p>

              <p className="col-span-2 text-right font-mono text-sm font-semibold tabular-nums text-primary">
                {formatCOP(row.total_delivery_pay)}
              </p>

              <div className="col-span-2 flex flex-wrap justify-center gap-1">
                {row.orders.map((order) => {
                  const status = mapApiStatusToFrontend(order.status);
                  return (
                    <span
                      key={order.order_id}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(status)}`}
                    >
                      {order.order_id}: {status}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
