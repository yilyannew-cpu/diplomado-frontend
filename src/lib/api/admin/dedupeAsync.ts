/** Deduplica peticiones admin en vuelo y, opcionalmente, por TTL corto. */

type CacheEntry = { data: unknown; fetchedAt: number };

const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry>();

export type DedupeOptions = {
  /** Reutilizar respuesta fresca sin ir a la red. */
  ttlMs?: number;
  /** Ignorar TTL y pedir de nuevo (sigue compartiendo inflight). */
  force?: boolean;
};

export function dedupeAsync<T>(
  key: string,
  factory: () => Promise<T>,
  options?: DedupeOptions,
): Promise<T> {
  const ttlMs = options?.ttlMs ?? 0;
  const force = options?.force === true;

  if (!force && ttlMs > 0) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < ttlMs) {
      return Promise.resolve(hit.data as T);
    }
  }

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const request = factory()
    .then((data) => {
      if (ttlMs > 0) {
        cache.set(key, { data, fetchedAt: Date.now() });
      }
      return data;
    })
    .finally(() => {
      if (inflight.get(key) === request) {
        inflight.delete(key);
      }
    });

  inflight.set(key, request);
  return request;
}

/** Escribe en caché sin red (login, toggle, avatar). */
export function seedDedupeCache<T>(key: string, data: T, ttlMs = 60_000): void {
  if (ttlMs > 0) {
    cache.set(key, { data, fetchedAt: Date.now() });
  }
}

/** Invalida entradas de cache (todas o por prefijo de key). */
export function invalidateDedupeCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix) || key === prefix) cache.delete(key);
  }
}

