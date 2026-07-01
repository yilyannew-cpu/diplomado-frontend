import type { Order } from "@/mocks/ordersMock";

/** Extrae el barrio/zona desde la dirección (penúltimo segmento antes de la ciudad). */
export function getOrderZone(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = parts[parts.length - 1].toLowerCase();
    if (city.includes("cúcuta") || city.includes("cucuta")) {
      return parts[parts.length - 2];
    }
  }
  return parts[parts.length - 1] ?? "Sin zona";
}

export interface ZoneOrderGroup {
  zone: string;
  orders: Order[];
}

export function groupOrdersByZone(orders: Order[]): ZoneOrderGroup[] {
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const zone = getOrderZone(order.address);
    const list = map.get(zone) ?? [];
    list.push(order);
    map.set(zone, list);
  }

  return [...map.entries()]
    .map(([zone, zoneOrders]) => ({
      zone,
      orders: zoneOrders.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }))
    .sort((a, b) => a.zone.localeCompare(b.zone, "es"));
}
