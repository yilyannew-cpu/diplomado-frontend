import { apiClient } from "@/lib/api/client";
import type {
  ActiveCourier,
  ApiOrderStatus,
  DashboardMetrics,
  OperationsMetrics,
  OrderSummary,
  SystemStatus,
} from "@/lib/api/types/operations";

function unwrapData<T>(payload: { data: T }): T {
  return payload.data;
}

const TTL_MS = 25_000;

type CacheEntry<T> = { data: T; fetchedAt: number };
let ordersInflight = new Map<string, Promise<OrderSummary[]>>();
let ordersCache = new Map<string, CacheEntry<OrderSummary[]>>();
let couriersInflight: Promise<ActiveCourier[]> | null = null;
let couriersCache: CacheEntry<ActiveCourier[]> | null = null;
let metricsInflight: Promise<OperationsMetrics> | null = null;
let metricsCache: CacheEntry<OperationsMetrics> | null = null;

function readCache<T>(entry: CacheEntry<T> | null | undefined, force: boolean): T | null {
  if (force || !entry) return null;
  if (Date.now() - entry.fetchedAt >= TTL_MS) return null;
  return entry.data;
}

export const operationsApi = {
  getDashboardMetrics(): Promise<DashboardMetrics> {
    return apiClient<{ data: DashboardMetrics }>("/metrics/dashboard", { auth: true }).then(
      unwrapData,
    );
  },

  getSystemStatus(): Promise<SystemStatus> {
    return apiClient<{ data: SystemStatus }>("/system/status", { auth: true }).then(unwrapData);
  },

  listOrders(
    status?: ApiOrderStatus,
    options?: { force?: boolean },
  ): Promise<OrderSummary[]> {
    const key = status ?? "activos";
    const force = options?.force === true;
    const cached = readCache(ordersCache.get(key), force);
    if (cached) return Promise.resolve(cached);

    const existing = ordersInflight.get(key);
    if (existing) return existing;

    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const promise = apiClient<{ data: OrderSummary[] }>(`/orders${qs}`, { auth: true })
      .then(unwrapData)
      .then((data) => {
        ordersCache.set(key, { data, fetchedAt: Date.now() });
        return data;
      })
      .finally(() => {
        ordersInflight.delete(key);
      });

    ordersInflight.set(key, promise);
    return promise;
  },

  listActiveCouriers(options?: { force?: boolean }): Promise<ActiveCourier[]> {
    const force = options?.force === true;
    const cached = readCache(couriersCache, force);
    if (cached) return Promise.resolve(cached);
    if (couriersInflight) return couriersInflight;

    couriersInflight = apiClient<{ data: ActiveCourier[] }>("/couriers/active", { auth: true })
      .then(unwrapData)
      .then((data) => {
        couriersCache = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        couriersInflight = null;
      });

    return couriersInflight;
  },

  getOperationsMetrics(options?: { force?: boolean }): Promise<OperationsMetrics> {
    const force = options?.force === true;
    const cached = readCache(metricsCache, force);
    if (cached) return Promise.resolve(cached);
    if (metricsInflight) return metricsInflight;

    metricsInflight = apiClient<{ data: OperationsMetrics }>("/metrics/operations", {
      auth: true,
    })
      .then(unwrapData)
      .then((data) => {
        metricsCache = { data, fetchedAt: Date.now() };
        return data;
      })
      .finally(() => {
        metricsInflight = null;
      });

    return metricsInflight;
  },
};
