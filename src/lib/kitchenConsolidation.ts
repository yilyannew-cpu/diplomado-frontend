import type { MenuItem } from "@/mocks/menuMock";
import type { Order, OrderItem } from "@/mocks/ordersMock";

export interface ConsolidatedItem {
  productId: string;
  name: string;
  quantity: number;
}

export function buildKitchenConsolidation(
  kitchenOrders: Order[],
  menu: MenuItem[],
): ConsolidatedItem[] {
  const totals = new Map<string, ConsolidatedItem>();

  for (const order of kitchenOrders) {
    for (const item of order.items) {
      const product = menu.find((m) => m.id === item.productId);
      const name = product?.name ?? item.productId;
      const current = totals.get(item.productId);
      totals.set(item.productId, {
        productId: item.productId,
        name,
        quantity: (current?.quantity ?? 0) + item.quantity,
      });
    }
  }

  return [...totals.values()].sort(
    (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "es"),
  );
}

export function formatConsolidationLine(items: ConsolidatedItem[]): string {
  return items.map((item) => `${item.quantity}× ${item.name}`).join(" | ");
}

export function sumItemQuantities(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
