import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useCatalog } from "@/context/CatalogContext";
import { cn } from "@/lib/utils";

type CorporateRole = "Cliente" | "Admin Restaurante" | "Domiciliario";

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  owner_name: "Nombre del propietario",
  email: "Correo",
  phone: "Teléfono",
  password: "Contraseña",
  password_confirmation: "Confirmación de contraseña",
  document_id: "Documento",
  vehicle_type: "Tipo de vehículo",
  vehicle_plate: "Placa",
  restaurant_name: "Nombre del restaurante",
  city: "Ciudad",
  address: "Dirección",
  comuna: "Comuna",
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10) return `+57${digits}`;
  if (raw.trim().startsWith("+")) return raw.trim();
  return raw.trim();
}

function formatValidationMessage(error: ApiError): string {
  if (error.details?.length) {
    return error.details
      .map((d) => {
        const label = FIELD_LABELS[d.field] ?? d.field;
        return `${label}: ${d.message}`;
      })
      .join(" · ");
  }
  return error.message || "Error al crear el usuario";
}

export function NewUserForm({ onUserCreated }: { onUserCreated?: () => void }) {
  const { comunas, vehicleTypes } = useCatalog();
  const [role, setRole] = useState<CorporateRole>("Cliente");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [city, setCity] = useState("Cúcuta");
  const [address, setAddress] = useState("");
  const [comuna, setComuna] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const defaultComuna = comunas[0]?.code ?? "";
  const defaultVehicle = vehicleTypes[0]?.code ?? "";

  const passwordHint = useMemo(
    () => "Mínimo 8 caracteres, con al menos una letra y un número",
    [],
  );

  const clearForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setDocumentId("");
    setVehicleType(defaultVehicle);
    setVehiclePlate("");
    setRestaurantName("");
    setCity("Cúcuta");
    setAddress("");
    setComuna(defaultComuna);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    const phoneNormalized = normalizePhone(phone);

    try {
      if (role === "Cliente") {
        await apiClient("/auth/register/client", {
          method: "POST",
          auth: true,
          body: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            password_confirmation: password,
            phone: phoneNormalized,
            comuna: comuna || defaultComuna,
          },
        });
      } else if (role === "Admin Restaurante") {
        await apiClient("/auth/register/restaurant", {
          method: "POST",
          auth: true,
          body: {
            owner_name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            password_confirmation: password,
            phone: phoneNormalized,
            restaurant_name: restaurantName.trim(),
            city: city.trim(),
            address: address.trim(),
          },
        });
      } else {
        await apiClient("/auth/register/courier", {
          method: "POST",
          auth: true,
          body: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            password_confirmation: password,
            phone: phoneNormalized,
            document_id: documentId.trim(),
            vehicle_type: vehicleType || defaultVehicle,
            vehicle_plate: vehiclePlate.trim().toUpperCase(),
          },
        });
      }

      toast.success(`Usuario ${name} creado exitosamente como ${role}`);
      onUserCreated?.();
      clearForm();
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const detail of error.details ?? []) {
          if (detail.field) next[detail.field] = detail.message;
        }
        // owner_name se muestra en el campo name del formulario
        if (next.owner_name && !next.name) next.name = next.owner_name;
        setFieldErrors(next);
        toast.error(formatValidationMessage(error));
      } else {
        toast.error("Error al crear el usuario. Revisa los datos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
      <h2 className="font-display text-lg font-semibold">Registro corporativo</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Da de alta nuevos empleados con sus credenciales de acceso al sistema.
      </p>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => void handleSubmit(e)}>
        <Field
          label={role === "Admin Restaurante" ? "Nombre del propietario" : "Nombre completo"}
          placeholder="Ej. María Restrepo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name ?? fieldErrors.owner_name}
          required
        />
        <Field
          label="Correo corporativo"
          placeholder="usuario@ffcore.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <Field
          label="Teléfono"
          placeholder="3001234567 o +57 300 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={fieldErrors.phone}
          hint="Celular de 10 dígitos (se antepone +57 si falta)"
          required
        />

        <div>
          <span className="mb-1.5 block text-xs font-medium">
            Rol asignado <span className="text-destructive/70">*</span>
          </span>
          <select
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as CorporateRole);
              setFieldErrors({});
            }}
          >
            <option value="Cliente">Cliente</option>
            <option value="Admin Restaurante">Admin Restaurante</option>
            <option value="Domiciliario">Domiciliario</option>
          </select>
        </div>

        {role === "Cliente" && (
          <div>
            <span className="mb-1.5 block text-xs font-medium">
              Comuna <span className="text-destructive/70">*</span>
            </span>
            <select
              className={cn(
                "w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
                fieldErrors.comuna ? "border-destructive" : "border-border",
              )}
              value={comuna || defaultComuna}
              onChange={(e) => setComuna(e.target.value)}
              required
            >
              {comunas.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {fieldErrors.comuna ? (
              <p className="mt-1 text-[11px] text-destructive">{fieldErrors.comuna}</p>
            ) : null}
          </div>
        )}

        {role === "Admin Restaurante" && (
          <>
            <Field
              label="Nombre del Restaurante"
              placeholder="Ej. BurgerCore Centro"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              error={fieldErrors.restaurant_name}
              required
            />
            <Field
              label="Ciudad"
              placeholder="Ej. Cúcuta"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={fieldErrors.city}
              required
            />
            <Field
              label="Dirección"
              placeholder="Ej. Calle 10 # 43-20"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={fieldErrors.address}
              required
            />
          </>
        )}

        {role === "Domiciliario" && (
          <>
            <Field
              label="Documento de Identidad"
              placeholder="Ej. 1000000000"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              error={fieldErrors.document_id}
              required
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium">
                Tipo de Vehículo <span className="text-destructive/70">*</span>
              </span>
              <select
                className={cn(
                  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
                  fieldErrors.vehicle_type ? "border-destructive" : "border-border",
                )}
                value={vehicleType || defaultVehicle}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.code}>
                    {vt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.vehicle_type ? (
                <p className="mt-1 text-[11px] text-destructive">{fieldErrors.vehicle_type}</p>
              ) : null}
            </div>
            <Field
              label="Placa del vehículo"
              placeholder="Ej. XYZ-123"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              error={fieldErrors.vehicle_plate}
              required
            />
          </>
        )}

        <Field
          label="Contraseña temporal"
          placeholder="Ej. Temporal1"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password ?? fieldErrors.password_confirmation}
          hint={passwordHint}
          required
        />

        <div className="mt-4 flex justify-end md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Crear cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  error,
  hint,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">
        {label} {required ? <span className="text-destructive/70">*</span> : null}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20",
          error ? "border-destructive focus:ring-destructive/20" : "border-border",
        )}
      />
      {error ? (
        <p className="mt-1 text-[11px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </label>
  );
}
