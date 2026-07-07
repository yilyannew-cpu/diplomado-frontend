import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import {
  AuthInlineLink,
  AuthLayout,
  AuthLinkRow,
} from "@/components/auth/AuthLayout";
import { LoginFormFields } from "@/components/auth/LoginFormFields";
import { usePortalLogin } from "@/components/auth/usePortalLogin";

export const Route = createFileRoute("/login/gobernanza")({
  head: () => ({
    meta: [{ title: "FFCore — Gobernanza" }],
  }),
  component: GovernanceLoginPage,
});

function GovernanceLoginPage() {
  const { email, setEmail, password, setPassword, error, submitting, isLoading, handleLogin } =
    usePortalLogin(["superadmin"]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  return (
    <AuthLayout
      eyebrow="Gobernanza corporativa"
      title="Consola superadmin"
      subtitle="Acceso restringido para administración global, usuarios y aprobaciones."
      logoLink="/login/gobernanza"
      heroEyebrow="FFCore · Gobernanza"
      heroTitle="Control total del ecosistema."
      heroDescription="Supervisa métricas, aprueba registros y administra usuarios de toda la plataforma."
      footer={
        <AuthLinkRow>
          <AuthInlineLink to="/login/equipo">← Volver al portal operativo</AuthInlineLink>
        </AuthLinkRow>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-brand/30 bg-amber-brand/10 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-cream">
          <Shield className="size-5" />
        </div>
        <p className="text-xs text-muted-foreground">
          Solo cuentas con rol <span className="font-semibold text-foreground">superadmin</span> pueden
          ingresar a este portal.
        </p>
      </div>

      <LoginFormFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        error={error}
        submitting={submitting}
        onSubmit={handleLogin}
        submitLabel="Entrar a gobernanza"
      />
    </AuthLayout>
  );
}
