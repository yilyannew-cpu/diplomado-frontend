import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AuthInlineLink,
  AuthLayout,
  AuthLinkRow,
} from "@/components/auth/AuthLayout";
import { AuthRolePicker, type TeamRole } from "@/components/auth/AuthRolePicker";
import { LoginFormFields } from "@/components/auth/LoginFormFields";
import { usePortalLogin } from "@/components/auth/usePortalLogin";

export const Route = createFileRoute("/login/equipo")({
  head: () => ({
    meta: [{ title: "FFCore — Portal operativo" }],
  }),
  component: TeamLoginPage,
});

function TeamLoginPage() {
  const [teamRole, setTeamRole] = useState<TeamRole>("admin");
  const { email, setEmail, password, setPassword, error, submitting, isLoading, handleLogin } =
    usePortalLogin(["admin", "domiciliario"]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  return (
    <AuthLayout
      eyebrow="Portal operativo"
      title="Acceso para el equipo"
      subtitle="Restaurantes y domiciliarios: elige tu rol e ingresa con tus credenciales."
      logoLink="/login/equipo"
      heroEyebrow="FFCore · Operaciones"
      heroTitle="Tu sede y tus entregas, bajo control."
      heroDescription="Gestiona comandas, menú, despachos y rutas desde el panel diseñado para tu rol."
      footer={
        <AuthLinkRow>
          ¿Eres cliente? <AuthInlineLink to="/login/cliente">Ir al portal de pedidos</AuthInlineLink>
        </AuthLinkRow>
      }
    >
      <AuthRolePicker value={teamRole} onChange={setTeamRole} />

      <div className="mt-5">
        <LoginFormFields
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          error={error}
          submitting={submitting}
          onSubmit={handleLogin}
          submitLabel={teamRole === "admin" ? "Entrar al panel restaurante" : "Entrar al panel domiciliario"}
        />
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Link
          to="/registro/restaurante"
          className="rounded-xl border border-border bg-card px-4 py-3 text-center text-xs font-semibold hover:bg-secondary"
        >
          Registrar restaurante
        </Link>
        <Link
          to="/registro/domiciliario"
          className="rounded-xl border border-border bg-card px-4 py-3 text-center text-xs font-semibold hover:bg-secondary"
        >
          Postularse como domiciliario
        </Link>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        ¿Acceso de gobernanza?{" "}
        <AuthInlineLink to="/login/gobernanza">Portal superadmin</AuthInlineLink>
      </p>
    </AuthLayout>
  );
}
