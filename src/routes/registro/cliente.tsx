import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AuthFormAlert,
  AuthFormField,
  AuthInlineLink,
  AuthLayout,
  AuthLinkRow,
  validatePassword,
  validatePhone,
} from "@/components/auth/AuthLayout";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/endpoints/auth";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import { getRoleHomePath } from "@/lib/auth/roleRoutes";

export const Route = createFileRoute("/registro/cliente")({
  head: () => ({
    meta: [{ title: "FFCore — Registro cliente" }],
  }),
  component: RegisterClientPage,
});

function RegisterClientPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};
    const passwordError = validatePassword(form.password);
    if (passwordError) clientErrors.password = passwordError;
    if (form.password !== form.password_confirmation) {
      clientErrors.password_confirmation = "Las contraseñas no coinciden";
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) clientErrors.phone = phoneError;

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.registerClient({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone.trim(),
      });
      setSession(response.token, response.user);
      navigate({ to: getRoleHomePath(response.user.role) });
    } catch (err) {
      const mapped = mapApiErrorToForm(err);
      if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
      if (mapped.formError) setFormError(mapped.formError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Registro"
      title="Crear cuenta de cliente"
      subtitle="Regístrate para pedir comida y hacer seguimiento de tus órdenes."
      footer={
        <AuthLinkRow>
          ¿Ya tienes cuenta? <AuthInlineLink to="/login/cliente">Inicia sesión</AuthInlineLink>
        </AuthLinkRow>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormField
          label="Nombre completo"
          name="name"
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name}
          required
        />
        <AuthFormField
          label="Correo"
          name="email"
          type="email"
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email}
          required
        />
        <AuthFormField
          label="Teléfono"
          name="phone"
          value={form.phone}
          onChange={update("phone")}
          placeholder="+57 300 000 0000"
          error={fieldErrors.phone}
          required
        />
        <AuthFormField
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password}
          required
        />
        <AuthFormField
          label="Confirmar contraseña"
          name="password_confirmation"
          type="password"
          value={form.password_confirmation}
          onChange={update("password_confirmation")}
          error={fieldErrors.password_confirmation}
          required
        />
        {formError && <AuthFormAlert message={formError} />}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? "Creando cuenta…" : "Registrarme"}
        </button>
      </form>
    </AuthLayout>
  );
}
