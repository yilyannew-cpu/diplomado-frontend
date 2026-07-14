import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api/client";
import { profileApi } from "@/lib/api/endpoints/profile";
import { ApiError } from "@/lib/api/errors";
import { compressDataUrl, resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

async function fileToUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona una imagen válida (JPG, PNG o WebP).");
  }
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
  const compressed = await compressDataUrl(dataUrl, { maxWidth: 720, quality: 0.82 });
  const blob = await (await fetch(compressed)).blob();
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg") || "avatar.jpg", {
    type: blob.type || "image/jpeg",
  });
}

/**
 * Obligatorio tras aprobación: el domiciliario debe cargar foto de perfil
 * (cámara o galería) para que el cliente lo identifique.
 */
export function CourierAvatarRequiredModal() {
  const { user, setSession } = useAuth();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user || user.role !== "domiciliario") return null;
  if (user.avatar) return null;

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadFile = await fileToUpload(file);
      const preview = URL.createObjectURL(uploadFile);
      setPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return preview;
      });
      setPendingFile(uploadFile);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo preparar la imagen");
    } finally {
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    const token = getToken();
    if (!pendingFile || !token || !user) return;
    setSaving(true);
    try {
      const updated = await profileApi.uploadAvatar(pendingFile);
      const avatar = resolveLogoUrl(updated.avatar) ?? updated.avatar ?? null;
      setSession(token, { ...user, ...updated, avatar });
      toast.success("Foto de perfil guardada");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar la foto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className={cn(
          "max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-2xl p-0",
          "[&>button]:hidden",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle className="font-display text-lg sm:text-xl">
            Foto de perfil obligatoria
          </DialogTitle>
          <DialogDescription className="text-sm">
            Los clientes necesitan reconocerte al recibir el pedido. Toma una selfie o sube una
            foto clara de tu cara.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-4 py-5 sm:px-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="size-28 rounded-full object-cover ring-4 ring-primary/20 sm:size-32"
                />
              ) : (
                <div className="grid size-28 place-items-center rounded-full bg-secondary ring-4 ring-border sm:size-32">
                  <UserRound className="size-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-center text-sm font-medium">{user.name}</p>
            <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted-foreground">
              Sin foto no podrás continuar al panel de entregas.
            </p>
          </div>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePick}
            disabled={saving}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePick}
            disabled={saving}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
            >
              <Camera className="size-4" />
              Tomar foto
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
            >
              <ImagePlus className="size-4" />
              Galería
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!pendingFile || saving}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-cream hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar y continuar"
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <UserAvatar name={user.name} className="size-6" />
            Así te verán los clientes en el seguimiento
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
