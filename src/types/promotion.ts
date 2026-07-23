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
  restaurantId?: string;
}
