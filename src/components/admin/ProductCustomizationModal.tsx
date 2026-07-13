import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MenuItem, Ingredient, ModifierGroup, ModifierOption } from "@/mocks/menuMock";
import { formatThousands, parseThousandsInput } from "@/lib/formatThousandsInput";

interface ProductCustomizationModalProps {
  product: MenuItem;
  open: boolean;
  onClose: () => void;
  onSave: (ingredients: Ingredient[], modifierGroups: ModifierGroup[]) => void;
}

export function ProductCustomizationModal({ product, open, onClose, onSave }: ProductCustomizationModalProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(product.ingredients || []);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(product.modifierGroups || []);

  const [activeTab, setActiveTab] = useState<"ingredients" | "modifiers">("ingredients");

  // Ingredient Handlers
  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: `ing-${Date.now()}`, name: "Nuevo Ingrediente", available: true },
    ]);
  };

  const updateIngredient = (index: number, updates: Partial<Ingredient>) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], ...updates };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = [...ingredients];
    updated.splice(index, 1);
    setIngredients(updated);
  };

  // Modifier Group Handlers
  const addModifierGroup = () => {
    setModifierGroups([
      ...modifierGroups,
      {
        id: `modg-${Date.now()}`,
        name: "Nuevo Grupo Extra",
        productId: product.id,
        minSelections: 0,
        maxSelections: 1,
        options: [],
      },
    ]);
  };

  const updateModifierGroup = (index: number, updates: Partial<ModifierGroup>) => {
    const updated = [...modifierGroups];
    updated[index] = { ...updated[index], ...updates };
    setModifierGroups(updated);
  };

  const removeModifierGroup = (index: number) => {
    const updated = [...modifierGroups];
    updated.splice(index, 1);
    setModifierGroups(updated);
  };

  // Modifier Option Handlers
  const addOption = (groupIndex: number) => {
    const updated = [...modifierGroups];
    updated[groupIndex].options.push({
      id: `modo-${Date.now()}`,
      name: "Nueva Opcion",
      priceExtra: 0,
      available: true,
      groupId: updated[groupIndex].id,
    });
    setModifierGroups(updated);
  };

  const updateOption = (groupIndex: number, optionIndex: number, updates: Partial<ModifierOption>) => {
    const updated = [...modifierGroups];
    updated[groupIndex].options[optionIndex] = { ...updated[groupIndex].options[optionIndex], ...updates };
    setModifierGroups(updated);
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const updated = [...modifierGroups];
    updated[groupIndex].options.splice(optionIndex, 1);
    setModifierGroups(updated);
  };

  const handleSave = () => {
    onSave(ingredients, modifierGroups);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-2xl flex-col overflow-hidden rounded-2xl p-0 sm:max-h-[90vh] sm:rounded-3xl">
        <DialogHeader className="shrink-0 border-b border-border p-4 pb-2 pr-12 sm:p-6 sm:pb-2 sm:pr-14">
          <DialogTitle className="font-display text-lg sm:text-xl">Configurar Receta</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configura los ingredientes base y las reglas extras de{" "}
            <span className="break-words font-medium text-foreground">{product.name}</span>
          </DialogDescription>
          
          <div className="flex gap-1 pt-3 sm:gap-4 sm:pt-4">
            <button
              onClick={() => setActiveTab("ingredients")}
              className={`min-h-10 flex-1 pb-2 text-xs font-medium transition-colors border-b-2 sm:flex-none sm:text-sm ${activeTab === "ingredients" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Ingredientes
            </button>
            <button
              onClick={() => setActiveTab("modifiers")}
              className={`min-h-10 flex-1 pb-2 text-xs font-medium transition-colors border-b-2 sm:flex-none sm:text-sm ${activeTab === "modifiers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Reglas y extras
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-secondary/10 p-4 sm:p-6">
          {activeTab === "ingredients" ? (
            <div className="space-y-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  El cliente podrá desmarcar estos ingredientes libremente (Ej: &quot;Sin tomate&quot;).
                </p>
                <button
                  onClick={addIngredient}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 sm:w-auto"
                >
                  <Plus className="size-3" /> Añadir ingrediente
                </button>
              </div>

              {ingredients.map((ing, i) => (
                <div
                  key={ing.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, { name: e.target.value })}
                    className="w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nombre del ingrediente"
                  />
                  <div className="flex items-center justify-between gap-2 sm:justify-start">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={ing.available}
                        onCheckedChange={(c) => updateIngredient(i, { available: c === true })}
                        id={`ing-av-${ing.id}`}
                      />
                      <Label htmlFor={`ing-av-${ing.id}`} className="cursor-pointer text-xs">
                        Disponible
                      </Label>
                    </div>
                    <button
                      onClick={() => removeIngredient(i)}
                      className="grid size-9 place-items-center text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar ingrediente"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {ingredients.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-background py-10 text-center text-muted-foreground">
                  <p className="text-sm">No hay ingredientes configurados.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Grupos de modificadores (Ej: &quot;Término de carne&quot;, &quot;Adiciones&quot;).
                </p>
                <button
                  onClick={addModifierGroup}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 sm:w-auto"
                >
                  <Plus className="size-3" /> Nuevo grupo
                </button>
              </div>

              {modifierGroups.map((group, gi) => (
                <div key={group.id} className="bg-card border border-border p-4 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1 space-y-3">
                      <input
                        value={group.name}
                        onChange={(e) => updateModifierGroup(gi, { name: e.target.value })}
                        className="w-full font-semibold rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Nombre del grupo (Ej: Elige tu salsa)"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <div className="min-w-0 flex-1 sm:flex-none">
                          <Label className="mb-1 block text-xs text-muted-foreground">
                            Mín. opciones (0 = Opcional)
                          </Label>
                          <input
                            type="number"
                            min="0"
                            value={group.minSelections}
                            onChange={(e) => updateModifierGroup(gi, { minSelections: Number(e.target.value) })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none sm:w-24"
                          />
                        </div>
                        <div className="min-w-0 flex-1 sm:flex-none">
                          <Label className="mb-1 block text-xs text-muted-foreground">Máx. opciones</Label>
                          <input
                            type="number"
                            min="1"
                            value={group.maxSelections}
                            onChange={(e) => updateModifierGroup(gi, { maxSelections: Number(e.target.value) })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none sm:w-24"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeModifierGroup(gi)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Eliminar grupo"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="space-y-2 border-l-2 border-border/50 pl-3 sm:pl-4">
                    <Label className="text-xs font-medium">Opciones:</Label>
                    {group.options.map((opt, oi) => (
                      <div
                        key={opt.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      >
                        <input
                          value={opt.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          className="w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Nombre de opción"
                        />
                        <div className="flex items-center gap-2">
                          <div className="relative min-w-0 flex-1 sm:flex-none">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                              $
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatThousands(opt.priceExtra)}
                              onChange={(e) =>
                                updateOption(gi, oi, {
                                  priceExtra: parseThousandsInput(e.target.value) ?? 0,
                                })
                              }
                              className="w-full rounded-lg border border-border bg-background py-2 pl-6 pr-2 font-mono text-sm tabular-nums outline-none sm:w-28"
                              placeholder="0"
                            />
                          </div>
                          <button
                            onClick={() => removeOption(gi, oi)}
                            className="grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive"
                            aria-label="Eliminar opción"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(gi)}
                      className="mt-2 inline-flex min-h-9 items-center text-xs font-medium text-primary hover:underline"
                    >
                      + Añadir opción
                    </button>
                  </div>
                </div>
              ))}
              
              {modifierGroups.length === 0 && (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl border-border bg-background">
                  <p className="text-sm">No hay grupos de modificadores configurados.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-card p-4 sm:flex-row">
          <button
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="min-h-11 flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Guardar Configuración
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
