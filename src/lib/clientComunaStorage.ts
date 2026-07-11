const CLIENT_COMUNA_KEY = "ffcore_client_comuna";

type StoredComuna = {
  userId: string;
  comuna: string;
};

export function persistClientComuna(userId: string, comuna: string): void {
  if (typeof window === "undefined" || !userId || !comuna.trim()) return;
  const payload: StoredComuna = { userId, comuna: comuna.trim() };
  window.localStorage.setItem(CLIENT_COMUNA_KEY, JSON.stringify(payload));
}

export function readClientComuna(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(CLIENT_COMUNA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredComuna;
    if (parsed.userId !== userId || !parsed.comuna?.trim()) return null;
    return parsed.comuna.trim();
  } catch {
    return null;
  }
}

export function clearClientComuna(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CLIENT_COMUNA_KEY);
}

/** Usa la comuna del API o, si falta, la guardada al registrarse en este dispositivo. */
export function resolveClientComuna(
  user: { id: string; comuna?: string | null } | null | undefined,
): string | null {
  if (!user) return null;
  if (user.comuna?.trim()) {
    persistClientComuna(user.id, user.comuna);
    return user.comuna.trim();
  }
  return readClientComuna(user.id);
}
