import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient } from "@/lib/api/client";

const MY_ACTIVE_TTL_MS = 15_000;
let myActiveCache: { data: ApiOrder | null; fetchedAt: number } | null = null;
let myActiveInflight: Promise<ApiOrder | null> | null = null;

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

  /** Pedido activo del cliente autenticado (por teléfono de perfil). */
  myActive(): Promise<ApiOrder | null> {
    if (myActiveInflight) return myActiveInflight;
    if (myActiveCache && Date.now() - myActiveCache.fetchedAt < MY_ACTIVE_TTL_MS) {
      return Promise.resolve(myActiveCache.data);
    }

    myActiveInflight = apiClient<ApiOrder | null>("/orders/my-active", { auth: true })
      .then((data) => {
        myActiveCache = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        myActiveInflight = null;
      });

    return myActiveInflight;
  },
};

export function invalidateMyActiveOrderCache(): void {
  myActiveCache = null;
  myActiveInflight = null;
}
