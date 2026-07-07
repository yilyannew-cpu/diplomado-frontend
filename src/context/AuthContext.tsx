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
import type { User, Role } from "@/lib/api/types";
import { usersMock } from "@/mocks/usersMock";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setSession: (token: string, user: User) => void;
  /** Inyecta un usuario mock de forma síncrona — sin API. */
  quickLogin: (role: Role) => User;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!(getToken()));

  const setSession = useCallback((token: string, nextUser: User) => {
    setToken(token);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    if (token.startsWith("mock-token-")) {
      const role = token.replace("mock-token-", "") as Role;
      const mock = usersMock.find((u) => u.role === role && u.status === "Activo");
      if (mock) {
        const fakeUser: User = {
          id: mock.id, name: mock.name, email: mock.email, role: mock.role,
          phone: mock.phone ?? null, vehicle: mock.vehicle ?? null,
          document_id: mock.document_id ?? null, avatar: mock.avatar ?? null, status: mock.status,
        };
        setUser(fakeUser);
        return fakeUser;
      }
      clearSession();
      return null;
    }

    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      if (token.startsWith("mock-token-")) {
        const role = token.replace("mock-token-", "") as Role;
        const mock = usersMock.find((u) => u.role === role && u.status === "Activo");
        if (mock && !cancelled) {
          setUser({
            id: mock.id, name: mock.name, email: mock.email, role: mock.role,
            phone: mock.phone ?? null, vehicle: mock.vehicle ?? null,
            document_id: mock.document_id ?? null, avatar: mock.avatar ?? null, status: mock.status,
          });
        } else if (!mock && !cancelled) {
          clearSession();
        }
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const me = await authApi.me();
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
    const token = getToken();
    if (!token) return;
    
    if (token.startsWith("mock-token-")) {
      clearSession();
      return;
    }

    try {
      await authApi.logout();
    } catch {
      /* limpiar sesión local aunque falle el backend */
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const quickLogin = useCallback(
    (role: Role): User => {
      const mock = usersMock.find((u) => u.role === role && u.status === "Activo");
      if (!mock) throw new Error(`No hay usuario mock activo para el rol "${role}"`);
      const fakeUser: User = {
        id: mock.id,
        name: mock.name,
        email: mock.email,
        role: mock.role,
        phone: mock.phone ?? null,
        vehicle: mock.vehicle ?? null,
        document_id: mock.document_id ?? null,
        avatar: mock.avatar ?? null,
        status: mock.status,
      };
      setToken("mock-token-" + role);
      setUser(fakeUser);
      return fakeUser;
    },
    [],
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
      quickLogin,
    }),
    [user, isLoading, login, logout, refreshUser, setSession, quickLogin],
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
