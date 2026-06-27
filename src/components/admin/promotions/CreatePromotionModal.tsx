import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCOP, useOrders } from "@/context/OrderContext";
import { toDateKey } from "@/lib/promotions";
import { ADDITION_CATEGORY } from "@/mocks/menuMock";

interface CreatePromotionModalProps {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

export function CreatePromotionModal({ open, onClose }: CreatePromotionModalProps) {
  const { menu, addPromotion } = useOrders();
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("15");
  const [startDate, setStartDate] = useState(toDateKey());
  const [endDate, setEndDate] = useState(toDateKey());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const eligibleProducts = useMemo(
    () => menu.filter((item) => item.available && item.category !== ADDITION_CATEGORY),
    [menu],
  );

  const reset = () => {
    setName("");
    setDiscountPercent("15");
    const today = toDateKey();
    setStartDate(today);
    setEndDate(today);
    setSelectedIds(new Set());
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const discount = Number(discountPercent);

    if (!trimmedName) {
      setError("Ingresa un nombre para la promoción.");
      return;
    }
    if (!Number.isFinite(discount) || discount < 1 || discount > 90) {
      setError("El descuento debe estar entre 1% y 90%.");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Selecciona al menos un producto disponible.");
      return;
    }
    if (startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    addPromotion({
      name: trimmedName,
      discountPercent: Math.round(discount),
      productIds: [...selectedIds],
      startDate,
      endDate,
      active: true,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nueva promoción</DialogTitle>
          <DialogDescription>
            Selecciona productos del menú, define el descuento y el rango de fechas. Se activará
            automáticamente cuando llegue la fecha de inicio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="promo-name">Nombre de la promoción</Label>
            <input
              id="promo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Semana del smash"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="promo-discount">Descuento (%)</Label>
              <input
                id="promo-discount"
                type="number"
                min={1}
                max={90}
                step={1}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Vista previa</p>
              <p className="mt-1">
                Un producto de {formatCOP(28500)} quedaría en{" "}
                <span className="font-semibold text-primary">
                  {formatCOP(
                    Math.round(
                      28500 * (1 - (Number(discountPercent) || 0) / 100),
                    ),
                  )}
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="promo-start">Fecha de inicio</Label>
              <input
                id="promo-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="promo-end">Fecha de fin</Label>
              <input
                id="promo-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <Label>Productos incluidos ({selectedIds.size})</Label>
            <ul className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
              {eligibleProducts.length === 0 ? (
                <li className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No hay productos disponibles en el menú.
                </li>
              ) : (
                eligibleProducts.map((product) => {
                  const checked = selectedIds.has(product.id);
                  const previewDiscount = Number(discountPercent) || 0;

                  return (
                    <li key={product.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary/50">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <img
                          src={product.image}
                          alt=""
                          className="size-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {checked && previewDiscount > 0 ? (
                            <>
                              <p className="text-[10px] text-muted-foreground line-through">
                                {formatCOP(product.price)}
                              </p>
                              <p className="font-mono text-xs font-semibold text-primary">
                                {formatCOP(
                                  Math.round(product.price * (1 - previewDiscount / 100)),
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="font-mono text-xs text-muted-foreground">
                              {formatCOP(product.price)}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Guardar promoción
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
