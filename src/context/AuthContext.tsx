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
import type { User } from "@/lib/api/types";
import { usersMock } from "@/mocks/usersMock";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(!!getToken());

  const setSession = useCallback((token: string, nextUser: User) => {
    setToken(token);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mock_user_data");
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      // Mock Refresh
      const stored = localStorage.getItem("mock_user_data");
      if (stored) {
        const me = JSON.parse(stored) as User;
        setUser(me);
        return me;
      }
      throw new Error("No mock session");
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

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
        // Mock Hydrate
        const stored = localStorage.getItem("mock_user_data");
        if (stored) {
          const me = JSON.parse(stored) as User;
          if (!cancelled) setUser(me);
        } else {
          throw new Error("No mock session");
        }
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
      // MOCK LOGIN BYPASS
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular retraso de red leve
      const mockUser = usersMock.find(u => u.email === email && u.password === password);
      
      if (!mockUser) {
        throw new Error("Credenciales inválidas. Intenta de nuevo.");
      }
      
      const fakeToken = `mock-token-${mockUser.id}`;
      const user = mockUser as unknown as User;
      
      localStorage.setItem("mock_user_data", JSON.stringify(user));
      setSession(fakeToken, user);
      return user;
    },
    [setSession],
  );

  const logout = useCallback(async (): Promise<void> => {
    const token = getToken();
    if (!token) return;
    
    try {
      // Mock logout (no-op en backend)
      await new Promise(r => setTimeout(r, 200));
    } catch {
      /* limpiar sesión local aunque falle */
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
