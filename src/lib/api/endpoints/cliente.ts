import type { ApiCategory, ApiPromotion, ApiReviewsPage } from "@/lib/api/types/admin";
import { apiClient, buildQuery } from "@/lib/api/client";

/** Respuesta de GET /restaurants (dominio backend en camelCase). */
export interface ApiRestaurantListItem {
  id: string;
  name: string;
  tagline: string | null;
  city: string;
  address?: string;
  rating: number;
  deliveryMinutes: number;
  accent: string;
  initials: string;
  logo?: string | null;
  /** Portada de la ficha (camelCase del listado público). */
  coverImage?: string | null;
  status?: string;
}

export const clienteApi = {
  listRestaurants(): Promise<ApiRestaurantListItem[]> {
    return apiClient("/restaurants");
  },

  listCategories(restaurantId: string): Promise<ApiCategory[]> {
    return apiClient(`/restaurants/${restaurantId}/categories`);
  },

  listActivePromotions(restaurantId: string): Promise<ApiPromotion[]> {
    return apiClient(`/restaurants/${restaurantId}/promotions/active`);
  },

  listReviews(
    restaurantId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ApiReviewsPage> {
    return apiClient(`/restaurants/${restaurantId}/reviews${buildQuery(params)}`);
  },

  createReview(
    restaurantId: string,
    body: { rating: number; comment: string; customer_name: string },
  ): Promise<{ id: string; rating: number; comment: string; customer_name: string; created_at: string }> {
    return apiClient(`/restaurants/${restaurantId}/reviews`, { method: "POST", body });
  },
};
