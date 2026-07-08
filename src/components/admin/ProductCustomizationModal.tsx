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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col rounded-3xl p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border shrink-0">
          <DialogTitle className="font-display text-xl">Configurar Receta</DialogTitle>
          <DialogDescription>
            Configura los ingredientes base y las reglas extras de <span className="font-medium text-foreground">{product.name}</span>
          </DialogDescription>
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setActiveTab("ingredients")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "ingredients" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Ingredientes Base
            </button>
            <button
              onClick={() => setActiveTab("modifiers")}
              className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "modifiers" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Reglas y Extras
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-secondary/10">
          {activeTab === "ingredients" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">El cliente podrá desmarcar estos ingredientes libremente (Ej: "Sin tomate").</p>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Plus className="size-3" /> Añadir ingrediente
                </button>
              </div>

              {ingredients.map((ing, i) => (
                <div key={ing.id} className="flex items-center gap-3 bg-card border border-border p-3 rounded-xl">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, { name: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nombre del ingrediente"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={ing.available}
                      onCheckedChange={(c) => updateIngredient(i, { available: c === true })}
                      id={`ing-av-${ing.id}`}
                    />
                    <Label htmlFor={`ing-av-${ing.id}`} className="text-xs cursor-pointer">Disponible</Label>
                  </div>
                  <button onClick={() => removeIngredient(i)} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              
              {ingredients.length === 0 && (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl border-border bg-background">
                  <p className="text-sm">No hay ingredientes configurados.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Grupos de modificadores (Ej: "Término de carne", "Adiciones").</p>
                <button
                  onClick={addModifierGroup}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                >
                  <Plus className="size-3" /> Nuevo grupo
                </button>
              </div>

              {modifierGroups.map((group, gi) => (
                <div key={group.id} className="bg-card border border-border p-4 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <input
                        value={group.name}
                        onChange={(e) => updateModifierGroup(gi, { name: e.target.value })}
                        className="w-full font-semibold rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Nombre del grupo (Ej: Elige tu salsa)"
                      />
                      <div className="flex gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Mín. opciones (0 = Opcional)</Label>
                          <input
                            type="number"
                            min="0"
                            value={group.minSelections}
                            onChange={(e) => updateModifierGroup(gi, { minSelections: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">Máx. opciones</Label>
                          <input
                            type="number"
                            min="1"
                            value={group.maxSelections}
                            onChange={(e) => updateModifierGroup(gi, { maxSelections: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeModifierGroup(gi)} className="text-muted-foreground hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="pl-4 border-l-2 border-border/50 space-y-2">
                    <Label className="text-xs font-medium">Opciones:</Label>
                    {group.options.map((opt, oi) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          value={opt.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          className="flex-1 rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Nombre de opción"
                        />
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-muted-foreground">$</span>
                          <input
                            type="number"
                            min="0"
                            value={opt.priceExtra}
                            onChange={(e) => updateOption(gi, oi, { priceExtra: Number(e.target.value) })}
                            className="w-24 pl-6 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                            placeholder="Precio"
                          />
                        </div>
                        <button onClick={() => removeOption(gi, oi)} className="p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(gi)}
                      className="text-xs font-medium text-primary hover:underline mt-2 inline-block"
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

        <div className="p-4 border-t border-border bg-card flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Guardar Configuración
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
