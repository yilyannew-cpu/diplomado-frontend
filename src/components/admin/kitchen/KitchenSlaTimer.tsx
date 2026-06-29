import {
  formatElapsedLabel,
  getOrderSlaLevel,
  getStationElapsedMinutes,
  slaTimerClass,
  slaTitle,
} from "@/lib/kitchenSla";
import type { Order } from "@/mocks/ordersMock";

interface KitchenSlaTimerProps {
  order: Order;
  now: number;
}

export function KitchenSlaTimer({ order, now }: KitchenSlaTimerProps) {
  const minutes = getStationElapsedMinutes(order, now);
  const level = getOrderSlaLevel(order, now);

  return (
    <span
      className={`shrink-0 rounded-lg px-2 py-1 font-mono text-xs font-bold tabular-nums ${slaTimerClass(level)}`}
      title={slaTitle(level)}
      aria-label={`Tiempo en estación: ${formatElapsedLabel(minutes)}. ${slaTitle(level)}`}
    >
      {formatElapsedLabel(minutes)}
    </span>
  );
}
