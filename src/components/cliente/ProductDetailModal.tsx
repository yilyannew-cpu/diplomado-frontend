import { useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import type { MenuItem } from "@/mocks/menuMock";
import { type Customizations, useOrders, formatCOP } from "@/context/OrderContext";

interface ProductDetailModalProps {
  product: MenuItem;
  onClose: () => void;
  basePrice: number;
}

export function ProductDetailModal({ product, onClose, basePrice }: ProductDetailModalProps) {
  const { addToCart } = useOrders();
  
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());
  const [addedModifiers, setAddedModifiers] = useState<Record<string, string[]>>({});

  const handleToggleIngredient = (id: string) => {
    setRemovedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleModifier = (groupId: string, optionId: string, max: number) => {
    setAddedModifiers((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (max === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      if (current.length < max) {
        return { ...prev, [groupId]: [...current, optionId] };
      }
      return prev;
    });
  };

  let extraPrice = 0;
  product.modifierGroups?.forEach((group) => {
    const selected = addedModifiers[group.id] || [];
    selected.forEach((optId) => {
      const opt = group.options.find((o) => o.id === optId);
      if (opt) extraPrice += opt.priceExtra;
    });
  });

  const finalPrice = basePrice + extraPrice;

  // Validation
  let isValid = true;
  product.modifierGroups?.forEach((group) => {
    const selected = addedModifiers[group.id] || [];
    if (selected.length < group.minSelections) {
      isValid = false;
    }
  });

  const handleAdd = () => {
    if (!isValid) return;
    
    let hasCustomizations = false;
    if (removedIngredients.size > 0) hasCustomizations = true;
    for (const group of Object.keys(addedModifiers)) {
      if (addedModifiers[group].length > 0) hasCustomizations = true;
    }

    const customData: Customizations | undefined = hasCustomizations ? {
      removedIngredients: Array.from(removedIngredients).map(id => {
        const ing = product.ingredients?.find(i => i.id === id);
        return ing ? ing.name : id;
      }),
      addedModifiers: Object.fromEntries(
        Object.entries(addedModifiers).map(([gId, optIds]) => {
          const group = product.modifierGroups?.find(g => g.id === gId);
          if (!group) return [gId, optIds];
          const optNames = optIds.map(oid => group.options.find(o => o.id === oid)?.name || oid);
          return [group.name, optNames];
        }).filter(([_, opts]) => opts.length > 0)
      ),
      extraPrice,
    } : undefined;

    addToCart(product, customData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-4 sm:p-6">
      <div 
        className="relative w-full overflow-hidden rounded-2xl bg-background shadow-2xl flex flex-col md:flex-row md:max-w-[80vw] md:h-[80vh] max-h-[90vh] md:max-h-[800px]"
      >
        {/* Close Button (Absolute for both layouts) */}
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 md:right-4 md:top-4"
        >
          <X className="size-5" />
        </button>

        {/* Image Section */}
        <div className="relative w-full shrink-0 bg-secondary md:w-2/5 lg:w-1/2 md:h-full aspect-video md:aspect-auto">
          <img src={product.image} alt={product.name} className="size-full object-cover" />
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 md:p-8 scrollbar-thin">
            <h2 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground">{product.description}</p>

            {product.ingredients && product.ingredients.length > 0 && (
              <div className="mt-6 md:mt-8">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredientes</h3>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                  {product.ingredients.map((ing) => {
                    const isRemoved = removedIngredients.has(ing.id);
                    return (
                      <button
                        key={ing.id}
                        onClick={() => handleToggleIngredient(ing.id)}
                        className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-left transition-colors hover:bg-secondary/50"
                      >
                        <span className={`text-sm ${isRemoved ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                          {ing.name}
                        </span>
                        <div className={`grid size-5 shrink-0 place-items-center rounded-full border ${isRemoved ? 'border-border' : 'border-primary bg-primary text-primary-foreground'}`}>
                          {isRemoved ? <Minus className="size-3 text-muted-foreground" /> : <Check className="size-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.modifierGroups && product.modifierGroups.length > 0 && (
              <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
                {product.modifierGroups.map((group) => {
                  const selected = addedModifiers[group.id] || [];
                  const isRequired = group.minSelections > 0;
                  const isFulfilled = selected.length >= group.minSelections;

                  return (
                    <div key={group.id} className="rounded-2xl border border-border/50 bg-secondary/10 p-4 md:p-5">
                      <div className="mb-4 flex items-baseline justify-between border-b border-border/50 pb-3">
                        <h3 className="text-sm md:text-base font-semibold uppercase tracking-wider">{group.name}</h3>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                          {isRequired && !isFulfilled ? <span className="text-destructive font-medium">Requerido ({group.minSelections})</span> : ''}
                          {!isRequired && group.maxSelections > 1 ? `Máx ${group.maxSelections}` : ''}
                          {isFulfilled && isRequired ? <span className="text-primary font-medium">Completado</span> : ''}
                        </span>
                      </div>
                      
                      <div className="grid gap-2 grid-cols-1">
                        {group.options.map((opt) => {
                          const isSelected = selected.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleToggleModifier(group.id, opt.id, group.maxSelections)}
                              className={`flex w-full items-center justify-between rounded-xl border p-3 md:p-4 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-secondary/50'}`}
                            >
                              <span className="text-sm md:text-base font-medium">{opt.name}</span>
                              <div className="flex items-center gap-3">
                                {opt.priceExtra > 0 && (
                                  <span className="text-xs md:text-sm text-muted-foreground">+{formatCOP(opt.priceExtra)}</span>
                                )}
                                <div className={`grid size-5 md:size-6 shrink-0 place-items-center rounded-full border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                  {isSelected && <Check className="size-3 md:size-4" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background p-4 md:p-6 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <button
              onClick={handleAdd}
              disabled={!isValid}
              className="flex w-full items-center justify-between rounded-xl bg-ink px-6 py-4 font-semibold text-cream transition-transform active:scale-[0.98] hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              <span className="text-sm md:text-base">Añadir a la orden</span>
              <span className="tabular-nums text-sm md:text-base">{formatCOP(finalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
