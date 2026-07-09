import { useEffect } from "react";
import { Mail, Phone, Shield, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/api/types";

const roleLabels: Record<Role, string> = {
  cliente: "Cliente",
  admin: "Admin Restaurante",
  superadmin: "Superadmin",
  domiciliario: "Domiciliario",
};

const statusLabels: Record<string, string> = {
  Activo: "Activo",
  Pendiente: "Pendiente",
  Suspendido: "Suspendido",
  Rechazado: "Rechazado",
};

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </p>
      <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

interface ProfileAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileAccountDialog({ open, onOpenChange }: ProfileAccountDialogProps) {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (open) {
      void refreshUser();
    }
  }, [open, refreshUser]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mi cuenta</DialogTitle>
          <DialogDescription>Información de tu perfil en la plataforma.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <InfoField label="Nombre" value={user.name} icon={UserIcon} />
          <InfoField label="Correo electrónico" value={user.email} icon={Mail} />
          <InfoField label="Teléfono" value={user.phone} icon={Phone} />
          <InfoField label="Rol" value={roleLabels[user.role]} icon={Shield} />
          <InfoField label="Estado" value={statusLabels[user.status] ?? user.status} />
          {user.document_id && (
            <InfoField label="Documento" value={user.document_id} />
          )}
          {user.vehicle && <InfoField label="Vehículo" value={user.vehicle} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
