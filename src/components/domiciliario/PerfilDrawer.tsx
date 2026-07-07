export type DrawerView = "mi-cuenta" | "mi-vehiculo" | null;

import { useState } from "react";
import { User, Bike, Phone, Mail, Shield, FileText, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { VehicleType } from "@/mocks/usersMock";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface PerfilDrawerProps {
  open: DrawerView;
  onOpenChange: (view: DrawerView) => void;
}

/* ─── Campo de solo lectura ─── */
function ReadOnlyField({ label, value, icon: Icon }: { label: string; value?: string; icon?: React.ElementType }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </p>
      <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

/* ─── Campo editable ─── */
function EditableField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ElementType;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
      />
    </div>
  );
}

/* ─── Vista: Mi Cuenta ─── */
function MiCuentaView() {
  const { user } = useAuth();
  if (!user) return null;

  const [phone, setPhone] = useState(user.phone ?? "");
  const [documentId, setDocumentId] = useState(user.document_id ?? "");
  const [emergencyName, setEmergencyName] = useState(user.emergency_contact_name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergency_contact_phone ?? "");

  return (
    <div className="space-y-4">
      {/* Avatar visual */}
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-full bg-ink text-lg font-bold text-cream shrink-0">
          {user.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground">Domiciliario activo</p>
        </div>
      </div>

      <hr className="border-border" />

      {/* Campos solo lectura */}
      <ReadOnlyField label="Nombre Completo" value={user.name} icon={User} />
      <ReadOnlyField label="Correo Electrónico" value={user.email} icon={Mail} />

      {/* Campos editables */}
      <EditableField label="Documento de Identidad (C.C.)" value={documentId} onChange={setDocumentId} icon={FileText} placeholder="Ej: 1020304050" />
      <EditableField label="Teléfono / WhatsApp" value={phone} onChange={setPhone} icon={Phone} placeholder="+57 300 000 0000" type="tel" />

      <hr className="border-border" />

      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Shield className="size-3.5" />
        Contacto de Emergencia
      </p>
      <EditableField label="Nombre del contacto" value={emergencyName} onChange={setEmergencyName} placeholder="Ej: Pedro Gil" />
      <EditableField label="Teléfono del contacto" value={emergencyPhone} onChange={setEmergencyPhone} placeholder="+57 310 000 0000" type="tel" />
    </div>
  );
}

/* ─── Vista: Mi Vehículo ─── */
function MiVehiculoView() {
  const { user } = useAuth();
  if (!user) return null;

  const [vehicleType, setVehicleType] = useState<VehicleType>(user.vehicle_type ?? "Motocicleta");
  const [plate, setPlate] = useState(user.vehicle_plate ?? "");
  const [description, setDescription] = useState(user.vehicle_description ?? "");

  const showPlate = vehicleType !== "Bicicleta";

  return (
    <div className="space-y-4">
      {/* Selector de tipo de vehículo */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <Bike className="size-3.5" />
          Tipo de Vehículo
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["Bicicleta", "Motocicleta", "Automóvil"] as VehicleType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setVehicleType(type);
                if (type === "Bicicleta") setPlate("");
              }}
              className={`rounded-xl border px-3 py-3 text-xs font-semibold transition-all ${
                vehicleType === type
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {type === "Bicicleta" && "🚲"}
              {type === "Motocicleta" && "🛵"}
              {type === "Automóvil" && "🚗"}
              <br />
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Placa — solo visible si NO es bicicleta */}
      {showPlate && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <EditableField
            label="Placa (Matrícula)"
            value={plate}
            onChange={setPlate}
            placeholder="Ej: ABC-12D"
          />
        </div>
      )}

      {!showPlate && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground text-center animate-in fade-in duration-300">
          Las bicicletas no requieren placa registrada.
        </div>
      )}

      {/* Descripción adicional */}
      <EditableField
        label="Descripción Adicional"
        value={description}
        onChange={setDescription}
        placeholder="Ej: Moto Pulsar Roja, Casco Negro"
      />

      <p className="text-[10px] text-muted-foreground/70 text-center pt-2">
        Esta información ayuda al cliente a reconocer tu vehículo en la entrega.
      </p>
    </div>
  );
}

/* ─── Componente Principal: PerfilDrawer ─── */
export function PerfilDrawer({ open, onOpenChange }: PerfilDrawerProps) {
  const isOpen = open !== null;

  const titles: Record<string, { title: string; description: string }> = {
    "mi-cuenta": { title: "Mi Cuenta", description: "Información personal y de contacto" },
    "mi-vehiculo": { title: "Mi Vehículo", description: "Datos de tu medio de transporte" },
  };

  const current = open ? titles[open] : null;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) onOpenChange(null);
      }}
    >
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-left">
          <button
            onClick={() => onOpenChange(null)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1 -ml-1"
          >
            <ChevronLeft className="size-4" />
            Volver
          </button>
          <DrawerTitle className="font-display">{current?.title}</DrawerTitle>
          <DrawerDescription>{current?.description}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 overflow-y-auto">
          {open === "mi-cuenta" && <MiCuentaView />}
          {open === "mi-vehiculo" && <MiVehiculoView />}
        </div>

        <DrawerFooter>
          <button className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]">
            Guardar cambios
          </button>
          <DrawerClose asChild>
            <button className="w-full rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Cancelar
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
