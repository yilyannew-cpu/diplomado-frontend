import { clienteApi } from "@/lib/api/endpoints/cliente";

/** Conteo de reseñas del detalle: evita repetir reviews?limit=1 en remounts. */
export const REVIEW_COUNT_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { total: number; fetchedAt: number };

const countCache = new Map<string, CacheEntry>();
const countInflight = new Map<string, Promise<number>>();

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < REVIEW_COUNT_TTL_MS;
}

export function peekReviewCount(restaurantId: string): number | null {
  const hit = countCache.get(restaurantId);
  if (!hit || !isFresh(hit.fetchedAt)) return null;
  return hit.total;
}

export function invalidateReviewCount(restaurantId?: string): void {
  if (!restaurantId) {
    countCache.clear();
    countInflight.clear();
    return;
  }
  countCache.delete(restaurantId);
  countInflight.delete(restaurantId);
}

export async function fetchReviewCountCached(
  restaurantId: string,
  options?: { force?: boolean },
): Promise<number> {
  if (!options?.force) {
    const hit = peekReviewCount(restaurantId);
    if (hit !== null) return hit;
  }

  const pending = countInflight.get(restaurantId);
  if (pending) return pending;

  const request = clienteApi
    .listReviews(restaurantId, { limit: 1, offset: 0 })
    .then((page) => {
      const total = page.total ?? page.data.length;
      countCache.set(restaurantId, { total, fetchedAt: Date.now() });
      return total;
    })
    .finally(() => {
      countInflight.delete(restaurantId);
    });

  countInflight.set(restaurantId, request);
  return request;
}
