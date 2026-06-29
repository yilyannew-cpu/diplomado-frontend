import { createFileRoute, Link } from "@tanstack/react-router";
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
import { authApi } from "@/lib/api/endpoints/auth";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import type { VehicleType } from "@/lib/api/types";

const VEHICLE_TYPES: VehicleType[] = ["Moto", "Bici", "Automóvil", "Otro"];

export const Route = createFileRoute("/registro/domiciliario")({
  head: () => ({
    meta: [{ title: "FFCore — Registro domiciliario" }],
  }),
  component: RegisterCourierPage,
});

function RegisterCourierPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    document_id: "",
    vehicle_type: "Moto" as VehicleType,
    vehicle_plate: "",
    vehicle_description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update =
    (field: keyof typeof form) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
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
    if (form.document_id.trim().length < 6) {
      clientErrors.document_id = "Documento inválido";
    }
    if (!form.vehicle_plate.trim()) {
      clientErrors.vehicle_plate = "La placa es obligatoria";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.registerCourier({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone.trim(),
        document_id: form.document_id.trim(),
        vehicle_type: form.vehicle_type,
        vehicle_plate: form.vehicle_plate.trim(),
        vehicle_description: form.vehicle_description.trim() || undefined,
      });
      setSuccessMessage(
        response.message ??
          "Solicitud enviada. Recibirás acceso cuando un administrador apruebe tu cuenta.",
      );
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
        subtitle="Tu postulación como domiciliario está en revisión."
        footer={
          <AuthLinkRow>
            <AuthInlineLink to="/login/equipo">Volver al login</AuthInlineLink>
          </AuthLinkRow>
        }
      >
        <AuthFormAlert message={successMessage} variant="success" />
        <p className="mt-4 text-sm text-muted-foreground">
          No podrás iniciar sesión hasta que un superadmin apruebe tu cuenta.
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
      title="Registrarse como domiciliario"
      subtitle="Postúlate para entregar pedidos. Requiere aprobación del superadmin."
      footer={
        <AuthLinkRow>
          ¿Ya tienes cuenta? <AuthInlineLink to="/login/equipo">Inicia sesión</AuthInlineLink>
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
          label="Teléfono móvil"
          name="phone"
          value={form.phone}
          onChange={update("phone")}
          error={fieldErrors.phone}
          required
        />
        <AuthFormField
          label="Documento de identidad"
          name="document_id"
          value={form.document_id}
          onChange={update("document_id")}
          error={fieldErrors.document_id}
          required
        />
        <div>
          <label htmlFor="vehicle_type" className="mb-1.5 block text-xs font-medium">
            Tipo de vehículo
          </label>
          <select
            id="vehicle_type"
            value={form.vehicle_type}
            onChange={(e) => update("vehicle_type")(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {fieldErrors.vehicle_type && (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.vehicle_type}</p>
          )}
        </div>
        <AuthFormField
          label="Placa"
          name="vehicle_plate"
          value={form.vehicle_plate}
          onChange={update("vehicle_plate")}
          placeholder="PLA-23H"
          error={fieldErrors.vehicle_plate}
          required
        />
        <AuthFormField
          label="Descripción del vehículo (opcional)"
          name="vehicle_description"
          value={form.vehicle_description}
          onChange={update("vehicle_description")}
          placeholder="Moto AKT"
          error={fieldErrors.vehicle_description}
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
