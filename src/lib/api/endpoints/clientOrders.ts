import type { ApiOrder } from "@/lib/api/types/admin";
import { apiClient } from "@/lib/api/client";

export interface CreateOrderPayload {
  customer_name: string;
  address: string;
  phone: string;
  notes?: string;
  zone?: string;
  restaurant_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    customizations?: {
      removed_ingredients: string[];
      added_modifiers: Record<string, string[]>;
      extra_price: number;
    };
  }>;
}

export const clientOrdersApi = {
  create(body: CreateOrderPayload): Promise<ApiOrder> {
    return apiClient("/orders", { method: "POST", body });
  },

  track(code: string): Promise<ApiOrder> {
    return apiClient(`/orders/track/${encodeURIComponent(code)}`);
  },
};
