import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ADDITION_CATEGORY } from "@/mocks/menuMock";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80";

export interface NewAdditionData {
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}

interface AddAdditionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewAdditionData) => void;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

export function AddAdditionModal({ open, onClose, onSave }: AddAdditionModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [additionalValue, setAdditionalValue] = useState("");
  const [image, setImage] = useState("");
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setAdditionalValue("");
    setImage("");
    setAvailable(true);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const parsedValue = Number(additionalValue);

    if (!trimmedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!trimmedDesc) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!additionalValue || parsedValue <= 0) {
      setError("Ingresa un valor adicional válido mayor a cero.");
      return;
    }

    onSave({
      name: trimmedName,
      description: trimmedDesc,
      price: parsedValue,
      image: image || PLACEHOLDER_IMAGE,
      available,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nueva adición</DialogTitle>
          <DialogDescription>
            Complemento extra para el menú. Se guardará en la categoría{" "}
            <span className="font-medium text-foreground">{ADDITION_CATEGORY}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Categoría
            </p>
            <p className="mt-1 text-sm font-medium">{ADDITION_CATEGORY}</p>
          </div>

          <div>
            <Label className="text-xs font-medium">Imagen</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                <img
                  src={image || PLACEHOLDER_IMAGE}
                  alt="Vista previa"
                  className="size-full object-cover"
                />
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="addition-image"
                />
                <label
                  htmlFor="addition-image"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  <ImagePlus className="size-4" />
                  Subir imagen
                </label>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  JPG, PNG o WebP. Si no subes imagen, se usa una por defecto.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="addition-name" className="text-xs font-medium">
              Nombre
            </Label>
            <input
              id="addition-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Queso extra"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="addition-description" className="text-xs font-medium">
              Descripción
            </Label>
            <textarea
              id="addition-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle del complemento..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <Label htmlFor="addition-value" className="text-xs font-medium">
              Valor adicional (COP)
            </Label>
            <input
              id="addition-value"
              type="number"
              min={1}
              step={1}
              value={additionalValue}
              onChange={(e) => setAdditionalValue(e.target.value)}
              placeholder="3500"
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Precio que se suma al pedido cuando el cliente la elige.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <Checkbox
              id="addition-available"
              checked={available}
              onCheckedChange={(checked) => setAvailable(checked === true)}
            />
            <div>
              <Label htmlFor="addition-available" className="cursor-pointer text-sm font-medium">
                Disponible para clientes
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {available ? "Visible como adición en el menú" : "Oculta hasta activarla"}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Guardar adición
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
