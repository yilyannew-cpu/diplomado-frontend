import { apiClient } from "@/lib/api/client";

export type DeliveryReviewStatus = {
  order_id: string;
  order_code: string;
  status: string;
  can_review: boolean;
  reviewed: boolean;
  has_courier: boolean;
  restaurant_id: string;
  courier_id: string | null;
  courier_name: string | null;
};

export const deliveryReviewsApi = {
  getStatus(orderId: string): Promise<DeliveryReviewStatus> {
    return apiClient(`/orders/${orderId}/review-status`);
  },

  submit(
    orderId: string,
    body: {
      restaurant_rating: number;
      restaurant_comment?: string;
      courier_rating?: number;
      courier_comment?: string;
      customer_name?: string;
    },
  ): Promise<{ id: string; order_id: string }> {
    return apiClient(`/orders/${orderId}/reviews`, {
      method: "POST",
      body,
    });
  },
};

export const courierRatingApi = {
  me(): Promise<{
    courier_id: string;
    average_rating: number;
    review_count: number;
    recent: Array<{
      id: string;
      rating: number | null;
      comment: string | null;
      customer_name: string;
      order_code: string;
      created_at: string;
    }>;
  }> {
    return apiClient("/orders/courier/me/rating", { auth: true });
  },
};
