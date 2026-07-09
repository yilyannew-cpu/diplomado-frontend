import type { ApiPromotion } from "@/lib/api/types/admin";
import { apiClient } from "@/lib/api/client";

export const promotionsApi = {
  get(promotionId: string): Promise<ApiPromotion> {
    return apiClient(`/promotions/${promotionId}`, { auth: true });
  },

  update(
    promotionId: string,
    body: Partial<{
      name: string;
      discount_percent: number;
      product_ids: string[];
      start_date: string;
      end_date: string;
      active: boolean;
    }>,
  ): Promise<ApiPromotion> {
    return apiClient(`/promotions/${promotionId}`, { method: "PATCH", body, auth: true });
  },

  delete(promotionId: string): Promise<void> {
    return apiClient(`/promotions/${promotionId}`, { method: "DELETE", auth: true });
  },
};
