import { useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, User, Bike } from "lucide-react";
import { useState } from "react";
import { PerfilDrawer } from "@/components/domiciliario/PerfilDrawer";
import type { DrawerView } from "@/components/domiciliario/PerfilDrawer";
import { ProfileAccountDialog } from "@/components/shared/ProfileAccountDialog";
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
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perfilDrawer, setPerfilDrawer] = useState<DrawerView>(null);

  if (!user) return null;

  const isDomi = user.role === "domiciliario";

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
            <UserAvatar name={user.name} src={user.avatar ?? undefined} className="size-9 sm:size-10" />
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
