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
import { CATEGORIES, type Category } from "@/mocks/menuMock";
import {
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousandsInput";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

export interface NewProductData {
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  available: boolean;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewProductData) => Promise<void>;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

export function AddProductModal({ open, onClose, onSave }: AddProductModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category>("Entradas");
  const [image, setImage] = useState("");
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("Entradas");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = parseThousandsInput(price);

    if (!trimmedName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!trimmedDesc) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (parsedPrice == null || parsedPrice <= 0) {
      setError("Ingresa un precio válido mayor a cero.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        name: trimmedName,
        description: trimmedDesc,
        price: parsedPrice,
        category,
        image: image || PLACEHOLDER_IMAGE,
        available,
      });
      reset();
      onClose();
    } catch {
      setError("No se pudo guardar el producto. Revisa los datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-lg overflow-y-auto rounded-2xl p-4 sm:max-h-[90vh] sm:rounded-3xl sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle className="font-display text-xl">Nuevo producto</DialogTitle>
          <DialogDescription>
            Agrega un producto al menú de la sede. Los cambios se reflejan de inmediato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Imagen</Label>
            <div className="mt-2 flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                <img
                  src={image || PLACEHOLDER_IMAGE}
                  alt="Vista previa"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-image"
                />
                <label
                  htmlFor="product-image"
                  className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground sm:px-4"
                >
                  <ImagePlus className="size-4 shrink-0" />
                  Subir imagen
                </label>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  JPG, PNG o WebP. Si no subes imagen, se usa una por defecto.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="product-name" className="text-xs font-medium">
              Nombre
            </Label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Combo Especial"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="product-description" className="text-xs font-medium">
              Descripción
            </Label>
            <textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes, tamaño, notas..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-price" className="text-xs font-medium">
                Precio (COP)
              </Label>
              <input
                id="product-price"
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(formatThousandsInput(e.target.value))}
                placeholder="24.900"
                className={`${inputClass} font-mono tabular-nums`}
              />
            </div>
            <div>
              <Label htmlFor="product-category" className="text-xs font-medium">
                Categoría
              </Label>
              <select
                id="product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <Checkbox
              id="product-available"
              checked={available}
              onCheckedChange={(checked) => setAvailable(checked === true)}
            />
            <div>
              <Label htmlFor="product-available" className="cursor-pointer text-sm font-medium">
                Disponible para clientes
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {available ? "Visible en el menú del cliente" : "Oculto hasta activarlo"}
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
              disabled={submitting}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Guardando…" : "Guardar producto"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
