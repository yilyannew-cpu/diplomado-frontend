import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient, buildQuery } from "@/lib/api/client";

/**
 * API del panel domiciliario.
 * Flujo: available → accept (Listo+asignado) → start-delivery (EnCamino) → complete (Entregado).
 */
export const courierOrdersApi = {
  /** Pedidos Listo sin domiciliario (cola). */
  listAvailable(restaurantId?: string): Promise<ApiOrder[]> {
    return apiClient(
      `/orders/delivery/available${buildQuery({ restaurantId })}`,
      { auth: true },
    );
  },

  /** Mis pedidos asignados (cualquier estado). */
  listMine(): Promise<ApiOrder[]> {
    return apiClient("/orders/courier/me", { auth: true });
  },

  /** Aceptar pedido Listo sin asignar. */
  accept(orderId: string): Promise<ApiOrder> {
    return apiClient(`/orders/${orderId}/accept`, {
      method: "POST",
      auth: true,
    });
  },

  /** Salir a entregar: Listo → EnCamino (el cliente ve el mapa). */
  startDelivery(orderId: string): Promise<ApiOrder> {
    return apiClient(`/orders/${orderId}/start-delivery`, {
      method: "POST",
      auth: true,
    });
  },

  /** Marcar entregado: EnCamino → Entregado. */
  complete(orderId: string): Promise<ApiOrder> {
    return apiClient(`/orders/${orderId}/complete`, {
      method: "POST",
      auth: true,
    });
  },
};
