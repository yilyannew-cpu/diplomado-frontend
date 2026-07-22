import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient, getToken } from "@/lib/api/client";

const MY_ACTIVE_TTL_MS = 15_000;
let myActiveCache: { userKey: string; data: ApiOrder | null; fetchedAt: number } | null =
  null;
let myActiveInflight: { userKey: string; promise: Promise<ApiOrder | null> } | null = null;

function currentUserKey(): string {
  // Evita reutilizar el pedido activo de otro login en el mismo tab.
  return getToken() ?? "anonymous";
}

export interface CreateOrderExtraIds {
  addition_ids?: string[];
  side_ids?: string[];
  drink_ids?: string[];
  special_instructions?: string;
  /** Informativo; el backend recalcula el precio real. */
  extra_price?: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  address: string;
  phone: string;
  notes?: string;
  zone?: string;
  restaurant_id: string;
  /** Tarifa de domicilio calculada por km de ruta (COP, redondeada a centena). */
  delivery_fee?: number;
  items: Array<{
    product_id: string;
    quantity: number;
    customizations?: CreateOrderExtraIds;
  }>;
}

export const clientOrdersApi = {
  create(body: CreateOrderPayload): Promise<ApiOrder> {
    return apiClient("/orders", { method: "POST", body });
  },

  track(code: string): Promise<ApiOrder> {
    return apiClient(`/orders/track/${encodeURIComponent(code)}`);
  },

  /** Pedido activo del cliente autenticado. Caché scopeada por token. */
  myActive(): Promise<ApiOrder | null> {
    const userKey = currentUserKey();
    if (myActiveInflight && myActiveInflight.userKey === userKey) {
      return myActiveInflight.promise;
    }
    if (
      myActiveCache &&
      myActiveCache.userKey === userKey &&
      Date.now() - myActiveCache.fetchedAt < MY_ACTIVE_TTL_MS
    ) {
      return Promise.resolve(myActiveCache.data);
    }

    const promise = apiClient<ApiOrder | null>("/orders/my-active", { auth: true })
      .then((data) => {
        myActiveCache = { userKey, data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        if (myActiveInflight?.promise === promise) myActiveInflight = null;
      });

    myActiveInflight = { userKey, promise };
    return promise;
  },

  /** Historial de pedidos del cliente autenticado (solo los suyos). */
  myHistory(limit = 40): Promise<ApiOrder[]> {
    return apiClient<ApiOrder[]>(`/orders/my-history?limit=${limit}`, { auth: true }).then(
      (data) => (Array.isArray(data) ? data : []),
    );
  },
};

export function invalidateMyActiveOrderCache(): void {
  myActiveCache = null;
  myActiveInflight = null;
}
