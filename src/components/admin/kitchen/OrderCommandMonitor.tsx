import { useMemo } from "react";
import { ReadyDispatchColumn } from "@/components/admin/ReadyDispatchColumn";
import { KitchenConsolidationBar } from "@/components/admin/kitchen/KitchenConsolidationBar";
import { KitchenOrderCard } from "@/components/admin/kitchen/KitchenOrderCard";
import { useOrders } from "@/context/OrderContext";
import type { OrderStatus } from "@/mocks/ordersMock";

const COLUMNS: {
  key: OrderStatus;
  label: string;
  next?: OrderStatus;
  nextLabel?: string;
  accent: string;
}[] = [
  {
    key: "Recibido",
    label: "Recibidos",
    next: "En Cocina",
    nextLabel: "Pasar a cocina",
    accent: "bg-amber-brand",
  },
  {
    key: "En Cocina",
    label: "En cocina",
    next: "Listo",
    nextLabel: "Marcar listo",
    accent: "bg-primary",
  },
  {
    key: "Listo",
    label: "Listos para despacho",
    accent: "bg-emerald-500",
  },
];

import type { Order } from "@/mocks/ordersMock";

interface OrderCommandMonitorProps {
  onAssignZone: (orders: Order[]) => void;
  onDispatchBatch: (orderIds: string[]) => void;
}

export function OrderCommandMonitor({ onAssignZone, onDispatchBatch }: OrderCommandMonitorProps) {
  const { orders, updateOrderStatus } = useOrders();

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        orders: orders.filter((order) => order.status === column.key),
      })),
    [orders],
  );

  const kitchenOrders = grouped.find((col) => col.key === "En Cocina")?.orders ?? [];

  return (
    <>
      <KitchenConsolidationBar kitchenOrders={kitchenOrders} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {grouped.map((col) => (
          <section key={col.key}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${col.accent}`} />
                <h2 className="text-sm font-semibold">{col.label}</h2>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums">
                {col.orders.length}
              </span>
            </div>

            <div className="space-y-3">
              {col.key === "Listo" ? (
                <ReadyDispatchColumn
                  orders={col.orders}
                  onAssignZone={onAssignZone}
                  onDispatchBatch={onDispatchBatch}
                />
              ) : (
                <>
                  {col.orders.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Sin pedidos
                    </div>
                  )}
                  {col.orders.map((order) => (
                    <div key={order.id} className="transition-all duration-300">
                      <KitchenOrderCard
                        order={order}
                        actionLabel={col.nextLabel}
                        onAdvance={
                          col.next ? () => updateOrderStatus(order.id, col.next!) : undefined
                        }
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
