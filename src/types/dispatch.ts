/** Registro de comanda despachada (Listo → En camino con domiciliario). */
export interface DispatchRecord {
  orderId: string;
  customerName: string;
  total: number;
  deliveryFee: number;
  deliveryPersonId: string;
  dispatchedAt: number;
}
