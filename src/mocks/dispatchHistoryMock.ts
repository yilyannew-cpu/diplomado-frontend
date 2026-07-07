/** Registro de comanda despachada (Listo → En camino con domiciliario). */
export interface DispatchRecord {
  orderId: string;
  customerName: string;
  total: number;
  deliveryFee: number;
  deliveryPersonId: string;
  dispatchedAt: number;
}

const DAY = 86_400_000;
const HOUR = 3_600_000;

function ago(days: number, hours = 10): number {
  return Date.now() - days * DAY - hours * HOUR;
}

/** Histórico de despachos para demo (día, mes y año). */
export const dispatchHistoryMock: DispatchRecord[] = [
  // Hoy
  {
    orderId: "PED-080",
    customerName: "Santiago López",
    total: 42_500,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-04",
    dispatchedAt: Date.now() - 4 * HOUR,
  },
  {
    orderId: "PED-081",
    customerName: "María Fernanda Ruiz",
    total: 31_900,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-06",
    dispatchedAt: Date.now() - 7 * HOUR,
  },
  // Ayer (mes actual)
  {
    orderId: "PED-075",
    customerName: "Carlos Mejía",
    total: 58_300,
    deliveryFee: 6_000,
    deliveryPersonId: "USR-04",
    dispatchedAt: ago(1, 14),
  },
  {
    orderId: "PED-076",
    customerName: "Ana Lucía Vélez",
    total: 27_400,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-06",
    dispatchedAt: ago(1, 19),
  },
  // Esta semana
  {
    orderId: "PED-070",
    customerName: "Jorge Iván Duque",
    total: 64_800,
    deliveryFee: 6_000,
    deliveryPersonId: "USR-04",
    dispatchedAt: ago(3, 12),
  },
  {
    orderId: "PED-071",
    customerName: "Paola Giraldo",
    total: 38_200,
    deliveryFee: 5_500,
    deliveryPersonId: "USR-06",
    dispatchedAt: ago(5, 16),
  },
  // Meses anteriores (año)
  {
    orderId: "PED-060",
    customerName: "Luis Eduardo Mesa",
    total: 45_600,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-04",
    dispatchedAt: ago(35, 11),
  },
  {
    orderId: "PED-061",
    customerName: "Isabella Torres",
    total: 52_100,
    deliveryFee: 5_500,
    deliveryPersonId: "USR-06",
    dispatchedAt: ago(38, 15),
  },
  {
    orderId: "PED-050",
    customerName: "Diego Andrés Gil",
    total: 71_300,
    deliveryFee: 6_000,
    deliveryPersonId: "USR-04",
    dispatchedAt: ago(68, 13),
  },
  {
    orderId: "PED-051",
    customerName: "Laura Sánchez",
    total: 33_800,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-06",
    dispatchedAt: ago(72, 18),
  },
  {
    orderId: "PED-040",
    customerName: "Andrés Felipe Ochoa",
    total: 89_500,
    deliveryFee: 6_500,
    deliveryPersonId: "USR-04",
    dispatchedAt: ago(120, 12),
  },
  {
    orderId: "PED-041",
    customerName: "Valentina Muñoz",
    total: 41_200,
    deliveryFee: 5_000,
    deliveryPersonId: "USR-06",
    dispatchedAt: ago(145, 20),
  },
];
