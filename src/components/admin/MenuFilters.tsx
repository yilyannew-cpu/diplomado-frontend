import { ChevronDown, Filter, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type Category } from "@/mocks/menuMock";
import { cn } from "@/lib/utils";

export type MenuAvailabilityFilter = "all" | "available" | "unavailable";
export type MenuCategoryFilter = "all" | Category;

export interface MenuFiltersState {
  category: MenuCategoryFilter;
  availability: MenuAvailabilityFilter;
}

export const DEFAULT_MENU_FILTERS: MenuFiltersState = {
  category: "all",
  availability: "all",
};

const AVAILABILITY_OPTIONS: { value: MenuAvailabilityFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "available", label: "Disponibles" },
  { value: "unavailable", label: "No disponibles" },
];

interface MenuFiltersProps {
  value: MenuFiltersState;
  onChange: (value: MenuFiltersState) => void;
  resultCount: number;
  totalCount: number;
}

export function MenuFilters({ value, onChange, resultCount, totalCount }: MenuFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    value.category !== DEFAULT_MENU_FILTERS.category ||
    value.availability !== DEFAULT_MENU_FILTERS.availability;

  const handleReset = () => {
    onChange(DEFAULT_MENU_FILTERS);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-left shadow-sm transition-colors",
          "hover:border-primary/30 hover:bg-secondary/40",
          open && "border-primary/30 bg-secondary/30",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <SlidersHorizontal className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Filtros</span>
              {hasActiveFilters && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Activos
                </span>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {resultCount === totalCount
                ? `${totalCount} productos`
                : `${resultCount} de ${totalCount} productos`}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="mt-2 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="menu-filter-category" className="text-xs font-medium text-muted-foreground">
                Categoría
              </Label>
              <Select
                value={value.category}
                onValueChange={(category) =>
                  onChange({ ...value, category: category as MenuCategoryFilter })
                }
              >
                <SelectTrigger
                  id="menu-filter-category"
                  className="h-10 w-full rounded-xl border-border bg-background text-sm"
                >
                  <Filter className="mr-2 size-3.5 shrink-0 text-primary" />
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-filter-availability" className="text-xs font-medium text-muted-foreground">
                Disponibilidad
              </Label>
              <Select
                value={value.availability}
                onValueChange={(availability) =>
                  onChange({ ...value, availability: availability as MenuAvailabilityFilter })
                }
              >
                <SelectTrigger
                  id="menu-filter-availability"
                  className="h-10 w-full rounded-xl border-border bg-background text-sm"
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end border-t border-border pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function filterMenuItems(
  items: { category: Category; available: boolean }[],
  filters: MenuFiltersState,
) {
  return items.filter((item) => {
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.availability === "available" && !item.available) return false;
    if (filters.availability === "unavailable" && item.available) return false;
    return true;
  });
}
