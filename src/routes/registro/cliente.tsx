import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  AuthFormAlert,
  AuthFormField,
  AuthFormSelect,
  AuthInlineLink,
  AuthLayout,
  AuthLinkRow,
  validatePassword,
  validatePhone,
} from "@/components/auth/AuthLayout";
import { UseCurrentLocationButton } from "@/components/auth/UseCurrentLocationButton";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api/endpoints/auth";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import { getRoleHomePath } from "@/lib/auth/roleRoutes";
import { persistClientAddress } from "@/lib/clientAddressStorage";
import { persistClientComuna } from "@/lib/clientComunaStorage";
import { useCatalog } from "@/context/CatalogContext";
import { inferComunaFromAddress } from "@/lib/geolocationAddress";

export const Route = createFileRoute("/registro/cliente")({
  head: () => ({
    meta: [{ title: "FFCore — Registro cliente" }],
  }),
  component: RegisterClientPage,
});

function RegisterClientPage() {
  const { setSession } = useAuth();
  const { comunas } = useCatalog();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    comuna: "",
    address: "",
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationApprox, setLocationApprox] = useState(false);
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
    if (!form.comuna) {
      clientErrors.comuna = "Selecciona tu comuna";
    }
    if (!form.address.trim()) {
      clientErrors.address = "Indica tu dirección o usa tu ubicación actual";
    }

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
        comuna: form.comuna,
      });
      const sessionUser = {
        ...response.user,
        comuna: response.user.comuna ?? form.comuna,
      };
      persistClientComuna(sessionUser.id, sessionUser.comuna ?? form.comuna);
      persistClientAddress(
        sessionUser.id,
        form.address.trim(),
        locationCoords ?? undefined,
      );
      setSession(response.token, sessionUser);
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
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="address" className="text-xs font-medium">
              Dirección de entrega
            </label>
            <UseCurrentLocationButton
              onResolved={(loc) => {
                const fromAddress = inferComunaFromAddress(loc.address);
                setForm((prev) => ({
                  ...prev,
                  address: loc.address,
                  comuna: loc.comuna ?? fromAddress ?? prev.comuna,
                }));
                setLocationCoords({ lat: loc.lat, lng: loc.lng });
                setLocationApprox(loc.approximate);
                setLocationError(null);
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.address;
                  if (loc.comuna || fromAddress) delete next.comuna;
                  return next;
                });
                setFormError(null);
              }}
              onError={(message) => {
                setLocationError(message || null);
                setLocationApprox(false);
                if (message) setFormError(message);
              }}
            />
          </div>
          <input
            id="address"
            name="address"
            value={form.address}
            required
            onChange={(e) => {
              const value = e.target.value;
              const inferred = inferComunaFromAddress(value);
              setForm((prev) => ({
                ...prev,
                address: value,
                ...(inferred ? { comuna: inferred } : {}),
              }));
              setLocationError(null);
              setLocationApprox(false);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.address;
                if (inferred) delete next.comuna;
                return next;
              });
            }}
            placeholder="Ej. Cll 4 #12-45 San Martín, Cúcuta"
            className={`w-full rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-primary/20 ${
              fieldErrors.address || locationError ? "border-destructive" : "border-border"
            }`}
          />
          {locationError ? (
            <p className="mt-1 text-xs text-destructive">{locationError}</p>
          ) : locationApprox && form.address ? (
            <p className="mt-1 text-[11px] text-amber-700">
              Zona aproximada (sin GPS preciso). Completa calle y número, ej.{" "}
              <span className="font-medium">Cll 4 #12-45 San Martín</span>.
            </p>
          ) : form.address ? (
            <p className="mt-1 text-[11px] text-emerald-700">
              Dirección detectada: puedes editarla si hace falta.
              {form.comuna ? ` Comuna sugerida: ${form.comuna}.` : ""}
            </p>
          ) : fieldErrors.address ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.address}</p>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Si escribes el barrio (ej. San Martín), la comuna se sugiere sola. También puedes usar el botón de ubicación.
            </p>
          )}
        </div>
        <AuthFormSelect
          label="Comuna"
          name="comuna"
          value={form.comuna}
          onChange={update("comuna")}
          optionItems={comunas.map((c) => ({ value: c.code, label: c.label }))}
          placeholder="Selecciona tu comuna"
          error={fieldErrors.comuna}
          required
        />
        <p className="-mt-2 text-[11px] text-muted-foreground">
          Se rellena al usar ubicación o al reconocer el barrio en la dirección; puedes cambiarla.
        </p>
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
