import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient, buildQuery } from "@/lib/api/client";

const KITCHEN_STATUSES = "Recibido,EnPreparacion,Listo";
/** En ruta + entregados (el panel filtra entregados del día para control). */
const DISPATCH_TRACKING_STATUSES = "EnCamino,Entregado";

export const adminOrdersApi = {
  listKitchenOrders(restaurantId: string): Promise<ApiOrder[]> {
    return apiClient(
      `/orders/restaurant/${restaurantId}${buildQuery({ status: KITCHEN_STATUSES })}`,
      { auth: true },
    );
  },

  listEnRouteOrders(restaurantId: string): Promise<ApiOrder[]> {
    return apiClient(
      `/orders/restaurant/${restaurantId}${buildQuery({ status: DISPATCH_TRACKING_STATUSES })}`,
      { auth: true },
    );
  },

  updateStatus(orderId: string, status: string): Promise<ApiOrder> {
    return apiClient(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
  },

  batchAssign(orderIds: string[], courierId: string): Promise<ApiOrder[]> {
    return apiClient("/orders/batch/assign", {
      method: "PATCH",
      body: { order_ids: orderIds, courier_id: courierId },
      auth: true,
    });
  },

  batchDispatch(orderIds: string[], restaurantId: string): Promise<ApiOrder[]> {
    return apiClient("/orders/batch/dispatch", {
      method: "PATCH",
      body: { order_ids: orderIds, restaurant_id: restaurantId },
      auth: true,
    });
  },
};
