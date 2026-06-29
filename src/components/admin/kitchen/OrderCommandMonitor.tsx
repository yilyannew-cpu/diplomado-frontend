import { CheckCircle2, ChefHat, Inbox, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ReadyDispatchColumn } from "@/components/admin/ReadyDispatchColumn";
import { KitchenConsolidationBar } from "@/components/admin/kitchen/KitchenConsolidationBar";
import { KitchenOrderCard } from "@/components/admin/kitchen/KitchenOrderCard";
import { useOrders } from "@/context/OrderContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKitchenTick } from "@/hooks/useKitchenTick";
import { stationHasDelayedOrders, type MonitorStation } from "@/lib/kitchenSla";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/mocks/ordersMock";

type ColumnConfig = {
  key: OrderStatus;
  label: string;
  shortLabel: string;
  next?: OrderStatus;
  nextLabel?: string;
  accent: string;
  icon: LucideIcon;
};

const COLUMNS: ColumnConfig[] = [
  {
    key: "Recibido",
    label: "Recibidos",
    shortLabel: "Recibidos",
    next: "En Cocina",
    nextLabel: "Pasar a cocina",
    accent: "bg-amber-brand",
    icon: Inbox,
  },
  {
    key: "En Cocina",
    label: "En cocina",
    shortLabel: "Cocina",
    next: "Listo",
    nextLabel: "Marcar listo",
    accent: "bg-primary",
    icon: ChefHat,
  },
  {
    key: "Listo",
    label: "Listos para despacho",
    shortLabel: "Listos",
    accent: "bg-emerald-500",
    icon: CheckCircle2,
  },
];

type GroupedColumn = ColumnConfig & { orders: Order[] };

interface OrderCommandMonitorProps {
  onAssignZone: (orders: Order[]) => void;
  onDispatchBatch: (orderIds: string[]) => void;
}

function ColumnContent({
  col,
  onAdvance,
  onAssignZone,
  onDispatchBatch,
}: {
  col: GroupedColumn;
  onAdvance: (orderId: string, next: OrderStatus) => void;
  onAssignZone: (orders: Order[]) => void;
  onDispatchBatch: (orderIds: string[]) => void;
}) {
  const EmptyIcon = col.icon;

  if (col.key === "Listo") {
    return (
      <ReadyDispatchColumn
        orders={col.orders}
        onAssignZone={onAssignZone}
        onDispatchBatch={onDispatchBatch}
      />
    );
  }

  if (col.orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-6">
        <EmptyIcon className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Sin pedidos en {col.shortLabel.toLowerCase()}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          Los nuevos pedidos aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <>
      {col.orders.map((order) => (
        <div key={order.id}>
          <KitchenOrderCard
            order={order}
            actionLabel={col.nextLabel}
            onAdvance={
              col.next ? () => onAdvance(order.id, col.next!) : undefined
            }
          />
        </div>
      ))}
    </>
  );
}

export function OrderCommandMonitor({ onAssignZone, onDispatchBatch }: OrderCommandMonitorProps) {
  const { orders, updateOrderStatus } = useOrders();
  const isMobile = useIsMobile();
  const now = useKitchenTick();
  const [mobileTab, setMobileTab] = useState<OrderStatus>("Recibido");

  const grouped = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        orders: orders.filter((order) => order.status === column.key),
      })),
    [orders],
  );

  const monitorOrders = useMemo(
    () => orders.filter((o) => o.status === "Recibido" || o.status === "En Cocina" || o.status === "Listo"),
    [orders],
  );
  const activeMobileColumn = grouped.find((col) => col.key === mobileTab) ?? grouped[0];

  const isStationDelayed = (station: MonitorStation) =>
    stationHasDelayedOrders(monitorOrders, station, now);

  const handleAdvance = (orderId: string, next: OrderStatus) => {
    updateOrderStatus(orderId, next);
    if (isMobile) setMobileTab(next);
  };

  return (
    <div className="space-y-4 md:space-y-5">
      <KitchenConsolidationBar monitorOrders={monitorOrders} />

      {/* Móvil: pestañas por estado */}
      <div
        className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-secondary/40 p-1 md:hidden"
        role="tablist"
        aria-label="Estados de comandas"
      >
        {grouped.map((col) => {
          const Icon = col.icon;
          const isActive = mobileTab === col.key;
          const hasDelayed = isStationDelayed(col.key as MonitorStation);
          return (
            <button
              key={col.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMobileTab(col.key)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-all duration-300",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card/60",
                hasDelayed && !isActive && "bg-red-50/50",
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-3 top-0 h-0.5 rounded-full transition-all duration-300",
                  hasDelayed ? "bg-red-500 animate-pulse" : isActive ? col.accent : "bg-transparent",
                )}
              />
              <span className="relative">
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    hasDelayed && "animate-pulse text-red-600",
                    !hasDelayed && isActive && "text-primary",
                  )}
                />
                {col.orders.length > 0 && (
                  <span
                    className={cn(
                      "absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold tabular-nums text-white",
                      hasDelayed ? "bg-red-500 animate-pulse" : col.accent,
                    )}
                  >
                    {col.orders.length}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  hasDelayed && "text-red-600",
                )}
              >
                {col.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Móvil: resumen del tab activo */}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-3 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              isStationDelayed(activeMobileColumn.key as MonitorStation)
                ? "animate-pulse bg-red-500"
                : activeMobileColumn.accent,
            )}
          />
          <p className="text-sm font-semibold">{activeMobileColumn.label}</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium tabular-nums">
          {`${activeMobileColumn.orders.length} pedido${activeMobileColumn.orders.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Móvil: solo la columna activa (evita conflictos de DOM al ocultar con CSS) */}
      {isMobile ? (
        <section key={mobileTab} role="tabpanel" className="space-y-3">
          <ColumnContent
            col={activeMobileColumn}
            onAdvance={handleAdvance}
            onAssignZone={onAssignZone}
            onDispatchBatch={onDispatchBatch}
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {grouped.map((col) => {
            const ColIcon = col.icon;
            const hasDelayed = isStationDelayed(col.key as MonitorStation);
            return (
            <section key={col.key}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      hasDelayed ? "animate-pulse bg-red-500" : col.accent,
                    )}
                  />
                  <ColIcon
                    className={cn(
                      "size-4",
                      hasDelayed ? "animate-pulse text-red-600" : "text-muted-foreground",
                    )}
                  />
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                </div>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums">
                  {col.orders.length}
                </span>
              </div>
              <div className="space-y-3">
                <ColumnContent
                  col={col}
                  onAdvance={handleAdvance}
                  onAssignZone={onAssignZone}
                  onDispatchBatch={onDispatchBatch}
                />
              </div>
            </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
