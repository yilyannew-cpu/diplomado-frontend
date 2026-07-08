import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { RoleGuard } from "@/components/shared/RoleShell";
import { useOrders } from "@/context/OrderContext";
import { toast } from "sonner";

// API
import { usersApi } from "@/lib/api/endpoints/users";
import { type User, type PendingUser, type Role } from "@/lib/api/types";

// Componentes modulares
import { SuperadminSidebar, type SuperadminModule } from "@/components/superadmin/SuperadminSidebar";
import { SuperadminMetrics } from "@/components/superadmin/SuperadminMetrics";
import { ApprovalQueue } from "@/components/superadmin/ApprovalQueue";
import { UsersTable } from "@/components/superadmin/UsersTable";
import { NewUserForm } from "@/components/superadmin/NewUserForm";
import { SystemStatus } from "@/components/superadmin/SystemStatus";

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
  const { orders } = useOrders();
  
  // Estado global de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  
  // Navigation State
  const [activeModule, setActiveModule] = useState<SuperadminModule>("dashboard");

  // Estado para la tabla de usuarios
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

  const loadData = async () => {
    try {
      const [allUsers, pending] = await Promise.all([
        usersApi.list(),
        usersApi.listPending()
      ]);
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (error) {
      toast.error("Error al cargar los usuarios desde el servidor");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = useMemo(
    () => ({
      cliente: users.filter((u) => u.role === "cliente").length,
      admin: users.filter((u) => u.role === "admin").length,
      domiciliario: users.filter((u) => u.role === "domiciliario").length,
    }),
    [users],
  );
  const sales = orders.reduce((a, o) => a + o.total, 0);

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
    <div className="flex h-screen overflow-hidden bg-cream/50">
      <SuperadminSidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        pendingCount={pendingUsers.length} 
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-cream/80 backdrop-blur-md border-b border-border/50 px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Módulo de Gobernanza
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight capitalize">
              {activeModule === 'dashboard' ? 'Métricas y Visión Global' : 
               activeModule === 'approvals' ? 'Cola de Aprobaciones' :
               activeModule === 'users' ? 'Gestión de Personal' : 
               activeModule === 'register' ? 'Registro Operativo' :
               'Seguimiento Logístico'}
            </h2>
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {activeModule === "dashboard" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SuperadminMetrics counts={counts} sales={sales} />
              {/* Aquí luego añadiremos las pestañas de Resumen e Histórico */}
              <SystemStatus />
            </div>
          )}

          {activeModule === "approvals" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Pestañas (mock visual por ahora) */}
              <div className="flex items-center gap-4 border-b border-border mb-6">
                <button className="border-b-2 border-primary pb-3 px-1 text-sm font-semibold text-foreground">
                  Restaurantes & Domiciliarios
                </button>
                <button className="border-b-2 border-transparent pb-3 px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Historial de Rechazos
                </button>
              </div>
              <ApprovalQueue pendingUsers={pendingUsers} approveUser={approveUser} rejectUser={rejectUser} />
            </div>
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

          {activeModule === "operations" && (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <p className="text-muted-foreground">Módulo operativo en desarrollo</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Aquí vendrán métricas en tiempo real</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}