export interface Promotion {
  id: string;
  name: string;
  discountPercent: number;
  productIds: string[];
  startDate: string;
  endDate: string;
  /** Control manual: si es false, la promoción no aplica aunque esté en rango de fechas. */
  active: boolean;
  createdAt: number;
}

export const promotionsMock: Promotion[] = [
  {
    id: "PROM-01",
    name: "Semana del smash",
    discountPercent: 15,
    productIds: ["prod-01", "prod-02"],
    startDate: "2025-06-01",
    endDate: "2025-06-30",
    active: true,
    createdAt: Date.now(),
  },
];
