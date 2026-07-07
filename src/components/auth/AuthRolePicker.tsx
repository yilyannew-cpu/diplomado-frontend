import { Building2, Bike, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TeamRole = "admin" | "domiciliario";

type RoleOption = {
  id: TeamRole;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const TEAM_ROLES: RoleOption[] = [
  {
    id: "admin",
    label: "Restaurante",
    hint: "Administra sede, menú y cocina",
    icon: Building2,
  },
  {
    id: "domiciliario",
    label: "Domiciliario",
    hint: "Gestiona entregas en ruta",
    icon: Bike,
  },
];

export function AuthRolePicker({
  value,
  onChange,
  error,
}: {
  value: TeamRole;
  onChange: (role: TeamRole) => void;
  error?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium">Tipo de acceso</p>
      <div className="grid grid-cols-2 gap-3">
        {TEAM_ROLES.map((role) => {
          const selected = value === role.id;
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                selected
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-secondary/40",
              )}
            >
              <div
                className={cn(
                  "mb-3 grid size-10 place-items-center rounded-xl",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                )}
              >
                <Icon className="size-5" />
              </div>
              <p className="text-sm font-semibold">{role.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{role.hint}</p>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}