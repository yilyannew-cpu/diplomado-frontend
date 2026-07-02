import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

export function NewUserForm() {
  const [role, setRole] = useState("Cliente");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Courier specific
  const [documentId, setDocumentId] = useState("");
  const [vehicleType, setVehicleType] = useState("Moto");
  const [vehiclePlate, setVehiclePlate] = useState("");

  // Restaurant specific
  const [restaurantName, setRestaurantName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (role === "Cliente") {
        await apiClient("/auth/register/client", {
          method: "POST",
          auth: true,
          body: {
            name,
            email,
            password,
            password_confirmation: password,
            phone,
          },
        });
      } else if (role === "Admin Restaurante") {
        await apiClient("/auth/register/restaurant", {
          method: "POST",
          auth: true,
          body: {
            owner_name: name,
            email,
            password,
            password_confirmation: password,
            phone,
            restaurant_name: restaurantName,
            city,
            address,
          },
        });
      } else if (role === "Domiciliario") {
        await apiClient("/auth/register/courier", {
          method: "POST",
          auth: true,
          body: {
            name,
            email,
            password,
            password_confirmation: password,
            phone,
            document_id: documentId,
            vehicle_type: vehicleType,
            vehicle_plate: vehiclePlate,
          },
        });
      }

      toast.success(`Usuario ${name} creado exitosamente como ${role}`);
      
      // Limpiar formulario
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setDocumentId("");
      setVehiclePlate("");
      setRestaurantName("");
      setCity("");
      setAddress("");
    } catch (error: any) {
      toast.error(error.message || "Error al crear el usuario. Revisa los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Registro corporativo</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        Da de alta nuevos empleados con sus credenciales de acceso al sistema.
      </p>
      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field 
          label={role === "Admin Restaurante" ? "Nombre del propietario" : "Nombre completo"} 
          placeholder="Ej. María Restrepo" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <Field 
          label="Correo corporativo" 
          placeholder="usuario@burgercore.co" 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <Field 
          label="Teléfono" 
          placeholder="+57 300 000 0000" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
        />
        
        <div>
          <span className="mb-1.5 block text-xs font-medium">Rol asignado</span>
          <select 
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Cliente</option>
            <option>Admin Restaurante</option>
            <option>Domiciliario</option>
          </select>
        </div>

        {role === "Admin Restaurante" && (
          <>
            <Field 
              label="Nombre del Restaurante" 
              placeholder="Ej. BurgerCore Centro" 
              value={restaurantName} 
              onChange={(e) => setRestaurantName(e.target.value)} 
              required 
            />
            <Field 
              label="Ciudad" 
              placeholder="Ej. Medellín" 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
              required 
            />
            <Field 
              label="Dirección" 
              placeholder="Ej. Calle 10 # 43-20" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
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
              required 
            />
            <div>
              <span className="mb-1.5 block text-xs font-medium">Tipo de Vehículo</span>
              <select 
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option>Moto</option>
                <option>Bici</option>
                <option>Automóvil</option>
                <option>Otro</option>
              </select>
            </div>
            <Field 
              label="Placa del vehículo" 
              placeholder="Ej. XYZ-123" 
              value={vehiclePlate} 
              onChange={(e) => setVehiclePlate(e.target.value)} 
              required 
            />
          </>
        )}

        <Field 
          label="Contraseña temporal" 
          placeholder="********" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <div className="md:col-span-2 flex justify-end mt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50 transition-all"
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
  required = false
}: { 
  label: string; 
  placeholder?: string; 
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">
        {label} {required && <span className="text-destructive/70">*</span>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
