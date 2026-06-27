import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { MenuItem } from "@/mocks/menuMock";

export interface EditProductData {
  description: string;
  price: number;
  image: string;
  available: boolean;
}

interface EditProductModalProps {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  onSave: (data: EditProductData) => void;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

export function EditProductModal({ item, open, onClose, onSave }: EditProductModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(String(item.price));
  const [image, setImage] = useState(item.image);
  const [available, setAvailable] = useState(item.available);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(item.description);
    setPrice(String(item.price));
    setImage(item.image);
    setAvailable(item.available);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [item]);

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
    const trimmedDesc = description.trim();
    const parsedPrice = Number(price);

    if (!trimmedDesc) {
      setError("La descripción es obligatoria.");
      return;
    }
    if (!price || parsedPrice <= 0) {
      setError("Ingresa un precio válido mayor a cero.");
      return;
    }

    onSave({
      description: trimmedDesc,
      price: parsedPrice,
      image,
      available,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Editar producto</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{item.name}</span>
            <span className="text-muted-foreground"> · {item.category}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Imagen</Label>
            <div className="mt-2 flex items-start gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/40">
                <img src={image} alt={item.name} className="size-full object-cover" />
              </div>
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit-product-image"
                />
                <label
                  htmlFor="edit-product-image"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  <ImagePlus className="size-4" />
                  Cambiar imagen
                </label>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  JPG, PNG o WebP.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-product-description" className="text-xs font-medium">
              Descripción
            </Label>
            <textarea
              id="edit-product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes, tamaño, notas..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <Label htmlFor="edit-product-price" className="text-xs font-medium">
              Precio (COP)
            </Label>
            <input
              id="edit-product-price"
              type="number"
              min={1}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <Checkbox
              id="edit-product-available"
              checked={available}
              onCheckedChange={(checked) => setAvailable(checked === true)}
            />
            <div>
              <Label htmlFor="edit-product-available" className="cursor-pointer text-sm font-medium">
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
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
