import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, ShoppingCart, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  ClientModuleNavDesktop,
  ClientModuleNavMobile,
} from "@/components/cliente/ClientModuleNav";
import { CartSheet } from "@/components/cliente/CartSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { roleRoutes, getLoginPathForRole } from "@/lib/auth/roleRoutes";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: getLoginPathForRole(role) });
      return;
    }
    if (user.role !== role) {
      navigate({ to: roleRoutes[user.role] });
    }
  }, [user, isLoading, role, navigate]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verificando sesión…
      </div>
    );
  }
  return <>{children}</>;
}

function ClientCartButton() {
  const { cartItemCount, setCartOpen } = useOrders();

  return (
    <>
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="relative grid size-9 place-items-center rounded-full border border-border bg-background transition-colors hover:bg-secondary sm:size-10"
        aria-label={`Carrito de compras${cartItemCount > 0 ? `, ${cartItemCount} productos` : ""}`}
      >
        <ShoppingCart className="size-4 sm:size-5" />
        {cartItemCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        )}
      </button>
      <CartSheet />
    </>
  );
}

function TopBarHeading({
  title,
  subtitle,
  slogan,
  className,
  mobile = false,
}: {
  title: string;
  subtitle?: string;
  slogan?: boolean;
  className?: string;
  mobile?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p
        className={cn(
          "font-display leading-tight",
          mobile && slogan && "line-clamp-1 text-xs font-bold",
          mobile && !slogan && "line-clamp-1 text-xs font-semibold",
          !mobile && slogan && "text-sm font-bold sm:text-base",
          !mobile && !slogan && "text-sm font-semibold sm:text-base",
        )}
      >
        {title}
      </p>
      {subtitle && (
        <p
          className={cn(
            "mt-0.5 leading-snug",
            mobile && slogan && "line-clamp-1 text-[10px] font-medium text-primary",
            mobile && !slogan && "line-clamp-1 text-[10px] text-muted-foreground",
            !mobile && slogan && "text-[11px] font-medium text-primary sm:text-xs",
            !mobile && !slogan && "text-[11px] text-muted-foreground sm:text-xs",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function TopBar({
  title,
  subtitle,
  slogan = false,
}: {
  title: string;
  subtitle?: string;
  slogan?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleLogout = () => {
    const loginPath = getLoginPathForRole(user.role);
    void logout().then(() => navigate({ to: loginPath }));
  };
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-3 sm:gap-4 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-6">
            {user.role === "cliente" ? (
              <>
                <ClientModuleNavMobile
                  slogan={slogan}
                  subtitle={subtitle}
                />
                <TopBarHeading
                  title={title}
                  subtitle={subtitle}
                  slogan={slogan}
                  mobile
                  className="min-w-0 flex-1 md:hidden"
                />
                <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
                  <ClientModuleNavDesktop />
                  <TopBarHeading
                    title={title}
                    subtitle={subtitle}
                    slogan={slogan}
                    className="min-w-0"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
                  <BrandLogo
                    size="sm"
                    iconOnly={slogan}
                    compact={!slogan}
                    className="shrink-0"
                  />
                  <TopBarHeading
                    title={title}
                    subtitle={subtitle}
                    slogan={slogan}
                    mobile
                    className="min-w-0 flex-1"
                  />
                </div>
                <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex md:gap-6">
                  <BrandLogo size="md" className="shrink-0" />
                  <TopBarHeading
                    title={title}
                    subtitle={subtitle}
                    slogan={slogan}
                    className="min-w-0"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {user.role === "cliente" && <ClientCartButton />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-transparent p-0.5 transition-colors hover:border-border hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-3 sm:px-1 sm:py-1"
                  aria-label="Menú de perfil"
                >
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {roleLabels[user.role]}
                    </p>
                  </div>
                  <UserAvatar name={user.name} src={user.avatar} className="size-9 sm:size-10" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium leading-tight">{user.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <User className="size-4" />
                  Mi cuenta
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Settings className="size-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn("cursor-pointer gap-2 text-destructive focus:text-destructive")}
                  onSelect={handleLogout}
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
