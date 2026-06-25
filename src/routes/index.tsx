import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/mocks/usersMock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BurgerCore — Acceso al Sistema" },
      { name: "description", content: "Login universal multirrol: cliente, admin, superadmin y domiciliario." },
      { property: "og:title", content: "BurgerCore — Acceso al Sistema" },
      { property: "og:description", content: "Prototipo no funcional multirrol para gestión de comandas y entregas." },
    ],
  }),
  component: LoginPage,
});

const roleRoutes: Record<Role, string> = {
  cliente: "/cliente",
  admin: "/admin",
  superadmin: "/superadmin",
  domiciliario: "/domiciliario",
};

const quickRoles: Array<{ role: Role; label: string; tag: string; hint: string }> = [
  { role: "cliente", label: "Cliente", tag: "01", hint: "Catálogo, carrito y tracking" },
  { role: "admin", label: "Admin Restaurante", tag: "02", hint: "Kanban de cocina + menú" },
  { role: "superadmin", label: "Superadmin", tag: "03", hint: "Métricas y usuarios" },
  { role: "domiciliario", label: "Domiciliario", tag: "04", hint: "Mobile · entregas" },
];

function LoginPage() {
  const { user, login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: roleRoutes[user.role] });
  }, [user, navigate]);

  const handleQuick = (role: Role) => {
    const u = quickLogin(role);
    navigate({ to: roleRoutes[u.role] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(email, password);
    if (!u) {
      setError("Credenciales inválidas. Prueba uno de los accesos rápidos.");
      return;
    }
    navigate({ to: roleRoutes[u.role] });
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 lg:grid-cols-12">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-cream lg:col-span-6 lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground font-display text-xl font-semibold">
              B
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">BurgerCore</span>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-amber-brand">
              Sistema integral · v2.4
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance">
              Una sola plataforma. Cuatro flujos operativos sincronizados.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-sm leading-relaxed text-cream/70">
              Gestiona el ciclo completo —catálogo, comanda, cocina y entrega— desde
              vistas dedicadas para cliente, restaurante, gobernanza y domiciliario.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 text-xs">
              {[
                { k: "Roles", v: "4 perfiles" },
                { k: "Estado", v: "Reactivo en vivo" },
                { k: "Stack", v: "React · Vite · Tailwind" },
                { k: "Arquitectura", v: "Clean (UI / Context / Mocks)" },
              ].map((kv) => (
                <div
                  key={kv.k}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-[10px] uppercase tracking-widest text-cream/50">
                    {kv.k}
                  </p>
                  <p className="mt-1 font-medium text-cream">{kv.v}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[11px] uppercase tracking-widest text-cream/40">
            Medellín · CO — Prototipo no funcional
          </p>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-32 size-[480px] rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-12 size-[260px] rounded-full bg-amber-brand/30 blur-3xl"
          />
        </aside>

        {/* Form panel */}
        <section className="flex items-center justify-center p-6 sm:p-12 lg:col-span-6">
          <div className="w-full max-w-md">
            <header className="mb-8">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                Acceso al Sistema
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Bienvenido de vuelta
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Selecciona un acceso rápido o ingresa con tus credenciales.
              </p>
            </header>

            <div className="mb-8 grid grid-cols-2 gap-3">
              {quickRoles.map((q) => (
                <button
                  key={q.role}
                  type="button"
                  onClick={() => handleQuick(q.role)}
                  className="group flex flex-col items-start rounded-2xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    {q.tag}
                  </span>
                  <span className="mt-1 font-semibold leading-tight">{q.label}</span>
                  <span className="mt-1 text-[11px] text-muted-foreground">{q.hint}</span>
                  <span className="mt-3 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Entrar →
                  </span>
                </button>
              ))}
            </div>

            <div className="relative my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                o con tu cuenta
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium">Correo corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@burgercore.co"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Iniciar sesión
              </button>
            </form>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              Tip: cualquier usuario del mock usa contraseña <code className="rounded bg-secondary px-1 py-0.5">demo</code>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
