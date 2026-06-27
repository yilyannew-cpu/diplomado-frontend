import { sumDeliveryFees } from "@/lib/deliveryFees";

export { DEFAULT_DELIVERY_FEE_COP as DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/deliveryLimits";
import { getOrderZone } from "@/lib/orderZones";
import { getCourierRating } from "@/lib/courierRatings";
import type { Order } from "@/mocks/ordersMock";
import { usersMock } from "@/mocks/usersMock";

export interface ActiveDeliveryRow {
  courierId: string;
  courierName: string;
  courierAvatar?: string;
  vehicle?: string;
  orders: Order[];
  orderIds: string[];
  zones: string[];
  deliveryPay: number;
  statusLabel: string;
  statusKey: "en-camino" | "recogido" | "mixto";
  averageRating: number;
  reviewCount: number;
}

function resolveStatus(orders: Order[]): { label: string; key: ActiveDeliveryRow["statusKey"] } {
  const statuses = new Set(orders.map((o) => o.status));
  if (statuses.size === 1) {
    const status = orders[0].status;
    if (status === "En Camino") return { label: "En camino", key: "en-camino" };
    if (status === "Recogido") return { label: "Recogido en tienda", key: "recogido" };
  }
  return { label: "En ruta", key: "mixto" };
}

export function buildActiveDeliveryRows(orders: Order[]): ActiveDeliveryRow[] {
  const active = orders.filter(
    (o) => o.deliveryPersonId && ACTIVE_DELIVERY_STATUSES.has(o.status),
  );

  const byCourier = new Map<string, Order[]>();
  for (const order of active) {
    const list = byCourier.get(order.deliveryPersonId!) ?? [];
    list.push(order);
    byCourier.set(order.deliveryPersonId!, list);
  }

  return [...byCourier.entries()]
    .map(([courierId, courierOrders]) => {
      const courier = usersMock.find((u) => u.id === courierId);
      const zones = [...new Set(courierOrders.map((o) => getOrderZone(o.address)))].sort((a, b) =>
        a.localeCompare(b, "es"),
      );
      const { label, key } = resolveStatus(courierOrders);

      const rating = getCourierRating(courierId);

      return {
        courierId,
        courierName: courier?.name ?? "Domiciliario",
        courierAvatar: courier?.avatar,
        vehicle: courier?.vehicle,
        orders: courierOrders.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        orderIds: courierOrders.map((o) => o.id),
        zones,
        deliveryPay: sumDeliveryFees(courierOrders),
        statusLabel: label,
        statusKey: key,
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
      };
    })
    .sort((a, b) => a.courierName.localeCompare(b.courierName, "es"));
}

export function statusBadgeClass(statusKey: ActiveDeliveryRow["statusKey"]): string {
  switch (statusKey) {
    case "en-camino":
      return "bg-primary/15 text-primary";
    case "recogido":
      return "bg-amber-brand/15 text-amber-brand";
    default:
      return "bg-secondary text-muted-foreground";
  }
}
