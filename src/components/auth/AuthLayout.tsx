import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/shared/BrandLogo";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  logoLink?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroEyebrow?: string;
}

const DEFAULT_HERO = {
  eyebrow: "FFCore · Sistema integral",
  title: "Una sola plataforma. Cuatro flujos operativos sincronizados.",
  description:
    "Gestiona el ciclo completo —catálogo, comanda, cocina y entrega— desde vistas dedicadas para cliente, restaurante, gobernanza y domiciliario.",
};

export function AuthLayout({
  title,
  subtitle,
  eyebrow = "Acceso al Sistema",
  children,
  footer,
  logoLink = "/login/cliente",
  heroTitle = DEFAULT_HERO.title,
  heroDescription = DEFAULT_HERO.description,
  heroEyebrow = DEFAULT_HERO.eyebrow,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-screen-2xl grid-cols-1 lg:grid-cols-12">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-cream lg:col-span-6 lg:flex">
          <BrandLogo size="lg" variant="light" linkTo={logoLink} />

          <div className="relative z-10 max-w-lg">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-amber-brand">
              {heroEyebrow}
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-pretty text-sm leading-relaxed text-cream/70">
              {heroDescription}
            </p>
          </div>

          <p className="relative z-10 text-[11px] uppercase tracking-widest text-cream/40">
            Cúcuta · CO
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

        <section className="flex items-center justify-center p-4 sm:p-8 lg:col-span-6 lg:p-12">
          <div className="w-full max-w-md">
            <header className="mb-6 sm:mb-8">
              <div className="mb-6 lg:hidden">
                <BrandLogo size="md" linkTo={logoLink} />
              </div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                {eyebrow}
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </header>

            {children}

            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}

interface AuthFormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function AuthFormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required,
}: AuthFormFieldProps) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20 ${
            isPassword ? "pr-11" : ""
          } ${error ? "border-destructive" : "border-border"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AuthFormAlert({ message, variant = "error" }: { message: string; variant?: "error" | "success" }) {
  const styles =
    variant === "success"
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-destructive/10 text-destructive";

  return <p className={`rounded-lg px-3 py-2 text-xs ${styles}`}>{message}</p>;
}

export function AuthLinkRow({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function AuthInlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "Debe incluir al menos una letra";
  if (!/\d/.test(password)) return "Debe incluir al menos un número";
  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "Teléfono inválido (mínimo 10 dígitos)";
  return null;
}

interface AuthFormSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options?: readonly string[];
  optionItems?: Array<{ value: string; label: string }>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function AuthFormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  optionItems,
  placeholder = "Seleccionar…",
  error,
  required,
  disabled = false,
}: AuthFormSelectProps) {
  const items =
    optionItems ??
    options.map((option) => ({
      value: option,
      label: option,
    }));

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? "border-destructive" : "border-border"
        } ${!value ? "text-muted-foreground" : ""}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export type AuthSelectGroup = {
  label: string;
  options: Array<{ value: string; label: string }>;
};

interface AuthFormSelectGroupedProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  groups: AuthSelectGroup[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

export function AuthFormSelectGrouped({
  label,
  name,
  value,
  onChange,
  groups,
  placeholder = "Seleccionar…",
  error,
  required,
  disabled = false,
  hint,
}: AuthFormSelectGroupedProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          error ? "border-destructive" : "border-border"
        } ${!value ? "text-muted-foreground" : ""}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint && !error && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
