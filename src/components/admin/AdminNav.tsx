import {
  BarChart3,
  Bike,
  ChefHat,
  History,
  LayoutDashboard,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import { PanelNavMobile, PanelNavSidebar, type PanelNavItem } from "@/components/shared/PanelNav";

export type AdminTab =
  | "dashboard"
  | "reportes"
  | "comandas"
  | "menu"
  | "promociones"
  | "domicilios"
  | "historial";

export const ADMIN_NAV_ITEMS: PanelNavItem<AdminTab>[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { id: "reportes", label: "Reportes de ventas", shortLabel: "Reportes", icon: BarChart3 },
  { id: "comandas", label: "Monitor de comandas", shortLabel: "Comandas", icon: ChefHat },
  { id: "menu", label: "Gestor de menú", shortLabel: "Menú", icon: UtensilsCrossed },
  { id: "promociones", label: "Promociones", shortLabel: "Promos", icon: Tag },
  { id: "domicilios", label: "Domicilios activos", shortLabel: "Domicilios", icon: Bike },
  { id: "historial", label: "Historial de despachos", shortLabel: "Historial", icon: History },
];

interface AdminNavProps {
  active: AdminTab;
  onSelect: (tab: AdminTab) => void;
  hints: Partial<Record<AdminTab, string>>;
}

export function AdminNavSidebar(props: AdminNavProps) {
  return <PanelNavSidebar items={ADMIN_NAV_ITEMS} {...props} />;
}

export function AdminNavMobile(props: AdminNavProps) {
  return (
    <PanelNavMobile
      items={ADMIN_NAV_ITEMS}
      sheetTitle="Centro de cocina"
      sheetSubtitle="Sede Caobos"
      {...props}
    />
  );
}
