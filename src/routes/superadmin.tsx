import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { toast } from "sonner";

// API
import { usersApi } from "@/lib/api/endpoints/users";
import { type User, type PendingUser, type Role } from "@/lib/api/types";

// Componentes modulares
import {
  SuperadminNavMobile,
  SuperadminNavSidebar,
  getSuperadminPageTitle,
  type SuperadminModule,
} from "@/components/superadmin/SuperadminNav";
import { SuperadminMetrics } from "@/components/superadmin/SuperadminMetrics";
import { ApprovalsModule } from "@/components/superadmin/ApprovalsModule";
import { UsersTable } from "@/components/superadmin/UsersTable";
import { NewUserForm } from "@/components/superadmin/NewUserForm";
import { SystemStatus } from "@/components/superadmin/SystemStatus";
import { OperationsPanel } from "@/components/superadmin/OperationsPanel";
import { useSuperadminDashboard } from "@/hooks/useSuperadminDashboard";

// import { usersMock, type MockUser } from "@/mocks/usersMock";

// ...

export const Route = createFileRoute("/superadmin")({
  head: () => ({
    meta: [
      { title: "Superadmin · BurgerCore" },
      { name: "description", content: "Gobernanza global: métricas, gestión de usuarios y registro corporativo." },
    ],
  }),
  component: () => (
    <RoleGuard role="superadmin">
      <SuperadminView />
    </RoleGuard>
  ),
});


function SuperadminView() {
  const dashboard = useSuperadminDashboard();

  // Estado global de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<SuperadminModule>("dashboard");

  // Estado para la tabla de usuarios
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

  const loadData = async () => {
    const [pendingResult, usersResult] = await Promise.allSettled([
      usersApi.listPending(),
      usersApi.list(),
    ]);

    if (pendingResult.status === "fulfilled") {
      setPendingUsers(
        pendingResult.value.filter(
          (user) =>
            (user.role === "admin" || user.role === "domiciliario") &&
            user.status === "Pendiente",
        ),
      );
    } else {
      toast.error("Error al cargar solicitudes pendientes");
    }

    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value);
    } else {
      toast.error("Error al cargar la lista de usuarios");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clientCount = useMemo(
    () => users.filter((u) => u.role === "cliente").length,
    [users],
  );

  const navHints = useMemo(
    () => ({
      dashboard: "Métricas y sistema",
      approvals:
        pendingUsers.length > 0
          ? `${pendingUsers.length} pendiente${pendingUsers.length === 1 ? "" : "s"}`
          : "Cola vacía",
      users: `${users.length} registrados`,
      register: "Alta operativa",
      operations: "Pedidos en curso",
    }),
    [pendingUsers.length, users.length],
  );

  useEffect(() => {
    if (dashboard.error) {
      toast.error(dashboard.error);
    }
  }, [dashboard.error]);

  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const newStatus = user.status === "Activo" ? "Suspendido" : "Activo";
    setUsers((arr) => arr.map((u) => u.id === id ? { ...u, status: newStatus } : u));

    try {
      await usersApi.update(id, { status: newStatus });
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (error: any) {
      toast.error("Error al cambiar estado");
      loadData();
    }
  };

  const approveUser = async (id: string) => {
    try {
      await usersApi.approve(id);
      toast.success("Usuario aprobado exitosamente");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al aprobar usuario");
    }
  };
    
  const rejectUser = async (id: string) => {
    try {
      await usersApi.reject(id, "Rechazado por el administrador");
      toast.success("Usuario rechazado exitosamente");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al rechazar usuario");
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Gobernanza" subtitle="Control global de la plataforma" />

      <div className="page-container flex flex-col gap-6 lg:flex-row lg:gap-8">
        <SuperadminNavSidebar
          active={activeModule}
          onSelect={setActiveModule}
          hints={navHints}
        />

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex min-w-0 items-start gap-3 lg:mb-8">
            <SuperadminNavMobile
              active={activeModule}
              onSelect={setActiveModule}
              hints={navHints}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:tracking-[0.25em]">
                BurgerCore
              </p>
              <h1 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
                {getSuperadminPageTitle(activeModule)}
              </h1>
            </div>
          </div>

          <div className="space-y-8">
          {activeModule === "dashboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SuperadminMetrics
                metrics={dashboard.metrics}
                clientCount={clientCount}
                loading={dashboard.loading}
              />
              <SystemStatus system={dashboard.system} loading={dashboard.loading} />
            </div>
          )}

          {activeModule === "approvals" && (
            <ApprovalsModule
              pendingUsers={pendingUsers}
              approveUser={approveUser}
              rejectUser={rejectUser}
            />
          )}

          {activeModule === "users" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UsersTable 
                users={users}
                query={query}
                setQuery={setQuery}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                toggleStatus={toggleStatus}
              />
            </div>
          )}

          {activeModule === "register" && (
            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NewUserForm onUserCreated={loadData} />
            </div>
          )}

          {activeModule === "operations" && <OperationsPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}