import type { Order, OrderStatus } from "@/mocks/ordersMock";

/**
 * Tope operativo: hasta 3 pedidos del mismo restaurante y la misma zona
 * mientras el domiciliario sigue en sede (aún no En Camino).
 */
export const MAX_ORDERS_PER_COURIER = 3;

/** Pedidos con los que ya salió del restaurante (bloquean nuevas asignaciones). */
export const IN_TRANSIT_STATUSES = new Set<OrderStatus>(["En Camino", "Recogido"]);

/** @deprecated Usar IN_TRANSIT_STATUSES — el cupo en sede usa Listo asignado aparte. */
export const ACTIVE_DELIVERY_STATUSES = IN_TRANSIT_STATUSES;

export function countActiveCourierOrders(
  orders: Order[],
  courierId: string,
  excludeOrderIds: Set<string> = new Set(),
): number {
  return orders.filter(
    (o) =>
      !excludeOrderIds.has(o.id) &&
      o.deliveryPersonId === courierId &&
      IN_TRANSIT_STATUSES.has(o.status),
  ).length;
}

export function getCourierRemainingCapacity(
  orders: Order[],
  courierId: string,
  excludeOrderIds: Set<string> = new Set(),
): number {
  const active = countActiveCourierOrders(orders, courierId, excludeOrderIds);
  return Math.max(0, MAX_ORDERS_PER_COURIER - active);
}

export function canAssignBatchToCourier(
  orders: Order[],
  courierId: string,
  batchOrderIds: string[],
): boolean {
  const exclude = new Set(batchOrderIds);
  const remaining = getCourierRemainingCapacity(orders, courierId, exclude);
  return batchOrderIds.length <= remaining;
}

export function chunkOrders<T>(items: T[], size = MAX_ORDERS_PER_COURIER): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
