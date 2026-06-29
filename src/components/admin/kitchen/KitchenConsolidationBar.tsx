import { AlertCircle, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useOrders } from "@/context/OrderContext";
import { useKitchenMonitorSla } from "@/hooks/useKitchenOrderSla";
import { buildDelayedStationGroups } from "@/lib/kitchenConsolidation";
import { cn } from "@/lib/utils";
import type { Order } from "@/mocks/ordersMock";

interface KitchenConsolidationBarProps {
  monitorOrders: Order[];
}

export function KitchenConsolidationBar({ monitorOrders }: KitchenConsolidationBarProps) {
  const { menu } = useOrders();
  const { now, delayedOrders } = useKitchenMonitorSla(monitorOrders);
  const [expanded, setExpanded] = useState(false);

  const stationGroups = useMemo(
    () => buildDelayedStationGroups(monitorOrders, menu, now),
    [monitorOrders, menu, now],
  );

  if (delayedOrders.length === 0) return null;

  return (
    <div className="sticky top-[4.5rem] z-20 -mx-1 mb-1 rounded-2xl border border-red-300/60 bg-red-50 shadow-sm backdrop-blur-sm transition-all duration-300 sm:mb-5">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="delayed-orders-panel"
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-colors hover:bg-red-100/50 sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full bg-red-500/15",
              !expanded && "animate-bounce",
            )}
          >
            <AlertCircle className="size-4 text-red-600" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-red-700 sm:text-[11px]">
              Pedidos demorados
            </span>
            {!expanded && (
              <p className="text-[10px] text-red-600/80">Toca para ver detalles</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-medium tabular-nums text-red-700 sm:text-[11px]">
            {delayedOrders.length} comanda{delayedOrders.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-red-600 transition-transform duration-300",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </div>
      </button>

      <div
        id="delayed-orders-panel"
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-red-200/60 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
            {stationGroups.map((group) => (
              <div key={group.station}>
                <p className="text-[10px] font-medium text-red-600/90">{group.subtitle}</p>

                <p className="mt-0.5 font-mono text-[10px] text-red-700/70">
                  {group.orders.map((o) => o.id).join(" · ")}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5 md:hidden">
                  {group.items.map((item) => (
                    <span
                      key={`${group.station}-${item.productId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold leading-none text-foreground"
                    >
                      <span className="font-mono text-red-600">{item.quantity}×</span>
                      <span className="max-w-[9rem] truncate">{item.name}</span>
                    </span>
                  ))}
                </div>

                <p className="mt-1.5 hidden text-sm font-semibold leading-snug text-red-900 md:block">
                  {group.items.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
