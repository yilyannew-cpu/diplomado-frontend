import { useState } from "react";
import { Bike, Eye, FileText, Mail, Phone, User } from "lucide-react";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import type { ApiApplicationStatus, ApiCourierApplication } from "@/lib/api/endpoints/courierApplications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ApiApplicationStatus, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Contratado",
  REJECTED: "Rechazado",
};

function statusClass(status: ApiApplicationStatus): string {
  if (status === "PENDING") return "bg-amber-100 text-amber-700";
  if (status === "ACCEPTED") return "bg-emerald-100 text-emerald-700";
  return "bg-red-100 text-red-700";
}

function ProfileField({
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
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
        {label}
      </p>
      <p className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function CourierProfileDialog({
  app,
  open,
  onClose,
}: {
  app: ApiCourierApplication | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!app) return null;

  const name = app.courierName ?? "Domiciliario";
  const avatar = resolveLogoUrl(app.courierAvatar) ?? app.courierAvatar ?? undefined;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-2xl p-4 sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="font-display text-xl">Perfil del motorizado</DialogTitle>
          <DialogDescription>
            Datos de contacto y vehículo del domiciliario vinculado a tu sede.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <UserAvatar name={name} src={avatar} className="size-14 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{app.restaurantName ?? "Restaurante"}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    statusClass(app.status),
                  )}
                >
                  {STATUS_LABEL[app.status]}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    app.courierIsAvailable
                      ? "bg-emerald-500/15 text-emerald-700"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {app.courierIsAvailable ? "En turno" : "Fuera de turno"}
                </span>
              </div>
            </div>
          </div>

          <ProfileField label="Nombre completo" value={app.courierName} icon={User} />
          <ProfileField label="Correo electrónico" value={app.courierEmail} icon={Mail} />
          <ProfileField label="Teléfono / WhatsApp" value={app.courierPhone} icon={Phone} />
          <ProfileField label="Documento (C.C.)" value={app.courierDocumentId} icon={FileText} />
          <ProfileField label="Vehículo" value={app.courierVehicle} icon={Bike} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CourierApplicationsAdminView() {
  const { applications, reviewApplication, isLoading } = useCourierApplications();
  const [profileApp, setProfileApp] = useState<ApiCourierApplication | null>(null);

  if (isLoading) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Cargando solicitudes…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid md:grid-cols-12">
          <span className="col-span-4">Motorizado</span>
          <span className="col-span-3">Restaurante</span>
          <span className="col-span-2 text-center">Estado</span>
          <span className="col-span-3 text-right">Acciones</span>
        </div>

        {applications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-foreground">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applications.map((app) => {
              const name = app.courierName ?? "Domiciliario";
              const avatar = resolveLogoUrl(app.courierAvatar) ?? app.courierAvatar ?? undefined;

              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-3 p-4 md:grid md:grid-cols-12 md:items-center md:px-5 md:py-4"
                >
                  <div className="col-span-4 flex min-w-0 items-center gap-3">
                    <UserAvatar name={name} src={avatar} className="size-11 text-sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      {app.courierPhone ? (
                        <p className="truncate text-xs text-muted-foreground">{app.courierPhone}</p>
                      ) : app.courierEmail ? (
                        <p className="truncate text-xs text-muted-foreground">{app.courierEmail}</p>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">Sin contacto</p>
                      )}
                      {app.courierVehicle ? (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <Bike className="size-3 shrink-0" aria-hidden />
                          {app.courierVehicle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <p className="text-sm font-medium">{app.restaurantName ?? "Restaurante"}</p>
                  </div>

                  <div className="col-span-2 flex md:justify-center">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        statusClass(app.status),
                      )}
                    >
                      {STATUS_LABEL[app.status]}
                    </span>
                  </div>

                  <div className="col-span-3 flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setProfileApp(app)}
                    >
                      <Eye className="size-3.5" />
                      Ver perfil
                    </Button>
                    {app.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void reviewApplication(app.id, "REJECTED")}
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => void reviewApplication(app.id, "ACCEPTED")}
                        >
                          Contratar
                        </Button>
                      </>
                    ) : app.status === "ACCEPTED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void reviewApplication(app.id, "REJECTED")}
                      >
                        Despedir
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() => void reviewApplication(app.id, "ACCEPTED")}
                      >
                        Re-contratar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CourierProfileDialog
        app={profileApp}
        open={Boolean(profileApp)}
        onClose={() => setProfileApp(null)}
      />
    </div>
  );
}
