import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/endpoints/profile";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import { isValidPassword, isValidPhone, passwordRules } from "@/lib/api/profileValidation";
import { getToken } from "@/lib/api/client";
import { persistClientComuna } from "@/lib/clientComunaStorage";
import { CUCUTA_COMUNAS } from "@/lib/cucutaComunas";
import type { UpdateProfileBody } from "@/lib/api/types/profile";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { user, refreshUser, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comuna, setComuna] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const isClient = user?.role === "cliente";
  const passwordOnly = isAdmin;

  useEffect(() => {
    if (open && user) {
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setComuna(user.comuna?.trim() || "");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      setFieldErrors({});
      setFormError(null);
    }
  }, [open, user]);

  if (!user) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordOnly) {
      if (!email.trim()) errors.email = "El correo es requerido";
      if (!phone.trim()) errors.phone = "El teléfono es requerido";
      else if (!isValidPhone(phone)) errors.phone = "Formato inválido. Use +57...";
      // Comuna solo se exige si el cliente quiere cambiarla; al registrarse ya la eligió.
    }

    const wantsPasswordChange =
      currentPassword.length > 0 || password.length > 0 || passwordConfirmation.length > 0;

    if (passwordOnly || wantsPasswordChange) {
      if (!currentPassword) errors.current_password = "Ingresa tu contraseña actual";
      if (!password) errors.password = "Ingresa la nueva contraseña";
      else if (!isValidPassword(password)) errors.password = passwordRules.message;
      if (!passwordConfirmation) errors.password_confirmation = "Confirma la nueva contraseña";
      if (password && passwordConfirmation && password !== passwordConfirmation) {
        errors.password_confirmation = "Las contraseñas no coinciden";
      }
    }

    setFieldErrors(errors);
    setFormError(null);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setFieldErrors({});
    setFormError(null);

    const profileChanged =
      !passwordOnly &&
      (email !== user.email ||
        phone !== (user.phone ?? "") ||
        (isClient && comuna !== (user.comuna ?? "")));
    const wantsPasswordChange =
      currentPassword.length > 0 || password.length > 0 || passwordConfirmation.length > 0;

    if (!profileChanged && !wantsPasswordChange) {
      toast.info("No hay cambios por guardar");
      setIsSaving(false);
      return;
    }

    const errors: Record<string, string> = {};
    let profileUpdated = false;
    let passwordUpdated = false;

    if (profileChanged) {
      const body: UpdateProfileBody = {};
      if (email !== user.email) body.email = email;
      if (phone !== (user.phone ?? "")) body.phone = phone;
      const comunaChanged = isClient && comuna !== (user.comuna ?? "");
      if (comunaChanged && comuna.trim()) body.comuna = comuna.trim();

      // La comuna se guarda en el dispositivo aunque el API aún no la persista.
      if (comunaChanged && comuna.trim()) {
        persistClientComuna(user.id, comuna.trim());
        const token = getToken();
        if (token) {
          setSession(token, { ...user, comuna: comuna.trim() });
        }
        profileUpdated = true;
      }

      const apiBody: UpdateProfileBody = { ...body };
      try {
        await profileApi.updateProfile(apiBody);
        profileUpdated = true;
      } catch (err) {
        // Si solo cambió la comuna y el API la rechaza, ya quedó en local.
        const onlyComuna =
          comunaChanged &&
          Object.keys(apiBody).every((k) => k === "comuna");
        if (!onlyComuna) {
          const mapped = mapApiErrorToForm(err);
          if (mapped.formError) setFormError(mapped.formError);
          if (mapped.fieldErrors) Object.assign(errors, mapped.fieldErrors);
          if (comunaChanged) {
            // email/teléfono fallaron; no marcar éxito solo por comuna local
            profileUpdated = false;
          }
        }
      }
    }

    if (wantsPasswordChange) {
      try {
        await profileApi.changePassword({
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation,
        });
        passwordUpdated = true;
      } catch (err) {
        const mapped = mapApiErrorToForm(err);
        if (mapped.formError && !formError) setFormError(mapped.formError);
        if (mapped.fieldErrors) Object.assign(errors, mapped.fieldErrors);
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Revisa los campos marcados");
      setIsSaving(false);
      return;
    }

    if (profileUpdated || passwordUpdated) {
      if (isClient && comuna.trim()) {
        persistClientComuna(user.id, comuna.trim());
      }
      const refreshed = await refreshUser({ force: true });
      // refreshUser puede venir sin comuna del API; reaplicar la local.
      if (isClient && comuna.trim()) {
        const token = getToken();
        const base = refreshed ?? user;
        if (token) {
          setSession(token, { ...base, comuna: comuna.trim() });
        }
      }
      toast.success(
        passwordUpdated && !profileUpdated
          ? "Contraseña actualizada correctamente"
          : "Configuración actualizada correctamente",
      );
      onOpenChange(false);
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            {passwordOnly
              ? "Actualiza la contraseña de tu cuenta."
              : isClient
                ? "Actualiza tu correo, teléfono, comuna y contraseña."
                : "Actualiza tu correo, teléfono y contraseña."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {formError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          {!passwordOnly && (
            <>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Correo electrónico</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Teléfono</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57..."
                  autoComplete="tel"
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                )}
              </div>

              {isClient ? (
                <div className="space-y-2">
                  <Label htmlFor="profile-comuna">Comuna</Label>
                  <select
                    id="profile-comuna"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      Selecciona tu comuna
                    </option>
                    {CUCUTA_COMUNAS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.comuna && (
                    <p className="text-xs text-destructive">{fieldErrors.comuna}</p>
                  )}
                </div>
              ) : null}
            </>
          )}

          <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-sm font-medium">
              {passwordOnly ? "Nueva contraseña" : "Cambiar contraseña (opcional)"}
            </p>

            <div className="space-y-2">
              <Label htmlFor="profile-current-password">Contraseña actual</Label>
              <Input
                id="profile-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              {fieldErrors.current_password && (
                <p className="text-xs text-destructive">{fieldErrors.current_password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password">Nueva contraseña</Label>
              <Input
                id="profile-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-password-confirm">Confirmar contraseña</Label>
              <Input
                id="profile-password-confirm"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
              />
              {fieldErrors.password_confirmation && (
                <p className="text-xs text-destructive">{fieldErrors.password_confirmation}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
