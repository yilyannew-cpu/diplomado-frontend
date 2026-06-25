import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/mocks/usersMock";

const roleLabels: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

const roleRoutes: Record<Role, string> = {
  cliente: "/cliente",
  admin: "/admin",
  superadmin: "/superadmin",
  domiciliario: "/domiciliario",
};

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    if (user.role !== role) {
      navigate({ to: roleRoutes[user.role] });
    }
  }, [user, role, navigate]);

  if (!user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }
  return <>{children}</>;
}

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-semibold">
              B
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              BurgerCore
            </span>
          </Link>
          <div className="hidden md:block">
            <p className="font-display text-base font-semibold leading-tight">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {roleLabels[user.role]}
            </p>
          </div>
          <div className="grid size-10 place-items-center rounded-full bg-ink text-cream font-semibold">
            {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}