import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { usersMock, type MockUser, type Role } from "@/mocks/usersMock";
import { useOrders } from "@/context/OrderContext";

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
  const [users, setUsers] = useState<MockUser[]>(usersMock);
  
  // Estado para la tabla de usuarios
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

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

  // Usuarios pendientes (para la Cola de Aprobación)
  const pendingUsers = useMemo(() => users.filter((u) => u.status === "Pendiente"), [users]);

  // Acciones (mocks temporales)
  const toggleStatus = (id: string) =>
    setUsers((arr) =>
      arr.map((u) =>
        u.id === id ? { ...u, status: u.status === "Activo" ? "Suspendido" : "Activo" } : u,
      ),
    );

  const approveUser = (id: string) => 
    setUsers((arr) => arr.map((u) => u.id === id ? { ...u, status: "Activo" } : u));
    
  const rejectUser = (id: string) => 
    setUsers((arr) => arr.map((u) => u.id === id ? { ...u, status: "Rechazado" } : u));

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
          <NewUserForm />
          <SystemStatus />
        </section>
      </main>
    </div>
  );
}