import type { Order, OrderStatus } from "@/mocks/ordersMock";

export const MAX_ORDERS_PER_COURIER = 3;

export const ACTIVE_DELIVERY_STATUSES = new Set<OrderStatus>(["En Camino", "Recogido"]);

export function countActiveCourierOrders(
  orders: Order[],
  courierId: string,
  excludeOrderIds: Set<string> = new Set(),
): number {
  return orders.filter(
    (o) =>
      !excludeOrderIds.has(o.id) &&
      o.deliveryPersonId === courierId &&
      ACTIVE_DELIVERY_STATUSES.has(o.status),
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
