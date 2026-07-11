import type {
  ApiCategory,
  ApiDashboard,
  ApiDispatchRecord,
  ApiDispatchSummary,
  ApiMonthlySales,
  ApiPromotion,
  ApiRestaurantProfile,
  ApiReview,
  ApiReviewsPage,
  ApiSalesReport,
  ApiActiveDeliveryGroup,
  ApiAvailableCourier,
  ApiCourierPayout,
} from "@/lib/api/types/admin";
import { apiClient, apiDownload, apiUpload, buildQuery } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export const restaurantsApi = {
  getProfile(restaurantId: string): Promise<ApiRestaurantProfile> {
    return apiClient(`/restaurants/${restaurantId}`, { auth: true });
  },

  updateProfile(
    restaurantId: string,
    body: Partial<{
      name: string;
      tagline: string;
      city: string;
      address: string;
      delivery_minutes: number;
      monthly_goal: number | null;
      daily_goal: number | null;
      accent: string;
      logo: string | null;
    }>,
  ): Promise<ApiRestaurantProfile> {
    return apiClient(`/restaurants/${restaurantId}`, { method: "PATCH", body, auth: true });
  },

  uploadLogo(restaurantId: string, file: File): Promise<ApiRestaurantProfile> {
    return apiUpload(`/restaurants/${restaurantId}/logo`, file, { auth: true });
  },

  /**
   * Guarda el logo vía PATCH (data URL durable en Neon).
   * Requiere backend desplegado con columna `logo` y schema actualizado.
   */
  async saveLogo(restaurantId: string, dataUrl: string): Promise<ApiRestaurantProfile> {
    const updated = await this.updateProfile(restaurantId, { logo: dataUrl });
    if (updated.logo) return updated;

    // API antigua: acepta el PATCH pero descarta `logo` → no llamar POST /logo (404 en Render viejo).
    throw new ApiError(
      501,
      "LOGO_NOT_SUPPORTED",
      "El backend en producción aún no guarda logos. Sube y redespliega diplomado-backend (migración logo) y vuelve a intentar.",
    );
  },

  getDashboard(restaurantId: string): Promise<ApiDashboard> {
    return apiClient(`/restaurants/${restaurantId}/dashboard`, { auth: true });
  },

  listReviews(
    restaurantId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ApiReviewsPage> {
    return apiClient(`/restaurants/${restaurantId}/reviews${buildQuery(params)}`, { auth: true });
  },

  getSalesReport(
    restaurantId: string,
    params: { preset?: string; from?: string; to?: string },
  ): Promise<ApiSalesReport> {
    return apiClient(`/restaurants/${restaurantId}/reports/sales${buildQuery(params)}`, {
      auth: true,
    });
  },

  getMonthlySales(restaurantId: string, year: number): Promise<ApiMonthlySales> {
    return apiClient(
      `/restaurants/${restaurantId}/reports/sales/monthly${buildQuery({ year })}`,
      { auth: true },
    );
  },

  getCourierPayouts(
    restaurantId: string,
    params: { from: string; to: string },
  ): Promise<{ data: ApiCourierPayout[] }> {
    return apiClient(
      `/restaurants/${restaurantId}/reports/courier-payouts${buildQuery(params)}`,
      { auth: true },
    );
  },

  exportSalesCsv(restaurantId: string, params: { from: string; to: string }): Promise<Blob> {
    return apiDownload(
      `/restaurants/${restaurantId}/reports/sales/export${buildQuery(params)}`,
      { auth: true },
    );
  },

  listCategories(restaurantId: string): Promise<ApiCategory[]> {
    return apiClient(`/restaurants/${restaurantId}/categories`, { auth: true });
  },

  createCategory(
    restaurantId: string,
    body: { name: string; position?: number; image?: string },
  ): Promise<ApiCategory> {
    return apiClient(`/restaurants/${restaurantId}/categories`, {
      method: "POST",
      body,
      auth: true,
    });
  },

  listPromotions(restaurantId: string): Promise<ApiPromotion[]> {
    return apiClient(`/restaurants/${restaurantId}/promotions`, { auth: true });
  },

  createPromotion(
    restaurantId: string,
    body: {
      name: string;
      discount_percent: number;
      product_ids: string[];
      start_date: string;
      end_date: string;
      active: boolean;
    },
  ): Promise<ApiPromotion> {
    return apiClient(`/restaurants/${restaurantId}/promotions`, {
      method: "POST",
      body,
      auth: true,
    });
  },

  getActiveDeliveries(restaurantId: string): Promise<{ data: ApiActiveDeliveryGroup[] }> {
    return apiClient(`/restaurants/${restaurantId}/deliveries/active`, { auth: true });
  },

  listDispatches(
    restaurantId: string,
    params?: { from?: string; to?: string; period?: string },
  ): Promise<{ data: ApiDispatchRecord[] }> {
    return apiClient(`/restaurants/${restaurantId}/dispatches${buildQuery(params)}`, {
      auth: true,
    });
  },

  getDispatchSummary(
    restaurantId: string,
    period: "today" | "month" | "year" = "month",
  ): Promise<ApiDispatchSummary> {
    return apiClient(
      `/restaurants/${restaurantId}/dispatches/summary${buildQuery({ period })}`,
      { auth: true },
    );
  },

  listAvailableCouriers(
    restaurantId: string,
    batchSize: number,
  ): Promise<{ data: ApiAvailableCourier[] }> {
    return apiClient(
      `/restaurants/${restaurantId}/couriers/available${buildQuery({ batch_size: batchSize })}`,
      { auth: true },
    );
  },
};

export type { ApiReview };
