import {
  formatElapsedLabel,
  getElapsedMinutes,
  getSlaLevel,
  slaTimerClass,
  type SlaLevel,
} from "@/lib/kitchenSla";
import type { Order } from "@/mocks/ordersMock";

interface KitchenSlaTimerProps {
  order: Order;
  now: number;
}

export function KitchenSlaTimer({ order, now }: KitchenSlaTimerProps) {
  const minutes = getElapsedMinutes(order, now);
  const level = getSlaLevel(minutes);

  return (
    <span
      className={`shrink-0 rounded-lg px-2 py-1 font-mono text-xs font-bold tabular-nums ${slaTimerClass(level)}`}
      title={slaTitle(level)}
      aria-label={`Tiempo transcurrido: ${formatElapsedLabel(minutes)}. ${slaTitle(level)}`}
    >
      {formatElapsedLabel(minutes)}
    </span>
  );
}

function slaTitle(level: SlaLevel): string {
  switch (level) {
    case "critical":
      return "Pedido retrasado";
    case "warning":
      return "Al límite de tiempo";
    default:
      return "Tiempo óptimo";
  }
}
