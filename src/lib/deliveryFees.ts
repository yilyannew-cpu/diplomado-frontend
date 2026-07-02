import type { Order } from "@/mocks/ordersMock";

/** Tarifa por defecto al crear pedidos (debe coincidir con el carrito del cliente). */
export const DEFAULT_DELIVERY_FEE_COP = 5000;

export function getOrderDeliveryFee(order: Order): number {
  return order.deliveryFee ?? DEFAULT_DELIVERY_FEE_COP;
}

/** Suma los costos de domicilio facturados al cliente por cada pedido en ruta. */
export function sumDeliveryFees(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + getOrderDeliveryFee(order), 0);
}
