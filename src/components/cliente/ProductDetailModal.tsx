import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { X, Check } from "lucide-react";
import type { MenuItem } from "@/mocks/menuMock";
import type { SelectedMenuExtra } from "@/mocks/ordersMock";
import { type Customizations, useCliente, formatCOP } from "@/context/ClienteContext";
import { ProductImage } from "@/components/shared/ProductImage";
import {
  ADDITION_CATEGORY,
  DRINK_CATEGORY,
  SIDE_CATEGORY,
  filterMenuExtras,
  hasMeaningfulCustomizations,
  sumExtraPrices,
} from "@/lib/orderCustomizations";

interface ProductDetailModalProps {
  product: MenuItem;
  onClose: () => void;
  basePrice: number;
}

function toExtra(item: MenuItem): SelectedMenuExtra {
  return { productId: item.id, name: item.name, price: item.price };
}

function ExtraSection({
  title,
  hint,
  options,
  selectedIds,
  onToggle,
}: {
  title: string;
  hint: string;
  options: MenuItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 md:p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider md:text-base">{title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Este restaurante aún no tiene opciones en esta categoría.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 md:p-5">
      <div className="mb-4 flex items-baseline justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider md:text-base">{title}</h3>
        <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
          Opcional
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{hint}</p>
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          const isSelected = selectedIds.has(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors md:gap-4 md:p-3 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-secondary/50"
              }`}
            >
              <ProductImage
                src={opt.image}
                alt={opt.name}
                className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border/60 md:size-14"
              />
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug md:text-base">
                {opt.name}
              </span>
              <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
                <span className="text-xs tabular-nums text-muted-foreground md:text-sm">
                  +{formatCOP(opt.price)}
                </span>
                <div
                  className={`grid size-5 shrink-0 place-items-center rounded-full border md:size-6 ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="size-3 md:size-4" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductDetailModal({ product, onClose, basePrice }: ProductDetailModalProps) {
  const { addToCart, menu } = useCliente();

  const [selectedAdditionIds, setSelectedAdditionIds] = useState<Set<string>>(new Set());
  const [selectedSideIds, setSelectedSideIds] = useState<Set<string>>(new Set());
  const [selectedDrinkIds, setSelectedDrinkIds] = useState<Set<string>>(new Set());
  const [specialInstructions, setSpecialInstructions] = useState("");

  const restaurantMenu = useMemo(
    () => menu.filter((item) => item.restaurantId === product.restaurantId),
    [menu, product.restaurantId],
  );

  const additions = useMemo(
    () => filterMenuExtras(restaurantMenu, product.restaurantId, ADDITION_CATEGORY),
    [restaurantMenu, product.restaurantId],
  );
  const sides = useMemo(
    () => filterMenuExtras(restaurantMenu, product.restaurantId, SIDE_CATEGORY),
    [restaurantMenu, product.restaurantId],
  );
  const drinks = useMemo(
    () => filterMenuExtras(restaurantMenu, product.restaurantId, DRINK_CATEGORY),
    [restaurantMenu, product.restaurantId],
  );

  const toggleInSet = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedAdditions = additions.filter((item) => selectedAdditionIds.has(item.id)).map(toExtra);
  const selectedSides = sides.filter((item) => selectedSideIds.has(item.id)).map(toExtra);
  const selectedDrinks = drinks.filter((item) => selectedDrinkIds.has(item.id)).map(toExtra);

  const extraPrice =
    sumExtraPrices(selectedAdditions) +
    sumExtraPrices(selectedSides) +
    sumExtraPrices(selectedDrinks);

  const finalPrice = basePrice + extraPrice;

  const handleAdd = () => {
    const customData: Customizations = {
      additions: selectedAdditions,
      sides: selectedSides,
      drinks: selectedDrinks,
      specialInstructions: specialInstructions.trim() || undefined,
      extraPrice,
    };

    addToCart(product, hasMeaningfulCustomizations(customData) ? customData : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-x-0 top-[var(--vv-top,0px)] z-50 flex h-[var(--vv-height,100dvh)] items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative flex max-h-[min(92dvh,var(--vv-height,92dvh))] w-full flex-col overflow-hidden rounded-t-2xl bg-background shadow-2xl sm:max-h-[90vh] sm:rounded-2xl md:h-[80vh] md:max-h-[800px] md:max-w-[80vw] md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 md:right-4 md:top-4"
        >
          <X className="size-5" />
        </button>

        {/* Desktop: imagen fija a la izquierda */}
        <div className="relative hidden shrink-0 bg-secondary md:block md:h-full md:w-2/5 lg:w-1/2">
          <ProductImage
            src={product.image}
            alt={product.name}
            className="size-full object-cover"
            loading="eager"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Móvil: imagen + opciones en el mismo scroll; el footer queda fijo abajo */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="relative aspect-[4/3] w-full bg-secondary sm:aspect-video md:hidden">
              <ProductImage
                src={product.image}
                alt={product.name}
                className="size-full object-cover"
                loading="eager"
              />
            </div>

            <div className="p-5 pb-6 md:p-8">
              <h2 className="font-display text-2xl font-bold md:text-3xl">{product.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{product.description}</p>

              <div className="mt-6 space-y-6 md:mt-8 md:space-y-8">
                <ExtraSection
                  title="Elige tus adiciones"
                  hint="Puedes elegir varias. Cada una suma su precio al plato."
                  options={additions}
                  selectedIds={selectedAdditionIds}
                  onToggle={(id) => toggleInSet(setSelectedAdditionIds, id)}
                />
                <ExtraSection
                  title="Elige tus acompañamientos"
                  hint="Opcional. Selecciona los acompañamientos que quieras."
                  options={sides}
                  selectedIds={selectedSideIds}
                  onToggle={(id) => toggleInSet(setSelectedSideIds, id)}
                />
                <ExtraSection
                  title="Elige tu bebida adicional"
                  hint="Opcional. Puedes agregar una o más bebidas."
                  options={drinks}
                  selectedIds={selectedDrinkIds}
                  onToggle={(id) => toggleInSet(setSelectedDrinkIds, id)}
                />

                <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 md:p-5">
                  <div className="mb-3 flex items-baseline justify-between border-b border-border/50 pb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider md:text-base">
                      Instrucciones especiales
                    </h3>
                    <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
                      Opcional
                    </span>
                  </div>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Ej. Sin cebolla / Sin azúcar"
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border bg-background p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] md:p-6">
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-between rounded-xl bg-ink px-6 py-4 font-semibold text-cream transition-transform hover:bg-primary active:scale-[0.98]"
            >
              <span className="text-sm md:text-base">Añadir a la orden</span>
              <span className="text-sm tabular-nums md:text-base">{formatCOP(finalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
