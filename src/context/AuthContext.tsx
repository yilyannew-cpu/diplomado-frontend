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
import { setToken, getToken } from "@/lib/api/client";
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
}

const AuthContext = createContext<AuthState | null>(null);

let meInflight: Promise<User> | null = null;
let meCache: { user: User; fetchedAt: number } | null = null;
const ME_TTL_MS = 60_000;

async function fetchMeCached(options?: { force?: boolean }): Promise<User> {
  if (!options?.force && meCache && Date.now() - meCache.fetchedAt < ME_TTL_MS) {
    return meCache.user;
  }
  if (meInflight) return meInflight;

  meInflight = authApi
    .me()
    .then((user) => {
      meCache = { user, fetchedAt: Date.now() };
      return user;
    })
    .finally(() => {
      meInflight = null;
    });
  return meInflight;
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
    meCache = { user: resolved, fetchedAt: Date.now() };
    setUser(resolved);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    meCache = null;
    // No borramos la comuna local: el API en producción aún puede no
    // devolverla, y al volver a iniciar sesión hace falta para los avisos.
  }, []);

  const refreshUser = useCallback(
    async (options?: { force?: boolean }): Promise<User | null> => {
      const token = getToken();
      if (!token) {
        setUser(null);
        return null;
      }

      try {
        // Por defecto respeta TTL/inflight; force solo tras editar perfil.
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

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
      setSession,
    }),
    [user, isLoading, login, logout, refreshUser, setSession],
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
