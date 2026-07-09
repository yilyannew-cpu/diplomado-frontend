import { apiClient } from "@/lib/api/client";
import type {
  ActiveCourier,
  DashboardMetrics,
  OperationsMetrics,
  OrderStatus,
  OrderSummary,
  SystemStatus,
} from "@/lib/api/types/operations";

function unwrapData<T>(payload: { data: T }): T {
  return payload.data;
}

export const operationsApi = {
  getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient<{ data: DashboardMetrics }>("/metrics/dashboard", { auth: true }).then(unwrapData);
  },

  getSystemStatus(): Promise<SystemStatus> {
    return apiClient<{ data: SystemStatus }>("/system/status", { auth: true }).then(unwrapData);
  },

  listOrders(status?: OrderStatus): Promise<OrderSummary[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient<{ data: OrderSummary[] }>(`/orders${qs}`, { auth: true }).then(unwrapData);
  },

  listActiveCouriers(): Promise<ActiveCourier[]> {
    return apiClient<{ data: ActiveCourier[] }>("/couriers/active", { auth: true }).then(unwrapData);
  },

  getOperationsMetrics(): Promise<OperationsMetrics> {
    return apiClient<{ data: OperationsMetrics }>("/metrics/operations", { auth: true }).then(unwrapData);
  },
};
