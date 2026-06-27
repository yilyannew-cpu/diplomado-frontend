/** Clave de mes ISO: YYYY-MM */
export interface MonthlySalesSnapshot {
  monthKey: string;
  label: string;
  grossSales: number;
  courierPayout: number;
  deliveredOrders: number;
}

/** Histórico cerrado + base parcial del mes en curso (sin pedidos en vivo). */
export const monthlySalesHistoryMock: MonthlySalesSnapshot[] = [
  {
    monthKey: "2025-01",
    label: "Ene 2025",
    grossSales: 14_280_000,
    courierPayout: 1_120_000,
    deliveredOrders: 224,
  },
  {
    monthKey: "2025-02",
    label: "Feb 2025",
    grossSales: 13_950_000,
    courierPayout: 1_085_000,
    deliveredOrders: 217,
  },
  {
    monthKey: "2025-03",
    label: "Mar 2025",
    grossSales: 15_640_000,
    courierPayout: 1_240_000,
    deliveredOrders: 248,
  },
  {
    monthKey: "2025-04",
    label: "Abr 2025",
    grossSales: 16_100_000,
    courierPayout: 1_310_000,
    deliveredOrders: 262,
  },
  {
    monthKey: "2025-05",
    label: "May 2025",
    grossSales: 17_420_000,
    courierPayout: 1_395_000,
    deliveredOrders: 279,
  },
  {
    monthKey: "2025-06",
    label: "Jun 2025",
    grossSales: 8_750_000,
    courierPayout: 695_000,
    deliveredOrders: 139,
  },
];

export interface CourierPayoutSnapshot {
  courierId: string;
  deliveries: number;
  payout: number;
}

/** Pagos a domiciliarios del mes en curso antes de pedidos en vivo. */
export const currentMonthCourierPayoutsMock: CourierPayoutSnapshot[] = [
  { courierId: "USR-04", deliveries: 78, payout: 390_000 },
  { courierId: "USR-06", deliveries: 61, payout: 305_000 },
];
