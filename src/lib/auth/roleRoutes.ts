import type { Role } from "@/lib/api/types";

export const roleRoutes: Record<Role, string> = {
  cliente: "/cliente",
  admin: "/admin",
  superadmin: "/superadmin",
  domiciliario: "/domiciliario",
};

export const loginRoutes: Record<Role, string> = {
  cliente: "/login/cliente",
  admin: "/login/equipo",
  superadmin: "/login/gobernanza",
  domiciliario: "/login/equipo",
};

export function getRoleHomePath(role: Role): string {
  return roleRoutes[role];
}

export function getLoginPathForRole(role?: Role | null): string {
  if (!role) return "/login/cliente";
  return loginRoutes[role];
}
