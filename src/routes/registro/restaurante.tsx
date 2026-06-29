import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { authApi } from "@/lib/api/endpoints/auth";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import {
  formatCityZoneLabel,
  getCitySelectOptions,
  getZonesForCity,
} from "@/lib/data/colombiaLocations";

export const Route = createFileRoute("/registro/restaurante")({
  head: () => ({
    meta: [{ title: "FFCore — Registro restaurante" }],
  }),
  component: RegisterRestaurantPage,
});

function RegisterRestaurantPage() {
  const cityOptions = useMemo(() => getCitySelectOptions(), []);

  const [form, setForm] = useState({
    owner_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    restaurant_name: "",
    tagline: "",
    city_id: "",
    zone: "",
    address: "",
    delivery_minutes: "30",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const zoneOptions = useMemo(
    () => (form.city_id ? getZonesForCity(form.city_id) : []),
    [form.city_id],
  );

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "city_id") next.zone = "";
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === "city_id") delete next.zone;
      return next;
    });
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const clientErrors: Record<string, string> = {};
    const passwordError = validatePassword(form.password);
    if (passwordError) clientErrors.password = passwordError;
    if (form.password !== form.password_confirmation) {
      clientErrors.password_confirmation = "Las contraseñas no coinciden";
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) clientErrors.phone = phoneError;
    if (!form.city_id) clientErrors.city_id = "Selecciona una ciudad";
    if (!form.zone) clientErrors.zone = "Selecciona una zona";

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.registerRestaurant({
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone.trim(),
        restaurant_name: form.restaurant_name.trim(),
        tagline: form.tagline.trim() || undefined,
        city: formatCityZoneLabel(form.city_id, form.zone),
        address: form.address.trim(),
        delivery_minutes: Number(form.delivery_minutes) || 30,
      });
      setSuccessMessage(
        response.message ??
          "Solicitud enviada. Un administrador revisará tu cuenta antes de habilitar el acceso.",
      );
      setForm({
        owner_name: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone: "",
        restaurant_name: "",
        tagline: "",
        city_id: "",
        zone: "",
        address: "",
        delivery_minutes: "30",
      });
    } catch (err) {
      const mapped = mapApiErrorToForm(err);
      if (mapped.fieldErrors) setFieldErrors(mapped.fieldErrors);
      if (mapped.formError) setFormError(mapped.formError);
    } finally {
      setSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <AuthLayout
        eyebrow="Registro"
        title="Solicitud enviada"
        subtitle="Tu registro está pendiente de aprobación por un superadministrador."
        footer={
          <AuthLinkRow>
            <AuthInlineLink to="/login/equipo">Volver al login</AuthInlineLink>
          </AuthLinkRow>
        }
      >
        <AuthFormAlert message={successMessage} variant="success" />
        <p className="mt-4 text-sm text-muted-foreground">
          Recibirás acceso cuando tu cuenta sea aprobada. Mientras tanto no podrás iniciar sesión.
        </p>
        <Link
          to="/login/equipo"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Ir al login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Registro"
      title="Registrar restaurante"
      subtitle="Solicita acceso como administrador de sede. Requiere aprobación del superadmin."
      footer={
        <AuthLinkRow>
          ¿Ya tienes cuenta? <AuthInlineLink to="/login/equipo">Inicia sesión</AuthInlineLink>
        </AuthLinkRow>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthFormField
          label="Nombre del responsable"
          name="owner_name"
          value={form.owner_name}
          onChange={update("owner_name")}
          error={fieldErrors.owner_name}
          required
        />
        <AuthFormField
          label="Correo corporativo"
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
          error={fieldErrors.phone}
          required
        />
        <AuthFormField
          label="Nombre del restaurante"
          name="restaurant_name"
          value={form.restaurant_name}
          onChange={update("restaurant_name")}
          error={fieldErrors.restaurant_name}
          required
        />
        <AuthFormField
          label="Eslogan (opcional)"
          name="tagline"
          value={form.tagline}
          onChange={update("tagline")}
          error={fieldErrors.tagline}
        />
        <AuthFormSelect
          label="Ciudad"
          name="city_id"
          value={form.city_id}
          onChange={update("city_id")}
          optionItems={cityOptions}
          placeholder="Selecciona una ciudad"
          error={fieldErrors.city_id}
          required
        />
        <AuthFormSelect
          label="Zona / barrio"
          name="zone"
          value={form.zone}
          onChange={update("zone")}
          options={zoneOptions}
          placeholder={form.city_id ? "Selecciona una zona" : "Primero elige una ciudad"}
          error={fieldErrors.zone}
          required
          disabled={!form.city_id || zoneOptions.length === 0}
        />
        <AuthFormField
          label="Dirección de la sede"
          name="address"
          value={form.address}
          onChange={update("address")}
          error={fieldErrors.address}
          required
        />
        <AuthFormField
          label="Tiempo estimado de domicilio (min)"
          name="delivery_minutes"
          type="number"
          value={form.delivery_minutes}
          onChange={update("delivery_minutes")}
          error={fieldErrors.delivery_minutes}
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
          {submitting ? "Enviando solicitud…" : "Enviar solicitud"}
        </button>
      </form>
    </AuthLayout>
  );
}
