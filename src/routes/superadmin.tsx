import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { useOrders } from "@/context/OrderContext";
import { toast } from "sonner";

// API
import { usersApi } from "@/lib/api/endpoints/users";
import { type User, type PendingUser, type Role } from "@/lib/api/types";

// Componentes modulares del dashboard
import { SuperadminMetrics } from "@/components/superadmin/SuperadminMetrics";
import { ApprovalQueue } from "@/components/superadmin/ApprovalQueue";
import { UsersTable } from "@/components/superadmin/UsersTable";
import { NewUserForm } from "@/components/superadmin/NewUserForm";
import { SystemStatus } from "@/components/superadmin/SystemStatus";

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
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  
  // Estado para la tabla de usuarios
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

  // Fetch data
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

  // Métricas
  const counts = useMemo(
    () => ({
      cliente: users.filter((u) => u.role === "cliente").length,
      admin: users.filter((u) => u.role === "admin").length,
      domiciliario: users.filter((u) => u.role === "domiciliario").length,
    }),
    [users],
  );
  const sales = orders.reduce((a, o) => a + o.total, 0);

  // Acciones conectadas a la API
  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const newStatus = user.status === "Activo" ? "Suspendido" : "Activo";
    
    // Optimistic update
    setUsers((arr) => arr.map((u) => u.id === id ? { ...u, status: newStatus } : u));

    try {
      await usersApi.update(id, { status: newStatus });
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (error: any) {
      toast.error("Error al cambiar estado");
      loadData(); // revert
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
      <TopBar title="Consola global" subtitle="Gobernanza del ecosistema BurgerCore" />

      <main className="page-container space-y-6 sm:space-y-8">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px] sm:tracking-[0.25em]">
            Gobernanza
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Métricas y gestión de personal
          </h1>
        </header>

        {/* 1. Tarjetas de Métricas (KPIs) */}
        <SuperadminMetrics counts={counts} sales={sales} />

        {/* 2. Cola de Aprobación (Nuevo componente visual) */}
        <ApprovalQueue pendingUsers={pendingUsers} approveUser={approveUser} rejectUser={rejectUser} />

        {/* 3. Directorio General de Usuarios */}
        <UsersTable 
          users={users}
          query={query}
          setQuery={setQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          toggleStatus={toggleStatus}
        />

        {/* 4. Formulario de Registro y Estado del Sistema */}
        <section className="grid gap-6 lg:grid-cols-3">
          <NewUserForm onUserCreated={loadData} />
          <SystemStatus />
        </section>
      </main>
    </div>
  );
}