import { useMemo } from "react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CourierRatingBadge } from "@/components/shared/CourierRatingBadge";
import { formatCOP } from "@/context/OrderContext";
import {
  buildActiveDeliveryRows,
  statusBadgeClass,
} from "@/lib/activeDeliveries";
import { getOrderDeliveryFee } from "@/lib/deliveryFees";
import type { Order } from "@/mocks/ordersMock";

interface ActiveDeliveriesPanelProps {
  orders: Order[];
}

export function ActiveDeliveriesPanel({ orders }: ActiveDeliveriesPanelProps) {
  const rows = useMemo(() => buildActiveDeliveryRows(orders), [orders]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">Sin domicilios en ruta</p>
        <p className="mt-2 text-xs text-muted-foreground">
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
          <div key={row.courierId} className="border-b border-border last:border-b-0">
            {/* Mobile */}
            <div className="space-y-3 p-4 lg:hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    name={row.courierName}
                    src={row.courierAvatar}
                    className="size-11"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{row.courierName}</p>
                    {row.vehicle && (
                      <p className="text-[11px] text-muted-foreground">{row.vehicle}</p>
                    )}
                    <CourierRatingBadge
                      averageRating={row.averageRating}
                      reviewCount={row.reviewCount}
                      className="mt-1"
                    />
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusBadgeClass(row.statusKey)}`}
                >
                  {row.statusLabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {row.orderIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium"
                  >
                    {id}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{row.zones.join(" · ")}</span>
                <div className="text-right">
                  <p className="font-mono font-semibold text-primary tabular-nums">
                    {formatCOP(row.deliveryPay)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {row.orders.map((o) => formatCOP(getOrderDeliveryFee(o))).join(" + ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden items-center px-5 py-4 lg:grid lg:grid-cols-12 lg:gap-3">
              <div className="col-span-2 flex min-w-0 items-center gap-3">
                <UserAvatar
                  name={row.courierName}
                  src={row.courierAvatar}
                  className="size-10"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.courierName}</p>
                  {row.vehicle && (
                    <p className="truncate text-[11px] text-muted-foreground">{row.vehicle}</p>
                  )}
                </div>
              </div>
              <div className="col-span-3 flex flex-wrap gap-1.5">
                {row.orderIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium"
                  >
                    {id}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex items-center">
                <CourierRatingBadge
                  averageRating={row.averageRating}
                  reviewCount={row.reviewCount}
                />
              </div>
              <p className="col-span-2 truncate text-xs text-muted-foreground">
                {row.zones.join(", ")}
              </p>
              <div className="col-span-2 text-right">
                <p className="font-mono text-sm font-semibold text-primary tabular-nums">
                  {formatCOP(row.deliveryPay)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {row.orders
                    .map((o) => `${o.id}: ${formatCOP(getOrderDeliveryFee(o))}`)
                    .join(" · ")}
                </p>
              </div>
              <div className="col-span-2 flex flex-col items-center gap-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusBadgeClass(row.statusKey)}`}
                >
                  {row.statusLabel}
                </span>
                <ul className="text-center text-[10px] text-muted-foreground">
                  {row.orders.map((o) => (
                    <li key={o.id}>
                      {o.id}: {o.status}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
