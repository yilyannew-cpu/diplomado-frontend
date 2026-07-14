import { clientOrdersApi } from "@/lib/api/endpoints/clientOrders";
import type { ApiOrder } from "@/lib/api/types/admin";

const TRACK_TTL_MS = 30_000;

type CacheEntry = { data: ApiOrder; fetchedAt: number };

const trackCache = new Map<string, CacheEntry>();
const trackInflight = new Map<string, Promise<ApiOrder>>();

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < TRACK_TTL_MS;
}

export function peekTrackedOrder(code: string): ApiOrder | null {
  const hit = trackCache.get(code);
  if (!hit || !isFresh(hit.fetchedAt)) return null;
  return hit.data;
}

export function setTrackedOrderCache(order: ApiOrder): void {
  trackCache.set(order.id, { data: order, fetchedAt: Date.now() });
}

export async function fetchOrderTrackCached(
  code: string,
  options?: { force?: boolean },
): Promise<ApiOrder> {
  if (!options?.force) {
    const hit = peekTrackedOrder(code);
    if (hit) return hit;
  }
  // Force salta TTL, pero no duplica HTTP mientras hay una en vuelo.
  const pending = trackInflight.get(code);
  if (pending) return pending;

  const request = clientOrdersApi
    .track(code)
    .then((raw) => {
      trackCache.set(code, { data: raw, fetchedAt: Date.now() });
      return raw;
    })
    .finally(() => {
      trackInflight.delete(code);
    });

  trackInflight.set(code, request);
  return request;
}
