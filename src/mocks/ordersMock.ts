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

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  address: string;
  notes?: string;
  phone: string;
  items: OrderItem[];
  total: number;
  /** Costo de domicilio cobrado al cliente en la factura. */
  deliveryFee: number;
  status: OrderStatus;
  deliveryPersonId?: string;
  createdAt: string;
  /** Marca de tiempo (ms) cuando el pedido entró al flujo de cocina. */
  receivedAt?: number;
}

export const ordersMock: Order[] = [
  {
    id: "PED-101",
    customerName: "Laura Martínez",
    address: "Carrera 43A #1-50, Apto 902, El Poblado, Medellín",
    notes: "Torre B. Portería 24h.",
    phone: "+573105550102",
    items: [{ productId: "prod-01", quantity: 2 }, { productId: "prod-05", quantity: 1 }],
    total: 59300,
    deliveryFee: 5000,
    status: "Recibido",
    createdAt: "12:32 PM",
    receivedAt: Date.now() - 8 * 60_000,
  },
  {
    id: "PED-102",
    customerName: "Juan Pablo Montoya",
    address: "Calle 45 #12-34, Apto 302, Laureles, Medellín",
    notes: "Sin cebolla por favor.",
    phone: "+573155550544",
    items: [{ productId: "prod-02", quantity: 1 }, { productId: "prod-07", quantity: 2 }],
    total: 43500,
    deliveryFee: 5000,
    status: "En Cocina",
    createdAt: "12:18 PM",
    receivedAt: Date.now() - 18 * 60_000,
  },
  {
    id: "PED-103",
    customerName: "Valeria Ospina",
    address: "Calle 10 #36-12, Manila, Medellín",
    phone: "+573175550766",
    items: [{ productId: "prod-04", quantity: 1 }, { productId: "prod-06", quantity: 1 }],
    total: 31400,
    deliveryFee: 5000,
    status: "Listo",
    createdAt: "12:05 PM",
    receivedAt: Date.now() - 22 * 60_000,
  },
  {
    id: "PED-106",
    customerName: "Camila Henao",
    address: "Cra 35 #10-22, Manila, Medellín",
    phone: "+573198880111",
    items: [{ productId: "prod-01", quantity: 1 }],
    total: 29900,
    deliveryFee: 5000,
    status: "Listo",
    createdAt: "12:08 PM",
    receivedAt: Date.now() - 26 * 60_000,
  },
  {
    id: "PED-107",
    customerName: "Felipe Gómez",
    address: "Cl 8 #43-15, El Poblado, Medellín",
    phone: "+573187770222",
    items: [{ productId: "prod-02", quantity: 1 }, { productId: "prod-05", quantity: 1 }],
    total: 38000,
    deliveryFee: 6000,
    status: "Listo",
    createdAt: "12:11 PM",
    receivedAt: Date.now() - 12 * 60_000,
  },
  {
    id: "PED-108",
    customerName: "Natalia Ruiz",
    address: "Cra 43A #3-80, El Poblado, Medellín",
    notes: "Edificio verde, apto 501.",
    phone: "+573176660333",
    items: [{ productId: "prod-03", quantity: 1 }],
    total: 31900,
    deliveryFee: 5000,
    status: "Listo",
    createdAt: "12:14 PM",
    receivedAt: Date.now() - 10 * 60_000,
  },
  {
    id: "PED-104",
    customerName: "Andrés Quintero",
    address: "Cra 70 #C2-21, Estadio, Medellín",
    phone: "+573145550199",
    items: [{ productId: "prod-01", quantity: 1 }, { productId: "prod-08", quantity: 1 }],
    total: 36400,
    deliveryFee: 6000,
    status: "En Camino",
    deliveryPersonId: "USR-04",
    createdAt: "11:48 AM",
    receivedAt: Date.now() - 45 * 60_000,
  },
  {
    id: "PED-109",
    customerName: "Ricardo Mejía",
    address: "Calle 50 #45-10, Estadio, Medellín",
    phone: "+573191112233",
    items: [{ productId: "prod-05", quantity: 2 }],
    total: 23900,
    deliveryFee: 5500,
    status: "En Camino",
    deliveryPersonId: "USR-04",
    createdAt: "11:55 AM",
  },
  {
    id: "PED-105",
    customerName: "Diana Restrepo",
    address: "Cl 33 #74-50, Conquistadores, Medellín",
    notes: "Dejar en recepción.",
    phone: "+573164440111",
    items: [{ productId: "prod-02", quantity: 2 }],
    total: 57000,
    deliveryFee: 5000,
    status: "Entregado",
    deliveryPersonId: "USR-06",
    createdAt: "11:20 AM",
  },
];