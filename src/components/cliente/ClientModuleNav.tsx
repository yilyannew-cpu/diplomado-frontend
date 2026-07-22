import { ChevronDown, ClipboardList, Home, Menu, Tag, Trophy, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
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
import { useCliente, type ClientModule } from "@/context/ClienteContext";
import { cn } from "@/lib/utils";

export const CLIENT_MODULES: Array<{
  id: ClientModule;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "promociones", label: "Promociones", icon: Tag },
  { id: "rankin", label: "Rankin", icon: Trophy },
  { id: "mis-pedidos", label: "Mis pedidos", icon: ClipboardList },
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
          ? "grid grid-cols-2 gap-2 sm:grid-cols-4"
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

/** Popover con Inicio / Promociones / Rankin — reutilizable (logo o botón Menu). */
export function ClientModulesPopover({
  open,
  onOpenChange,
  trigger,
  align = "start",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  align?: "start" | "center" | "end";
}) {
  const { clientModule, setClientModule, setClientTab } = useCliente();

  const handleSelect = (id: ClientModule) => {
    setClientModule(id);
    setClientTab("menu");
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-3" sideOffset={8}>
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
  );
}

/** Web: logo de marca (navegación de módulos vía botón Menu). */
export function ClientModuleNavDesktop() {
  return (
    <div className="hidden shrink-0 md:block">
      <BrandLogo size="lg" linkTo="/" />
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
  const { clientModule, setClientModule, setClientTab } = useCliente();
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
        <BrandLogo size="md" iconOnly={slogan} compact={!slogan} linkTo={null} />
      </button>
      <SheetContent side="left" className="w-[min(100%,280px)] p-0">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle className="sr-only">FFCore</SheetTitle>
          <BrandLogo size="md" linkTo={null} />
          {slogan && subtitle && (
            <p className="mt-2 text-xs font-medium text-primary">{subtitle}</p>
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

/** Botón “Menu” de la barra de tabs → mismas 3 opciones del logo. */
export function ClientMenuModulesButton({
  className,
}: {
  className?: string;
}) {
  const { clientTab } = useCliente();
  const [open, setOpen] = useState(false);

  return (
    <ClientModulesPopover
      open={open}
      onOpenChange={setOpen}
      align="center"
      trigger={
        <button
          type="button"
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
            className,
            clientTab === "menu"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-blue-100 hover:text-blue-700",
          )}
          aria-label="Abrir menú: Inicio, Promociones, Rankin y Mis pedidos"
        >
          <Menu className="size-3.5 sm:size-4" />
          Menu
          <ChevronDown
            className={cn(
              "size-3.5 opacity-80 transition-transform sm:size-4",
              open && "rotate-180",
            )}
          />
        </button>
      }
    />
  );
}
