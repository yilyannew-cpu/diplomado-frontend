import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api/endpoints/auth";
import { courierApplicationsApi } from "@/lib/api/endpoints/courierApplications";
import { setToken, getToken } from "@/lib/api/client";
import { dedupeAsync, invalidateDedupeCache, seedDedupeCache } from "@/lib/api/admin/dedupeAsync";
import { persistClientComuna, resolveClientComuna } from "@/lib/clientComunaStorage";
import type { User } from "@/lib/api/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: (options?: { force?: boolean }) => Promise<User | null>;
  setSession: (token: string, user: User) => void;
  toggleAvailability: (isAvailable: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const ME_TTL_MS = 60_000;
const ME_DEDUPE_KEY = "auth:me";

async function fetchMeCached(options?: { force?: boolean }): Promise<User> {
  return dedupeAsync(ME_DEDUPE_KEY, () => authApi.me(), {
    ttlMs: ME_TTL_MS,
    force: options?.force,
  });
}

/** Actualiza la caché de /me sin ir a la red (login, avatar, toggle). */
function seedMeCache(user: User): void {
  seedDedupeCache(ME_DEDUPE_KEY, user, ME_TTL_MS);
}

function withResolvedComuna(nextUser: User): User {
  const comuna = resolveClientComuna(nextUser);
  if (comuna && nextUser.comuna !== comuna) {
    return { ...nextUser, comuna };
  }
  if (comuna) persistClientComuna(nextUser.id, comuna);
  return nextUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((token: string, nextUser: User) => {
    setToken(token);
    const resolved = withResolvedComuna(nextUser);
    seedMeCache(resolved);
    setUser(resolved);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    invalidateDedupeCache(ME_DEDUPE_KEY);
  }, []);

  const refreshUser = useCallback(
    async (options?: { force?: boolean }): Promise<User | null> => {
      const token = getToken();
      if (!token) {
        setUser(null);
        return null;
      }

      try {
        const me = withResolvedComuna(await fetchMeCached(options));
        setUser(me);
        return me;
      } catch {
        clearSession();
        return null;
      }
    },
    [clearSession],
  );

  useEffect(() => {
    void authApi.health().catch(() => {
      /* despertar Render en cold start; no bloquea la UI */
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const me = withResolvedComuna(await fetchMeCached());
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      const response = await authApi.login({ email, password });
      setSession(response.token, response.user);
      return response.user;
    },
    [setSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (getToken()) await authApi.logout();
    } catch {
      /* limpiar sesión local aunque falle el backend */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const toggleAvailability = useCallback(
    async (isAvailable: boolean) => {
      const previous = user?.is_available ?? false;
      setUser((prev) => (prev ? { ...prev, is_available: isAvailable } : null));

      try {
        const result = await courierApplicationsApi.toggleAvailability(isAvailable);
        const nextAvailable = result.is_available ?? isAvailable;
        setUser((prev) => {
          if (!prev) return null;
          const next = { ...prev, is_available: nextAvailable };
          seedMeCache(next);
          return next;
        });
      } catch (err) {
        console.error("[Auth] Error toggling availability:", err);
        setUser((prev) => (prev ? { ...prev, is_available: previous } : null));
        throw err;
      }
    },
    [user?.is_available],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
      setSession,
      toggleAvailability,
    }),
    [user, isLoading, login, logout, refreshUser, setSession, toggleAvailability],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export type { User } from "@/lib/api/types";
export type { Role } from "@/lib/api/types";
