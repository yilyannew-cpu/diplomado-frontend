export type OrderStatus =
  | "Recibido"
  | "En Cocina"
  | "Listo"
  | "Recogido"
  | "En Camino"
  | "Entregado";

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
  status: OrderStatus;
  deliveryPersonId?: string;
  createdAt: string;
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
    status: "Recibido",
    createdAt: "12:32 PM",
  },
  {
    id: "PED-102",
    customerName: "Juan Pablo Montoya",
    address: "Calle 45 #12-34, Apto 302, Laureles, Medellín",
    notes: "Sin cebolla por favor.",
    phone: "+573155550544",
    items: [{ productId: "prod-02", quantity: 1 }, { productId: "prod-07", quantity: 2 }],
    total: 43500,
    status: "En Cocina",
    deliveryPersonId: "USR-04",
    createdAt: "12:18 PM",
  },
  {
    id: "PED-103",
    customerName: "Valeria Ospina",
    address: "Calle 10 #36-12, Manila, Medellín",
    phone: "+573175550766",
    items: [{ productId: "prod-04", quantity: 1 }, { productId: "prod-06", quantity: 1 }],
    total: 31400,
    status: "Listo",
    deliveryPersonId: "USR-06",
    createdAt: "12:05 PM",
  },
  {
    id: "PED-104",
    customerName: "Andrés Quintero",
    address: "Cra 70 #C2-21, Estadio, Medellín",
    phone: "+573145550199",
    items: [{ productId: "prod-01", quantity: 1 }, { productId: "prod-08", quantity: 1 }],
    total: 36400,
    status: "En Camino",
    deliveryPersonId: "USR-04",
    createdAt: "11:48 AM",
  },
  {
    id: "PED-105",
    customerName: "Diana Restrepo",
    address: "Cl 33 #74-50, Conquistadores, Medellín",
    notes: "Dejar en recepción.",
    phone: "+573164440111",
    items: [{ productId: "prod-02", quantity: 2 }],
    total: 57000,
    status: "Entregado",
    deliveryPersonId: "USR-06",
    createdAt: "11:20 AM",
  },
];