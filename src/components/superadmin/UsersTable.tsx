import { type MockUser, type Role } from "@/mocks/usersMock";

const roleLabel: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

interface UsersTableProps {
  users: MockUser[];
  query: string;
  setQuery: (q: string) => void;
  roleFilter: Role | "todos";
  setRoleFilter: (r: Role | "todos") => void;
  toggleStatus: (id: string) => void;
}

export function UsersTable({
  users,
  query,
  setQuery,
  roleFilter,
  setRoleFilter,
  toggleStatus,
}: UsersTableProps) {
  
  const filtered = users.filter((u) => {
    if (roleFilter !== "todos" && u.role !== roleFilter) return false;
    if (query && !`${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-display text-base font-semibold sm:text-lg">Gestión de usuarios</h2>
          <p className="text-xs text-muted-foreground">
            Da de alta, suspende o edita roles del ecosistema.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-56"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "todos")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs sm:w-auto"
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
  );
}
