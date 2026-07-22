import { apiClient, buildQuery } from "@/lib/api/client";

export type ApiApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ApiCourierApplication {
  id: string;
  courierId: string;
  restaurantId: string;
  status: ApiApplicationStatus;
  createdAt: string;
  updatedAt: string;
  courierName?: string;
  courierEmail?: string;
  courierPhone?: string | null;
  courierAvatar?: string | null;
  courierVehicle?: string | null;
  courierDocumentId?: string | null;
  courierIsAvailable?: boolean;
  restaurantName?: string;
}

export const courierApplicationsApi = {
  /** Domiciliario se postula a un restaurante. */
  apply(restaurantId: string): Promise<ApiCourierApplication> {
    return apiClient("/courier-applications/apply", {
      method: "POST",
      body: { restaurantId },
      auth: true,
    });
  },

  /** Admin acepta o rechaza una postulación. */
  review(applicationId: string, status: ApiApplicationStatus): Promise<ApiCourierApplication> {
    return apiClient(`/courier-applications/${applicationId}/review`, {
      method: "PATCH",
      body: { status },
      auth: true,
    });
  },

  /** Lista solicitudes filtradas por restaurante o domiciliario. */
  list(params?: {
    restaurantId?: string;
    courierId?: string;
  }): Promise<ApiCourierApplication[]> {
    return apiClient(`/courier-applications${buildQuery(params)}`, { auth: true });
  },

  /** Domiciliario cambia su estado de disponibilidad. */
  toggleAvailability(isAvailable: boolean): Promise<{ id: string; is_available: boolean }> {
    return apiClient("/courier-applications/availability", {
      method: "PATCH",
      body: { isAvailable },
      auth: true,
    });
  },
};
