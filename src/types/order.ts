export type OrderStatus =
  | "Recibido"
  | "En Cocina"
  | "Listo"
  | "Recogido"
  | "En Camino"
  | "Entregado";

export const CLIENT_STATUS_FLOW: OrderStatus[] = [
  "Recibido",
  "En Cocina",
  "Listo",
  "En Camino",
  "Entregado",
];

export interface SelectedMenuExtra {
  productId: string;
  name: string;
  price: number;
}

export interface OrderItemCustomizations {
  /** @deprecated pedidos antiguos */
  removedIngredients?: string[];
  /** @deprecated pedidos antiguos */
  addedModifiers?: Record<string, string[]>;
  additions?: SelectedMenuExtra[];
  sides?: SelectedMenuExtra[];
  drinks?: SelectedMenuExtra[];
  specialInstructions?: string;
  extraPrice: number;
}

export interface OrderItem {
  lineId?: string;
  productId: string;
  /** Nombre del producto al momento del pedido (API). Preferir sobre lookup en menú. */
  productName?: string;
  /** Imagen del producto (API). */
  productImage?: string | null;
  quantity: number;
  customizations?: OrderItemCustomizations;
}

export interface Order {
  id: string;
  /** UUID interno para operaciones PATCH en la API. */
  orderId?: string;
  customerName: string;
  address: string;
  notes?: string;
  phone: string;
  zone?: string;
  items: OrderItem[];
  total: number;
  /** Costo de domicilio cobrado al cliente en la factura. */
  deliveryFee: number;
  status: OrderStatus;
  /** Sede del pedido (API). */
  restaurantId?: string;
  deliveryPersonId?: string;
  /** Nombre del domiciliario asignado (cuando el pedido está en ruta). */
  courierName?: string;
  courierPhone?: string;
  /** Foto de perfil del domiciliario. */
  courierAvatar?: string;
  createdAt: string;
  /** Marca de tiempo (ms) cuando el pedido entró al flujo de cocina. */
  receivedAt?: number;
  /** Marca de tiempo (ms) cuando el pedido entró a su estado actual en el monitor. */
  statusEnteredAt?: number;
  /** Marca de tiempo (ms) cuando el pedido fue despachado (Listo → En camino). */
  dispatchedAt?: number;
}
