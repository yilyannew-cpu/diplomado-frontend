import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import {
  ClientModuleNavDesktop,
  ClientModuleNavMobile,
} from "@/components/cliente/ClientModuleNav";
import { CartSheet } from "@/components/cliente/CartSheet";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { roleRoutes, getLoginPathForRole } from "@/lib/auth/roleRoutes";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      const path = getLoginPathForRole(role);
      navigate({ to: path, replace: true });
      return;
    }
    if (user.role !== role) {
      navigate({ to: roleRoutes[user.role], replace: true });
    }
  }, [user, isLoading, role, navigate]);

  if (isLoading || !user || user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Cargando…
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
  const { user } = useAuth();
  if (!user) return null;

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
            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
