import { CheckSquare, LayoutDashboard, Truck, UserPlus, Users } from "lucide-react";
import { PanelNavMobile, PanelNavSidebar, type PanelNavItem } from "@/components/shared/PanelNav";

export type SuperadminModule = "dashboard" | "approvals" | "users" | "register" | "operations";

export const SUPERADMIN_NAV_ITEMS: PanelNavItem<SuperadminModule>[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { id: "approvals", label: "Aprobaciones", shortLabel: "Aprobaciones", icon: CheckSquare },
  { id: "users", label: "Gestión de usuarios", shortLabel: "Usuarios", icon: Users },
  { id: "register", label: "Registro operativo", shortLabel: "Registro", icon: UserPlus },
  { id: "operations", label: "Seguimiento logístico", shortLabel: "Seguimiento", icon: Truck },
];

const PAGE_TITLES: Record<SuperadminModule, string> = {
  dashboard: "Métricas y visión global",
  approvals: "Cola de aprobaciones",
  users: "Gestión de personal",
  register: "Registro operativo",
  operations: "Seguimiento logístico",
};

export function getSuperadminPageTitle(module: SuperadminModule): string {
  return PAGE_TITLES[module];
}

interface SuperadminNavProps {
  active: SuperadminModule;
  onSelect: (module: SuperadminModule) => void;
  hints: Partial<Record<SuperadminModule, string>>;
}

export function SuperadminNavSidebar(props: SuperadminNavProps) {
  return <PanelNavSidebar items={SUPERADMIN_NAV_ITEMS} {...props} />;
}

export function SuperadminNavMobile(props: SuperadminNavProps) {
  return (
    <PanelNavMobile
      items={SUPERADMIN_NAV_ITEMS}
      sheetTitle="Gobernanza"
      sheetSubtitle="BurgerCore"
      {...props}
    />
  );
}
