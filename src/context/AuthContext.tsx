import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usersMock, type MockUser, type Role } from "@/mocks/usersMock";

interface AuthState {
  user: MockUser | null;
  login: (email: string, password: string) => MockUser | null;
  quickLogin: (role: Role) => MockUser;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "burgercore.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        /* noop */
      }
    }
  }, []);

  const persist = (u: MockUser | null) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else window.localStorage.removeItem(STORAGE_KEY);
  };

  const login = (email: string, password: string) => {
    const found = usersMock.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (found) persist(found);
    return found ?? null;
  };

  const quickLogin = (role: Role) => {
    const found = usersMock.find((u) => u.role === role)!;
    persist(found);
    return found;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}