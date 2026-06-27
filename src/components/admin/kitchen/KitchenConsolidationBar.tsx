import { Flame } from "lucide-react";
import { useMemo } from "react";
import { useOrders } from "@/context/OrderContext";
import { buildKitchenConsolidation, formatConsolidationLine } from "@/lib/kitchenConsolidation";
import type { Order } from "@/mocks/ordersMock";

interface KitchenConsolidationBarProps {
  kitchenOrders: Order[];
}

export function KitchenConsolidationBar({ kitchenOrders }: KitchenConsolidationBarProps) {
  const { menu } = useOrders();

  const items = useMemo(
    () => buildKitchenConsolidation(kitchenOrders, menu),
    [kitchenOrders, menu],
  );

  if (kitchenOrders.length === 0) return null;

  return (
    <div className="sticky top-[4.5rem] z-20 -mx-1 mb-5 rounded-2xl border border-primary/20 bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-wrap items-start gap-2 sm:items-center">
        <div className="flex shrink-0 items-center gap-2 text-primary">
          <Flame className="size-4" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">
            Para preparar ahora
          </span>
        </div>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
          {formatConsolidationLine(items)}
        </p>
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-primary">
          {kitchenOrders.length} comanda{kitchenOrders.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
