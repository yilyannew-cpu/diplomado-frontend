import { useMemo } from "react";
import { useKitchenTick } from "@/hooks/useKitchenTick";
import {
  formatElapsedLabel,
  getOrderSlaLevel,
  getStationElapsedMinutes,
  isOrderDelayed,
  type SlaLevel,
} from "@/lib/kitchenSla";
import type { Order } from "@/mocks/ordersMock";

/** SLA en tiempo real para una comanda según su estación actual. */
export function useKitchenOrderSla(order: Order) {
  const now = useKitchenTick();

  return useMemo(() => {
    const minutes = getStationElapsedMinutes(order, now);
    const level: SlaLevel = getOrderSlaLevel(order, now);
    return {
      now,
      minutes,
      level,
      label: formatElapsedLabel(minutes),
      isDelayed: isOrderDelayed(order, now),
      isWarning: level === "warning",
    };
  }, [order, now]);
}

/** SLA agregado para el monitor completo (banner de demorados). */
export function useKitchenMonitorSla(orders: Order[]) {
  const now = useKitchenTick();

  return useMemo(() => {
    const delayedOrders = orders.filter((order) => isOrderDelayed(order, now));
    return { now, delayedOrders };
  }, [orders, now]);
}
