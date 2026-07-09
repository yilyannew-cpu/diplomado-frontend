import { Menu, type LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type PanelNavItem<T extends string = string> = {
  id: T;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export interface PanelNavProps<T extends string> {
  items: PanelNavItem<T>[];
  active: T;
  onSelect: (id: T) => void;
  hints?: Partial<Record<T, string>>;
  sheetTitle: string;
  sheetSubtitle?: string;
}

function NavButton<T extends string>({
  item,
  active,
  hint,
  disabled,
  onClick,
  staggerIndex,
  layout,
}: {
  item: PanelNavItem<T>;
  active?: boolean;
  hint?: string;
  disabled?: boolean;
  onClick?: () => void;
  staggerIndex?: number;
  layout: "sidebar" | "sheet";
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={staggerIndex !== undefined ? { animationDelay: `${staggerIndex * 55}ms` } : undefined}
      className={cn(
        "group relative w-full overflow-hidden text-left transition-all duration-300",
        layout === "sidebar" && "rounded-xl px-4 py-3",
        layout === "sheet" && "admin-nav-item-stagger rounded-2xl px-4 py-3.5",
        active
          ? "bg-ink text-cream shadow-md"
          : disabled
            ? "cursor-not-allowed text-muted-foreground"
            : layout === "sheet"
              ? "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary/70 active:scale-[0.98]"
              : "text-foreground hover:bg-secondary",
      )}
    >
      {active && layout === "sheet" && (
        <span
          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary admin-nav-active-bar"
          aria-hidden
        />
      )}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-xl transition-all duration-300",
            layout === "sidebar" ? "size-9" : "size-10",
            active
              ? "bg-primary text-primary-foreground scale-105"
              : "bg-secondary text-foreground group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary",
            disabled && "opacity-50",
          )}
        >
          <Icon className={layout === "sidebar" ? "size-4" : "size-5"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{item.label}</p>
          {hint && (
            <p
              className={cn(
                "mt-0.5 text-[11px] leading-snug",
                active ? "text-cream/60" : "text-muted-foreground",
              )}
            >
              {hint}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

export function PanelNavSidebar<T extends string>({
  items,
  active,
  onSelect,
  hints = {},
}: Pick<PanelNavProps<T>, "items" | "active" | "onSelect" | "hints">) {
  return (
    <nav className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        {items.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={active === item.id}
            hint={hints[item.id]}
            onClick={() => onSelect(item.id)}
            layout="sidebar"
          />
        ))}
      </div>
    </nav>
  );
}

export function PanelNavMobile<T extends string>({
  items,
  active,
  onSelect,
  hints = {},
  sheetTitle,
  sheetSubtitle,
}: PanelNavProps<T>) {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: T) => {
    onSelect(id);
    setOpen(false);
  };

  const activeItem = items.find((item) => item.id === active);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "relative grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-card shadow-sm transition-all duration-300 lg:hidden",
          "hover:border-primary/30 hover:bg-secondary active:scale-95",
          open && "border-primary/40 bg-primary/5",
        )}
        aria-label="Abrir menú de módulos"
        aria-expanded={open}
      >
        <Menu
          className={cn(
            "size-5 transition-transform duration-300",
            open && "rotate-90 scale-110 text-primary",
          )}
        />
        {activeItem && (
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[min(100%,300px)] border-r p-0 sm:max-w-[300px]">
          <SheetHeader className="border-b border-border bg-secondary/30 px-5 py-5 text-left">
            <SheetTitle className="font-display text-lg">{sheetTitle}</SheetTitle>
            {sheetSubtitle && <p className="text-xs text-muted-foreground">{sheetSubtitle}</p>}
            {activeItem && (
              <p className="admin-nav-item-stagger mt-2 text-[11px] font-medium text-primary">
                Módulo actual: {activeItem.shortLabel}
              </p>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-2 p-4">
            <p className="admin-nav-item-stagger px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Módulos
            </p>
            {items.map((item, index) => (
              <NavButton
                key={item.id}
                item={item}
                active={active === item.id}
                hint={hints[item.id]}
                onClick={() => handleSelect(item.id)}
                staggerIndex={index + 1}
                layout="sheet"
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
