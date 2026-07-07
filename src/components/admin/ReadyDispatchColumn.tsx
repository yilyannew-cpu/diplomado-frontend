import { MapPin, Truck } from "lucide-react";
import { useMemo } from "react";
import { KitchenOrderCard } from "@/components/admin/kitchen/KitchenOrderCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { chunkOrders, MAX_ORDERS_PER_COURIER } from "@/lib/deliveryLimits";
import { groupOrdersByZone } from "@/lib/orderZones";
import type { Order } from "@/mocks/ordersMock";
import { usersMock } from "@/mocks/usersMock";

interface ReadyDispatchColumnProps {
  orders: Order[];
  onAssignZone: (orders: Order[]) => void;
  onDispatchBatch: (orderIds: string[]) => void;
}

export function ReadyDispatchColumn({
  orders,
  onAssignZone,
  onDispatchBatch,
}: ReadyDispatchColumnProps) {
  const zoneGroups = useMemo(() => groupOrdersByZone(orders), [orders]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Sin pedidos
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zoneGroups.map(({ zone, orders: zoneOrders }) => (
        <div
          key={zone}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-2.5 shadow-sm transition-all duration-300 sm:p-3"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                <MapPin className="size-3 shrink-0" />
                Zona
              </p>
              <h3 className="truncate text-sm font-semibold">{zone}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 tabular-nums">
              {zoneOrders.length} pedido{zoneOrders.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2">
            {zoneOrders.map((order) => (
              <div key={order.id} className="transition-all duration-300">
                <KitchenOrderCard order={order} compact />
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {chunkOrders(zoneOrders).map((batch, index) => (
              <BatchActions
                key={`${zone}-batch-${index}`}
                batch={batch}
                batchIndex={index}
                zoneOrderCount={zoneOrders.length}
                onAssign={() => onAssignZone(batch)}
                onDispatch={() => onDispatchBatch(batch.map((o) => o.id))}
              />
            ))}
          </div>

          {zoneOrders.length > MAX_ORDERS_PER_COURIER && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Máximo {MAX_ORDERS_PER_COURIER} pedidos por domiciliario. Asigna por grupos.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function BatchActions({
  batch,
  batchIndex,
  zoneOrderCount,
  onAssign,
  onDispatch,
}: {
  batch: Order[];
  batchIndex: number;
  zoneOrderCount: number;
  onAssign: () => void;
  onDispatch: () => void;
}) {
  const assignedCourierId = batch.every((o) => o.deliveryPersonId)
    ? batch[0].deliveryPersonId
    : undefined;
  const allAssigned = batch.every(
    (o) => o.deliveryPersonId && o.deliveryPersonId === assignedCourierId,
  );
  const courier = assignedCourierId
    ? usersMock.find((u) => u.id === assignedCourierId)
    : undefined;
  const readyToDispatch = allAssigned && batch.every((o) => o.status === "Listo");

  return (
    <div className="space-y-2">
      {readyToDispatch && courier ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 transition-all duration-300">
          <UserAvatar name={courier.name} src={courier.avatar} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              Repartidor asignado
            </p>
            <p className="truncate text-sm font-semibold">{courier.name}</p>
          </div>
        </div>
      ) : null}

      {readyToDispatch ? (
        <button
          type="button"
          onClick={onDispatch}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition-all duration-300 active:scale-[0.98] hover:bg-emerald-700 sm:min-h-0 sm:rounded-lg sm:py-2 sm:text-[11px]"
        >
          <Truck className="size-3.5" />
          Despachar a ruta ({batch.length}) →
        </button>
      ) : (
        <button
          type="button"
          onClick={onAssign}
          className="min-h-11 w-full rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-cream transition-all duration-300 active:scale-[0.98] hover:bg-primary sm:min-h-0 sm:rounded-lg sm:py-2 sm:text-[11px]"
        >
          Asignar domiciliario ({batch.length}) →
          {zoneOrderCount > MAX_ORDERS_PER_COURIER && (
            <span className="ml-1 font-normal text-cream/70">· grupo {batchIndex + 1}</span>
          )}
        </button>
      )}
    </div>
  );
}
