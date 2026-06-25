import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { usersMock, type MockUser, type Role } from "@/mocks/usersMock";
import { useOrders, formatCOP } from "@/context/OrderContext";

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

const roleLabel: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

function SuperadminView() {
  const { orders } = useOrders();
  const [users, setUsers] = useState<MockUser[]>(usersMock);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "todos">("todos");

  const counts = useMemo(
    () => ({
      cliente: users.filter((u) => u.role === "cliente").length,
      admin: users.filter((u) => u.role === "admin").length,
      domiciliario: users.filter((u) => u.role === "domiciliario").length,
    }),
    [users],
  );

  const sales = orders.reduce((a, o) => a + o.total, 0);

  const filtered = users.filter((u) => {
    if (roleFilter !== "todos" && u.role !== roleFilter) return false;
    if (query && !`${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = (id: string) =>
    setUsers((arr) =>
      arr.map((u) =>
        u.id === id ? { ...u, status: u.status === "Activo" ? "Suspendido" : "Activo" } : u,
      ),
    );

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Consola global" subtitle="Gobernanza del ecosistema BurgerCore" />

      <main className="mx-auto max-w-screen-2xl space-y-8 px-6 py-10">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
            Gobernanza
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Métricas y gestión de personal
          </h1>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Ventas hoy" value={formatCOP(sales)} delta="+12% vs ayer" tone="primary" />
          <MetricCard label="Clientes registrados" value={String(counts.cliente)} delta="Activos en plataforma" />
          <MetricCard label="Admins activos" value={String(counts.admin)} delta={`${counts.admin} sedes operando`} />
          <MetricCard label="Domiciliarios" value={String(counts.domiciliario)} delta="En ruta o disponibles" tone="amber" />
        </section>

        {/* Users table */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Gestión de usuarios</h2>
              <p className="text-xs text-muted-foreground">
                Da de alta, suspende o edita roles del ecosistema.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="w-56 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | "todos")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
              >
                <option value="todos">Todos los roles</option>
                <option value="cliente">Clientes</option>
                <option value="admin">Admins</option>
                <option value="domiciliario">Domiciliarios</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3">Contacto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-full bg-ink text-xs font-semibold text-cream">
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">{roleLabel[u.role]}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {u.phone ?? "—"}
                      {u.vehicle && <span className="block text-[10px] text-muted-foreground/80">{u.vehicle}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className={`size-1.5 rounded-full ${u.status === "Activo" ? "bg-emerald-500" : "bg-destructive"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-secondary"
                      >
                        {u.status === "Activo" ? "Suspender" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* New user form */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Registro corporativo</h2>
            <p className="mb-5 text-xs text-muted-foreground">
              Da de alta nuevos empleados con sus credenciales de acceso al sistema.
            </p>
            <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
              <Field label="Nombre completo" placeholder="Ej. María Restrepo" />
              <Field label="Correo corporativo" placeholder="usuario@burgercore.co" />
              <Field label="Teléfono" placeholder="+57 300 000 0000" />
              <Field label="Placa / vehículo" placeholder="Opcional para domiciliarios" />
              <div>
                <span className="mb-1.5 block text-xs font-medium">Rol asignado</span>
                <select className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
                  <option>Cliente</option>
                  <option>Admin Restaurante</option>
                  <option>Domiciliario</option>
                </select>
              </div>
              <Field label="Contraseña temporal" placeholder="********" type="password" />
              <div className="md:col-span-2 flex justify-end">
                <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                  Crear cuenta
                </button>
              </div>
            </form>
          </div>
          <aside className="rounded-2xl bg-ink p-6 text-cream">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
              Estado del sistema
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold">Todo operando</h3>
            <p className="mt-1 text-xs text-cream/60">Última sincronización hace 24 segundos</p>
            <ul className="mt-5 space-y-3 text-xs">
              <StatusLine label="API de pedidos" status="ok" />
              <StatusLine label="Pasarela de pago" status="ok" />
              <StatusLine label="Notificaciones push" status="warn" />
              <StatusLine label="Mapas y rutas" status="ok" />
            </ul>
          </aside>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value, delta, tone = "default" }: { label: string; value: string; delta?: string; tone?: "default" | "primary" | "amber" }) {
  const accent =
    tone === "primary"
      ? "border-primary/20 bg-primary/5"
      : tone === "amber"
        ? "border-amber-brand/30 bg-amber-brand/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-2xl border ${accent} p-5`}>
      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {delta && <p className="mt-1 text-[11px] text-muted-foreground">{delta}</p>}
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function StatusLine({ label, status }: { label: string; status: "ok" | "warn" }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-cream/80">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${status === "ok" ? "bg-emerald-400" : "bg-amber-brand"}`} />
        <span className={status === "ok" ? "text-emerald-300" : "text-amber-brand"}>
          {status === "ok" ? "Operativo" : "Degradado"}
        </span>
      </span>
    </li>
  );
}