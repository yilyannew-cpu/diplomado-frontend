import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User, Bike } from "lucide-react";
import { useEffect, useState } from "react";
import { PerfilDrawer } from "@/components/domiciliario/PerfilDrawer";
import type { DrawerView } from "@/components/domiciliario/PerfilDrawer";
import {
  ProfileAccountDialog,
  RESTAURANT_PROFILE_UPDATED_EVENT,
} from "@/components/shared/ProfileAccountDialog";
import { ProfileSettingsDialog } from "@/components/shared/ProfileSettingsDialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useOptionalAdmin } from "@/context/AdminContext";
import { restaurantsApi } from "@/lib/api/endpoints/restaurants";
import { dedupeAsync } from "@/lib/api/admin/dedupeAsync";
import type { Role } from "@/lib/api/types";
import type { ApiRestaurantProfile } from "@/lib/api/types/admin";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const admin = useOptionalAdmin();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perfilDrawer, setPerfilDrawer] = useState<DrawerView>(null);
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(null);

  const restaurantId = user?.role === "admin" ? user.restaurant_id ?? null : null;
  const adminLogo = admin?.restaurant ? resolveLogoUrl(admin.restaurant.logo) : null;

  useEffect(() => {
    if (adminLogo) {
      setRestaurantLogoUrl(adminLogo);
      return;
    }
    if (!restaurantId) {
      setRestaurantLogoUrl(null);
      return;
    }

    let cancelled = false;
    void dedupeAsync(`admin:profile:${restaurantId}`, () => restaurantsApi.getProfile(restaurantId))
      .then((profile) => {
        if (!cancelled) setRestaurantLogoUrl(resolveLogoUrl(profile.logo));
      })
      .catch(() => {
        if (!cancelled) setRestaurantLogoUrl(null);
      });

    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ApiRestaurantProfile>).detail;
      if (!detail?.id || detail.id !== restaurantId) return;
      setRestaurantLogoUrl(resolveLogoUrl(detail.logo));
    };
    window.addEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, [restaurantId, adminLogo]);

  if (!user) return null;

  const isDomi = user.role === "domiciliario";
  const avatarSrc =
    restaurantLogoUrl ?? adminLogo ?? resolveLogoUrl(user.avatar) ?? user.avatar ?? undefined;

  const handleLogout = () => {
    navigate({ to: "/" });
    setTimeout(() => {
      void logout();
    }, 0);
  };

  return (
    <>
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
            <UserAvatar name={user.name} src={avatarSrc} className="size-9 sm:size-10" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium leading-tight">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={() => setAccountOpen(true)}
          >
            <User className="size-4" />
            Mi cuenta
          </DropdownMenuItem>
          {isDomi && (
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onSelect={() => setPerfilDrawer("mi-vehiculo")}
            >
              <Bike className="size-4" />
              Mi vehículo
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={() => setSettingsOpen(true)}
          >
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

      <ProfileAccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <ProfileSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {isDomi && <PerfilDrawer open={perfilDrawer} onOpenChange={setPerfilDrawer} />}
    </>
  );
}
