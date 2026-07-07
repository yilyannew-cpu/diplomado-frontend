import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getRoleHomePath } from "@/lib/auth/roleRoutes";
import type { Role } from "@/lib/api/types";
import { BrandLogo } from "@/components/shared/BrandLogo";

export const Route = createFileRoute("/")(
{
  component: LoginPage,
});

const quickRoles: Array<{ role: Role; label: string; tag: string; hint: string }> = [
  { role: "cliente", label: "Cliente", tag: "01", hint: "Catálogo, carrito y tracking" },
  { role: "admin", label: "Admin Restaurante", tag: "02", hint: "Kanban de cocina + menú" },
  { role: "superadmin", label: "Superadmin", tag: "03", hint: "Métricas y usuarios" },
  { role: "domiciliario", label: "Domiciliario", tag: "04", hint: "Mobile · entregas" },
];

function LoginPage() {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuick = (role: Role) => {
    const u = quickLogin(role);
    navigate({ to: getRoleHomePath(u.role) });
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 lg:grid-cols-12">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-cream lg:col-span-6 lg:flex">
          <BrandLogo size="lg" variant="light" linkTo="/" />

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
            FFCore · Cúcuta — Prototipo
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
        <section className="flex items-center justify-center p-4 sm:p-8 lg:col-span-6 lg:p-12">
          <div className="w-full max-w-md">
            <header className="mb-6 sm:mb-8">
              <div className="mb-6 lg:hidden">
                <BrandLogo size="md" linkTo="/" />
              </div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                Acceso al Sistema
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Bienvenido de vuelta
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Selecciona un acceso rápido para ingresar al sistema.
              </p>
            </header>

            <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mb-8">
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

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              Tip: cada botón inyecta un usuario de prueba instantáneamente.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
