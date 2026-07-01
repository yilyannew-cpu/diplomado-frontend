import { ChevronDown, Home, Tag, Trophy, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOrders, type ClientModule } from "@/context/OrderContext";
import { cn } from "@/lib/utils";

export const CLIENT_MODULES: Array<{
  id: ClientModule;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "promociones", label: "Promociones", icon: Tag },
  { id: "rankin", label: "Rankin", icon: Trophy },
];

function ModuleNavGrid({
  active,
  onSelect,
  layout = "horizontal",
}: {
  active: ClientModule;
  onSelect: (id: ClientModule) => void;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <div
      className={cn(
        layout === "horizontal"
          ? "grid grid-cols-3 gap-2"
          : "flex flex-col gap-2",
      )}
    >
      {CLIENT_MODULES.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition-all",
              layout === "vertical" && "flex-row justify-start gap-3 px-4 py-3",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/25 hover:bg-secondary/60",
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl",
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                layout === "vertical" && "size-9 shrink-0",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="text-center text-xs font-semibold leading-tight sm:text-sm">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Web: flecha bajo el logo → popover con módulos */
export function ClientModuleNavDesktop() {
  const { clientModule, setClientModule, setClientTab } = useOrders();
  const [open, setOpen] = useState(false);

  const handleSelect = (id: ClientModule) => {
    setClientModule(id);
    setClientTab("menu");
    setOpen(false);
  };

  return (
    <div className="hidden shrink-0 flex-col items-center gap-0.5 md:flex">
      <BrandLogo size="md" linkTo="/" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Abrir módulos de navegación"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-3" sideOffset={8}>
          <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Módulos
          </p>
          <ModuleNavGrid
            active={clientModule}
            onSelect={handleSelect}
            layout="horizontal"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Móvil: logo abre sidebar lateral */
export function ClientModuleNavMobile({
  slogan,
  subtitle,
}: {
  slogan?: boolean;
  subtitle?: string;
}) {
  const { clientModule, setClientModule, setClientTab } = useOrders();
  const [open, setOpen] = useState(false);

  const handleSelect = (id: ClientModule) => {
    setClientModule(id);
    setClientTab("menu");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        aria-label="Abrir menú de módulos"
      >
        <BrandLogo size="sm" iconOnly={slogan} compact={!slogan} linkTo={null} />
      </button>
      <SheetContent side="left" className="w-[min(100%,280px)] p-0">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle className="font-display text-lg">FFCore</SheetTitle>
          {slogan && subtitle && (
            <p className="text-xs font-medium text-primary">{subtitle}</p>
          )}
        </SheetHeader>
        <div className="p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Navegación
          </p>
          <ModuleNavGrid
            active={clientModule}
            onSelect={handleSelect}
            layout="vertical"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
