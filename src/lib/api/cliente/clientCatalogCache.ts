import { mapApiRestaurantList } from "@/lib/api/cliente/mappers";
import { clienteApi } from "@/lib/api/endpoints/cliente";
import { productsApi } from "@/lib/api/endpoints/products";
import { mapApiProducts, mapApiPromotions } from "@/lib/api/admin/mappers";
import type { MenuItem } from "@/mocks/menuMock";
import type { Promotion } from "@/mocks/promotionsMock";
import type { Restaurant } from "@/mocks/restaurantsMock";

/** Tiempo que el catálogo se considera fresco sin volver a pegarle al API. */
export const CLIENT_CATALOG_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = { data: T; fetchedAt: number };

let restaurantsCache: CacheEntry<Restaurant[]> | null = null;
const productsCache = new Map<string, CacheEntry<MenuItem[]>>();
const promotionsCache = new Map<string, CacheEntry<Promotion[]>>();

const productsInflight = new Map<string, Promise<MenuItem[]>>();
const promotionsInflight = new Map<string, Promise<Promotion[]>>();
let restaurantsInflight: Promise<Restaurant[]> | null = null;

function isFresh(fetchedAt: number, ttl = CLIENT_CATALOG_TTL_MS): boolean {
  return Date.now() - fetchedAt < ttl;
}

export function invalidateClientCatalogCache(): void {
  restaurantsCache = null;
  productsCache.clear();
  promotionsCache.clear();
  productsInflight.clear();
  promotionsInflight.clear();
  restaurantsInflight = null;
}

export function peekCachedRestaurants(): Restaurant[] | null {
  if (!restaurantsCache || !isFresh(restaurantsCache.fetchedAt)) return null;
  return restaurantsCache.data;
}

export function peekCachedProducts(restaurantId: string): MenuItem[] | null {
  const hit = productsCache.get(restaurantId);
  if (!hit || !isFresh(hit.fetchedAt)) return null;
  return hit.data;
}

export function peekAllCachedProducts(restaurantIds: string[]): MenuItem[] | null {
  if (restaurantIds.length === 0) return [];
  const chunks: MenuItem[][] = [];
  for (const id of restaurantIds) {
    const hit = peekCachedProducts(id);
    if (!hit) return null;
    chunks.push(hit);
  }
  return chunks.flat();
}

export function peekCachedPromotions(restaurantId: string): Promotion[] | null {
  const hit = promotionsCache.get(restaurantId);
  if (!hit || !isFresh(hit.fetchedAt)) return null;
  return hit.data;
}

export function isClientCatalogFresh(restaurantIds: string[]): boolean {
  if (!peekCachedRestaurants()) return false;
  return peekAllCachedProducts(restaurantIds) !== null;
}

export async function fetchRestaurantsCached(options?: {
  force?: boolean;
}): Promise<Restaurant[]> {
  if (!options?.force) {
    const hit = peekCachedRestaurants();
    if (hit) return hit;
  }
  // Con force se salta el peek, pero se sigue compartiendo inflight.
  if (restaurantsInflight) return restaurantsInflight;

  const request = clienteApi
    .listRestaurants()
    .then((list) => {
      const mapped = mapApiRestaurantList(list);
      restaurantsCache = { data: mapped, fetchedAt: Date.now() };
      return mapped;
    })
    .finally(() => {
      restaurantsInflight = null;
    });

  restaurantsInflight = request;
  return request;
}

export async function fetchRestaurantProductsCached(
  restaurantId: string,
  options?: { force?: boolean },
): Promise<MenuItem[]> {
  if (!options?.force) {
    const hit = peekCachedProducts(restaurantId);
    if (hit) return hit;
  }
  const pending = productsInflight.get(restaurantId);
  if (pending) return pending;

  const request = productsApi
    .list({ restaurantId, available: true })
    .then((raw) => {
      const mapped = mapApiProducts(raw);
      productsCache.set(restaurantId, { data: mapped, fetchedAt: Date.now() });
      return mapped;
    })
    .catch((err) => {
      if (!options?.force) {
        const stale = productsCache.get(restaurantId);
        if (stale) return stale.data;
      }
      throw err;
    })
    .finally(() => {
      productsInflight.delete(restaurantId);
    });

  productsInflight.set(restaurantId, request);
  return request;
}

export async function fetchAllProductsCached(
  restaurantIds: string[],
  options?: { force?: boolean },
): Promise<MenuItem[]> {
  if (restaurantIds.length === 0) return [];

  if (!options?.force) {
    const hit = peekAllCachedProducts(restaurantIds);
    if (hit) return hit;
  }

  const chunks = await Promise.all(
    restaurantIds.map((id) =>
      fetchRestaurantProductsCached(id, options).catch(() => {
        const stale = productsCache.get(id);
        return stale?.data ?? ([] as MenuItem[]);
      }),
    ),
  );
  return chunks.flat();
}

export async function fetchPromotionsCached(
  restaurantId: string,
  options?: { force?: boolean },
): Promise<Promotion[]> {
  if (!options?.force) {
    const hit = peekCachedPromotions(restaurantId);
    if (hit) return hit;
  }
  const pending = promotionsInflight.get(restaurantId);
  if (pending) return pending;

  const request = clienteApi
    .listActivePromotions(restaurantId)
    .then((raw) => {
      const mapped = mapApiPromotions(raw).map((promo) =>
        promo.restaurantId ? promo : { ...promo, restaurantId },
      );
      promotionsCache.set(restaurantId, { data: mapped, fetchedAt: Date.now() });
      return mapped;
    })
    .catch(() => {
      const stale = promotionsCache.get(restaurantId);
      return stale?.data ?? ([] as Promotion[]);
    })
    .finally(() => {
      promotionsInflight.delete(restaurantId);
    });

  promotionsInflight.set(restaurantId, request);
  return request;
}

/** Promociones activas de todos los restaurantes (módulo Promociones). */
export async function fetchAllPromotionsCached(
  restaurantIds: string[],
  options?: { force?: boolean },
): Promise<Promotion[]> {
  if (restaurantIds.length === 0) return [];
  const chunks = await Promise.all(
    restaurantIds.map((id) => fetchPromotionsCached(id, options)),
  );
  return chunks.flat();
}

export function peekAllCachedPromotions(restaurantIds: string[]): Promotion[] | null {
  if (restaurantIds.length === 0) return [];
  const chunks: Promotion[][] = [];
  for (const id of restaurantIds) {
    const hit = peekCachedPromotions(id);
    if (!hit) return null;
    chunks.push(hit);
  }
  return chunks.flat();
}

export function patchCachedRestaurant(
  restaurantId: string,
  patch: Partial<Restaurant>,
): Restaurant[] | null {
  if (!restaurantsCache) return null;
  const next = restaurantsCache.data.map((r) =>
    r.id === restaurantId ? { ...r, ...patch } : r,
  );
  restaurantsCache = { ...restaurantsCache, data: next };
  return next;
}
