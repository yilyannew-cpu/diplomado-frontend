import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import {
  AuthInlineLink,
  AuthLayout,
  AuthLinkRow,
} from "@/components/auth/AuthLayout";
import { AuthPromoBanner, LoginFormFields } from "@/components/auth/LoginFormFields";
import { usePortalLogin } from "@/components/auth/usePortalLogin";

export const Route = createFileRoute("/login/cliente")({
  head: () => ({
    meta: [{ title: "FFCore — Iniciar sesión · Clientes" }],
  }),
  component: ClientLoginPage,
});

function ClientLoginPage() {
  const { email, setEmail, password, setPassword, error, submitting, isLoading, handleLogin } =
    usePortalLogin(["cliente"]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  return (
    <AuthLayout
      eyebrow="Portal cliente"
      title="¡Qué bueno verte de nuevo!"
      subtitle="Inicia sesión para pedir, pagar y hacer seguimiento de tus órdenes."
      logoLink="/login/cliente"
      heroEyebrow="FFCore · Para clientes"
      heroTitle="¿Tienes hambre? Pide en minutos."
      heroDescription="Explora el menú, arma tu pedido y sigue la entrega en tiempo real desde un solo lugar."
      footer={
        <AuthLinkRow>
          ¿Primera vez aquí?{" "}
          <AuthInlineLink to="/registro/cliente">Crea tu cuenta gratis</AuthInlineLink>
        </AuthLinkRow>
      }
    >
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <UtensilsCrossed className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">¿Aún no tienes cuenta?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Regístrate en segundos y pide tu comida favorita sin complicaciones.
          </p>
        </div>
      </div>

      <LoginFormFields
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        error={error}
        submitting={submitting}
        onSubmit={handleLogin}
        submitLabel="Entrar y pedir"
      />

      <AuthPromoBanner
        title="¿Trabajas con nosotros?"
        description="Accede al portal de restaurantes y domiciliarios para operar tu sede o tus entregas."
        actionLabel="Ir al portal operativo"
        actionTo="/login/equipo"
      />
    </AuthLayout>
  );
}
