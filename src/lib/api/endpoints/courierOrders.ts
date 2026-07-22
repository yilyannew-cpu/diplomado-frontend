import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient, buildQuery } from "@/lib/api/client";
import { dedupeAsync, invalidateDedupeCache } from "@/lib/api/admin/dedupeAsync";

const MINE_KEY = "orders:courier:me";
const MINE_TTL_MS = 20_000;

/**
 * API del panel domiciliario.
 * Flujo: available → accept (Listo+asignado) → start-delivery (EnCamino) → complete (Entregado).
 *
 * Nota: `/orders/courier/me` en DevTools aparece como "me" (igual que `/auth/me`).
 * No es la misma petición: una es sesión, la otra es pedidos del domi.
 */
export const courierOrdersApi = {
  /** Pedidos Listo sin domiciliario (cola). */
  listAvailable(restaurantId?: string): Promise<ApiOrder[]> {
    return apiClient(
      `/orders/delivery/available${buildQuery({ restaurantId })}`,
      { auth: true },
    );
  },

  /** Mis pedidos asignados (cualquier estado). Deduplicado + TTL corto. */
  listMine(options?: { force?: boolean }): Promise<ApiOrder[]> {
    return dedupeAsync(
      MINE_KEY,
      () => apiClient<ApiOrder[]>("/orders/courier/me", { auth: true }),
      { ttlMs: MINE_TTL_MS, force: options?.force },
    );
  },

  /** Invalida caché tras aceptar / cambiar estado. */
  invalidateMineCache(): void {
    invalidateDedupeCache(MINE_KEY);
  },

  /** Aceptar pedido Listo sin asignar. */
  accept(orderId: string): Promise<ApiOrder> {
    return apiClient<ApiOrder>(`/orders/${orderId}/accept`, {
      method: "POST",
      auth: true,
    }).then((order) => {
      invalidateDedupeCache(MINE_KEY);
      return order;
    });
  },

  /** Salir a entregar: Listo → EnCamino (el cliente ve el mapa). */
  startDelivery(orderId: string): Promise<ApiOrder> {
    return apiClient<ApiOrder>(`/orders/${orderId}/start-delivery`, {
      method: "POST",
      auth: true,
    }).then((order) => {
      invalidateDedupeCache(MINE_KEY);
      return order;
    });
  },

  /** Marcar entregado: EnCamino → Entregado. */
  complete(orderId: string): Promise<ApiOrder> {
    return apiClient<ApiOrder>(`/orders/${orderId}/complete`, {
      method: "POST",
      auth: true,
    }).then((order) => {
      invalidateDedupeCache(MINE_KEY);
      return order;
    });
  },
};
