/** Deduplica peticiones admin en vuelo (Strict Mode / efectos paralelos). */

const inflight = new Map<string, Promise<unknown>>();

export function dedupeAsync<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const request = factory().finally(() => {
    if (inflight.get(key) === request) {
      inflight.delete(key);
    }
  });

  inflight.set(key, request);
  return request;
}
