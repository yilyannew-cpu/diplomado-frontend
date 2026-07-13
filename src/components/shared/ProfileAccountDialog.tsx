import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Mail, Phone, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/api/types";
import type { ApiRestaurantProfile } from "@/lib/api/types/admin";
import { restaurantsApi } from "@/lib/api/endpoints/restaurants";
import { ApiError } from "@/lib/api/errors";
import { compressDataUrl, resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

export const RESTAURANT_PROFILE_UPDATED_EVENT = "ffcore:restaurant-profile-updated";

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
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        {label}
      </p>
      <p className="break-words rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground sm:px-4 sm:py-3">
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
  const { user } = useAuth();
  const logoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [restaurant, setRestaurant] = useState<ApiRestaurantProfile | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [pendingLogoDataUrl, setPendingLogoDataUrl] = useState<string | null>(null);
  const [savedCoverUrl, setSavedCoverUrl] = useState<string | null>(null);
  const [pendingCoverDataUrl, setPendingCoverDataUrl] = useState<string | null>(null);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [logoJustSaved, setLogoJustSaved] = useState(false);
  const [coverJustSaved, setCoverJustSaved] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(false);

  const isAdmin = user?.role === "admin";
  const restaurantId = user?.restaurant_id ?? null;
  const logoPreview = pendingLogoDataUrl ?? savedLogoUrl;
  const coverPreview = pendingCoverDataUrl ?? savedCoverUrl;
  const hasPendingLogo = Boolean(pendingLogoDataUrl);
  const hasPendingCover = Boolean(pendingCoverDataUrl);
  const savingMedia = savingLogo || savingCover;

  useEffect(() => {
    if (!open) return;
    setLogoJustSaved(false);
    setCoverJustSaved(false);
  }, [open]);

  useEffect(() => {
    if (!open || !isAdmin || !restaurantId) {
      setRestaurant(null);
      setSavedLogoUrl(null);
      setPendingLogoDataUrl(null);
      setSavedCoverUrl(null);
      setPendingCoverDataUrl(null);
      setPendingCoverFile(null);
      return;
    }

    let cancelled = false;
    setLoadingRestaurant(true);
    setPendingLogoDataUrl(null);
    setPendingCoverDataUrl(null);
    setPendingCoverFile(null);
    setLogoJustSaved(false);
    setCoverJustSaved(false);
    void restaurantsApi
      .getProfile(restaurantId)
      .then((profile) => {
        if (cancelled) return;
        setRestaurant(profile);
        setSavedLogoUrl(resolveLogoUrl(profile.logo));
        setSavedCoverUrl(resolveLogoUrl(profile.cover_image));
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el restaurante");
      })
      .finally(() => {
        if (!cancelled) setLoadingRestaurant(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isAdmin, restaurantId]);

  if (!user) return null;

  const readImageFile = async (
    file: File,
    options: { maxWidth: number; quality: number },
  ): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Selecciona un archivo de imagen válido (JPG, PNG o WebP).");
    }
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
      reader.readAsDataURL(file);
    });
    return compressDataUrl(dataUrl, options);
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readImageFile(file, { maxWidth: 512, quality: 0.82 });
      setPendingLogoDataUrl(compressed);
      setLogoJustSaved(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo preparar la imagen");
    } finally {
      if (logoFileRef.current) logoFileRef.current.value = "";
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readImageFile(file, { maxWidth: 1200, quality: 0.72 });
      const blob = await (await fetch(compressed)).blob();
      const uploadFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg") || "cover.jpg", {
        type: blob.type || "image/jpeg",
      });
      setPendingCoverDataUrl(compressed);
      setPendingCoverFile(uploadFile);
      setCoverJustSaved(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo preparar la imagen");
    } finally {
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  const handleSaveLogo = async () => {
    if (!restaurantId || !pendingLogoDataUrl) return;

    setSavingLogo(true);
    setLogoJustSaved(false);
    try {
      const updated = await restaurantsApi.saveLogo(restaurantId, pendingLogoDataUrl);
      setRestaurant(updated);
      const nextUrl = resolveLogoUrl(updated.logo) ?? pendingLogoDataUrl;
      setSavedLogoUrl(nextUrl);
      setPendingLogoDataUrl(null);
      setLogoJustSaved(true);
      toast.success("Logo guardado correctamente");
      window.dispatchEvent(
        new CustomEvent(RESTAURANT_PROFILE_UPDATED_EVENT, { detail: updated }),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar el logo");
    } finally {
      setSavingLogo(false);
    }
  };

  const handleSaveCover = async () => {
    if (!restaurantId || (!pendingCoverFile && !pendingCoverDataUrl)) return;

    setSavingCover(true);
    setCoverJustSaved(false);
    try {
      const updated = await restaurantsApi.saveCoverImage(
        restaurantId,
        pendingCoverFile ?? pendingCoverDataUrl!,
      );
      setRestaurant(updated);
      const nextUrl = resolveLogoUrl(updated.cover_image) ?? pendingCoverDataUrl;
      setSavedCoverUrl(nextUrl);
      setPendingCoverDataUrl(null);
      setPendingCoverFile(null);
      setCoverJustSaved(true);
      toast.success("Portada guardada correctamente");
      window.dispatchEvent(
        new CustomEvent(RESTAURANT_PROFILE_UPDATED_EVENT, { detail: updated }),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la portada");
    } finally {
      setSavingCover(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-md flex-col gap-0 overflow-hidden p-0",
          "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-2xl",
          "sm:max-h-[90vh]",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-base sm:text-lg">Mi cuenta</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Información de tu perfil en la plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-5 sm:px-6">
          {isAdmin && (
            <>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
                  <ImagePlus className="size-3.5 shrink-0" />
                  Logo del restaurante
                </p>
                <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/40 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                  <div
                    className="mx-auto grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-semibold text-white sm:mx-0 sm:size-16"
                    style={{ backgroundColor: restaurant?.accent || "#4f46e5" }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo del restaurante" className="size-full object-cover" />
                    ) : (
                      restaurant?.initials || user.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="truncate text-sm font-medium">
                      {loadingRestaurant ? "Cargando…" : restaurant?.name || "Tu restaurante"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      {hasPendingLogo
                        ? "Vista previa lista. Pulsa Guardar logo para aplicarla."
                        : logoJustSaved
                          ? "Logo actualizado. Ya se muestra en el catálogo del cliente."
                          : "JPG, PNG o WebP. Se muestra en el catálogo del cliente."}
                    </p>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogoSelect}
                      disabled={savingMedia || loadingRestaurant || !restaurantId}
                    />
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        disabled={savingMedia || loadingRestaurant || !restaurantId}
                        className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                      >
                        {logoPreview ? "Elegir otra imagen" : "Elegir imagen"}
                      </button>
                      {hasPendingLogo && (
                        <button
                          type="button"
                          onClick={() => setPendingLogoDataUrl(null)}
                          disabled={savingMedia}
                          className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleSaveLogo()}
                        disabled={!hasPendingLogo || savingMedia || !restaurantId}
                        className={cn(
                          "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50",
                          logoJustSaved && !hasPendingLogo
                            ? "bg-emerald-600 text-white"
                            : "bg-ink text-cream hover:bg-primary",
                        )}
                      >
                        {logoJustSaved && !hasPendingLogo && !savingLogo ? (
                          <>
                            <Check className="size-3.5" />
                            Guardado
                          </>
                        ) : savingLogo ? (
                          "Guardando…"
                        ) : (
                          "Guardar logo"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
                  <ImagePlus className="size-3.5 shrink-0" />
                  Imagen de portada
                </p>
                <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-3 sm:p-4">
                  <div className="aspect-[16/9] overflow-hidden rounded-xl border border-border bg-muted">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Portada del restaurante"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex size-full items-center justify-center px-4 text-center text-xs text-muted-foreground"
                        style={{
                          background: `linear-gradient(135deg, ${restaurant?.accent || "#4f46e5"}55, #0f172a33)`,
                        }}
                      >
                        Sin portada · se usará una foto del menú
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {hasPendingCover
                      ? "Vista previa lista. Pulsa Guardar portada para aplicarla."
                      : coverJustSaved
                        ? "Portada actualizada. Ya se muestra en la ficha del restaurante."
                        : "Recomendado 16:9 (horizontal). JPG, PNG o WebP."}
                  </p>
                  <input
                    ref={coverFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverSelect}
                    disabled={savingMedia || loadingRestaurant || !restaurantId}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={savingMedia || loadingRestaurant || !restaurantId}
                      className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                    >
                      {coverPreview ? "Elegir otra portada" : "Elegir portada"}
                    </button>
                    {hasPendingCover && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCoverDataUrl(null);
                          setPendingCoverFile(null);
                        }}
                        disabled={savingMedia}
                        className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        Descartar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSaveCover()}
                      disabled={!hasPendingCover || savingMedia || !restaurantId}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50",
                        coverJustSaved && !hasPendingCover
                          ? "bg-emerald-600 text-white"
                          : "bg-ink text-cream hover:bg-primary",
                      )}
                    >
                      {coverJustSaved && !hasPendingCover && !savingCover ? (
                        <>
                          <Check className="size-3.5" />
                          Guardado
                        </>
                      ) : savingCover ? (
                        "Guardando…"
                      ) : (
                        "Guardar portada"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <InfoField label="Nombre" value={user.name} icon={UserIcon} />
          <InfoField label="Correo electrónico" value={user.email} icon={Mail} />
          <InfoField label="Teléfono" value={user.phone} icon={Phone} />
          <InfoField label="Rol" value={roleLabels[user.role]} icon={Shield} />
          <InfoField label="Estado" value={statusLabels[user.status] ?? user.status} />
          {user.document_id && <InfoField label="Documento" value={user.document_id} />}
          {user.vehicle && <InfoField label="Vehículo" value={user.vehicle} />}
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={savingMedia}
            className="min-h-11 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
