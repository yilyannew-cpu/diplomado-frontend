import { Bike, CheckCircle2, MapPin, Phone } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CourierRatingBadge } from "@/components/shared/CourierRatingBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCOP } from "@/context/OrderContext";
import {
  canAssignBatchToCourier,
  getCourierRemainingCapacity,
  MAX_ORDERS_PER_COURIER,
} from "@/lib/deliveryLimits";
import { getOrderZone } from "@/lib/orderZones";
import { getCourierRating } from "@/lib/courierRatings";
import type { Order } from "@/mocks/ordersMock";
import { usersMock } from "@/mocks/usersMock";

interface AssignCourierModalProps {
  orders: Order[];
  allOrders: Order[];
  open: boolean;
  onClose: () => void;
  onAssign: (courierId: string) => void;
}

export function AssignCourierModal({
  orders,
  allOrders,
  open,
  onClose,
  onAssign,
}: AssignCourierModalProps) {
  const couriers = usersMock.filter((u) => u.role === "domiciliario" && u.status === "Activo");
  const batchIds = orders.map((o) => o.id);
  const batchIdSet = new Set(batchIds);
  const zone = orders.length > 0 ? getOrderZone(orders[0].address) : "";
  const batchTotal = orders.reduce((sum, o) => sum + o.total, 0);
  const batchTooLarge = orders.length > MAX_ORDERS_PER_COURIER;

  const availableCouriers = couriers.filter((c) =>
    canAssignBatchToCourier(allOrders, c.id, batchIds),
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Asignar domiciliario</DialogTitle>
          <DialogDescription>
            {orders.length === 1 ? (
              <>
                Pedido <span className="font-mono font-medium text-foreground">{orders[0].id}</span>{" "}
                · {orders[0].customerName}
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{orders.length} pedidos</span> en la
                misma zona
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-xl border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
          Cada domiciliario puede llevar máximo{" "}
          <span className="font-semibold text-foreground">{MAX_ORDERS_PER_COURIER} pedidos</span>{" "}
          activos a la vez.
        </p>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <MapPin className="size-3" />
            Zona · {zone}
          </p>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
            {orders.map((order) => (
              <li key={order.id} className="flex justify-between gap-2">
                <span>
                  <span className="font-mono font-medium">{order.id}</span> · {order.customerName}
                </span>
                <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                  {formatCOP(order.total)}
                </span>
              </li>
            ))}
          </ul>
          {orders.length > 1 && (
            <p className="mt-2 border-t border-primary/10 pt-2 text-right text-xs font-semibold text-primary">
              Total ruta: {formatCOP(batchTotal)}
            </p>
          )}
        </div>

        {batchTooLarge ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            Este grupo supera el límite de {MAX_ORDERS_PER_COURIER} pedidos. Cierra y asigna en
            grupos más pequeños.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {orders.length > 1
              ? "Todos los pedidos de este grupo se asignarán al mismo domiciliario."
              : orders[0]?.address}
          </p>
        )}

        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {couriers.map((courier) => {
            const remaining = getCourierRemainingCapacity(allOrders, courier.id, batchIdSet);
            const canAssign = canAssignBatchToCourier(allOrders, courier.id, batchIds);
            const activeCount = MAX_ORDERS_PER_COURIER - remaining;
            const rating = getCourierRating(courier.id);

            return (
              <li key={courier.id}>
                <button
                  type="button"
                  disabled={!canAssign || batchTooLarge}
                  onClick={() => onAssign(courier.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    !canAssign || batchTooLarge
                      ? "cursor-not-allowed border-border bg-secondary/40 opacity-60"
                      : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <UserAvatar
                    name={courier.name}
                    src={courier.avatar}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{courier.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          canAssign && !batchTooLarge
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-brand/15 text-amber-brand"
                        }`}
                      >
                        {canAssign && !batchTooLarge
                          ? "Disponible"
                          : remaining === 0
                            ? "Cupos llenos"
                            : `Solo ${remaining} cupo${remaining !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {activeCount}/{MAX_ORDERS_PER_COURIER} pedidos en ruta
                    </p>
                    <CourierRatingBadge
                      averageRating={rating.averageRating}
                      reviewCount={rating.reviewCount}
                      className="mt-1"
                    />
                    {courier.vehicle && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <Bike className="size-3 shrink-0" />
                        {courier.vehicle}
                      </p>
                    )}
                    {courier.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="size-3 shrink-0" />
                        {courier.phone}
                      </p>
                    )}
                  </div>
                  {canAssign && !batchTooLarge && (
                    <CheckCircle2 className="size-5 shrink-0 text-primary/40" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {availableCouriers.length === 0 && !batchTooLarge && (
          <p className="rounded-xl border border-dashed border-amber-brand/40 bg-amber-brand/5 px-4 py-3 text-center text-xs text-muted-foreground">
            Ningún domiciliario tiene cupo para {orders.length} pedido
            {orders.length !== 1 ? "s" : ""} más. Espera a que liberen entregas o asigna un grupo
            más pequeño.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
