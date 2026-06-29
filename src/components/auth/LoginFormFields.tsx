import { Link } from "@tanstack/react-router";
import { AuthFormAlert, AuthFormField } from "@/components/auth/AuthLayout";

type LoginFormFieldsProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  emailPlaceholder?: string;
  submitLabel?: string;
};

export function LoginFormFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  error,
  submitting,
  onSubmit,
  emailPlaceholder = "tu@correo.com",
  submitLabel = "Iniciar sesión",
}: LoginFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthFormField
        label="Correo"
        name="email"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder={emailPlaceholder}
        required
      />
      <AuthFormField
        label="Contraseña"
        name="password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="••••••••"
        required
      />
      {error && <AuthFormAlert message={error} />}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? "Ingresando…" : submitLabel}
      </button>
    </form>
  );
}

export function AuthPromoBanner({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-secondary/60 to-card p-4">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Link
        to={actionTo}
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
