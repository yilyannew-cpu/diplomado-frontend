import type { Order, OrderStatus } from "@/mocks/ordersMock";

/** Estados visibles en el monitor de comandas. */
export type MonitorStation = Extract<OrderStatus, "Recibido" | "En Cocina" | "Listo">;

export type SlaLevel = "optimal" | "warning" | "delayed";

export const MONITOR_STATIONS: MonitorStation[] = ["Recibido", "En Cocina", "Listo"];

export const STATION_SLA_CONFIG: Record<
  MonitorStation,
  { warningAt: number | null; delayedMax: number }
> = {
  Recibido: { warningAt: null, delayedMax: 5 },
  "En Cocina": { warningAt: 15, delayedMax: 20 },
  Listo: { warningAt: null, delayedMax: 5 },
};

export const STATION_DELAY_SUBTITLE: Record<MonitorStation, string> = {
  Recibido: "Más de 5 min en recibidos",
  "En Cocina": "Más de 20 min en cocina",
  Listo: "Más de 5 min en listos",
};

export function isMonitorStation(status: OrderStatus): status is MonitorStation {
  return status === "Recibido" || status === "En Cocina" || status === "Listo";
}

export function parseCreatedAtToTimestamp(createdAt: string, reference = new Date()): number {
  const match = createdAt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return reference.getTime();

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const date = new Date(reference);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > reference.getTime()) {
    date.setDate(date.getDate() - 1);
  }
  return date.getTime();
}

/** Tiempo en el que el pedido entró a su estado actual en el monitor. */
export function getStationEnteredAt(order: Order): number {
  return (
    order.statusEnteredAt ??
    order.receivedAt ??
    parseCreatedAtToTimestamp(order.createdAt)
  );
}

export function getStationElapsedMinutes(order: Order, now = Date.now()): number {
  return Math.max(0, Math.floor((now - getStationEnteredAt(order)) / 60_000));
}

export function getOrderSlaLevel(order: Order, now = Date.now()): SlaLevel {
  if (!isMonitorStation(order.status)) return "optimal";

  const minutes = getStationElapsedMinutes(order, now);
  const config = STATION_SLA_CONFIG[order.status];

  if (minutes >= config.delayedMax) return "delayed";
  if (config.warningAt !== null && minutes >= config.warningAt) return "warning";
  return "optimal";
}

export function isOrderDelayed(order: Order, now = Date.now()): boolean {
  return getOrderSlaLevel(order, now) === "delayed";
}

export function formatElapsedLabel(minutes: number): string {
  return `${minutes} min`;
}

export function slaTimerClass(level: SlaLevel): string {
  switch (level) {
    case "delayed":
      return "bg-red-100 text-red-600 animate-pulse";
    case "warning":
      return "bg-amber-brand/20 text-amber-brand";
    default:
      return "bg-emerald-500/15 text-emerald-700";
  }
}

export function slaCardBorderClass(level: SlaLevel): string {
  switch (level) {
    case "delayed":
      return "border-red-400/60 bg-red-50/30 animate-pulse";
    case "warning":
      return "border-amber-brand/50";
    default:
      return "border-border";
  }
}

export function slaTitle(level: SlaLevel): string {
  switch (level) {
    case "delayed":
      return "Pedido demorado";
    case "warning":
      return "Cerca del límite de tiempo";
    default:
      return "Tiempo óptimo";
  }
}

export function filterDelayedMonitorOrders(orders: Order[], now = Date.now()): Order[] {
  return orders.filter(
    (order) => isMonitorStation(order.status) && isOrderDelayed(order, now),
  );
}

export function stationHasDelayedOrders(
  orders: Order[],
  station: MonitorStation,
  now = Date.now(),
): boolean {
  return orders.some((order) => order.status === station && isOrderDelayed(order, now));
}
