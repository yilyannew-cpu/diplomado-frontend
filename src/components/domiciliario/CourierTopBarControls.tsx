import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Briefcase, Store, History, Navigation } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCourierApplications, type CourierTab } from "@/context/CourierApplicationsContext";

export function CourierMainControls() {
  const { user, toggleAvailability } = useAuth();
  const { activeTab, setActiveTab } = useCourierApplications();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAvailability, setPendingAvailability] = useState(false);

  const isAvailable = user?.is_available ?? false;

  const handleToggle = (checked: boolean) => {
    setPendingAvailability(checked);
    setShowConfirmDialog(true);
  };

  const confirmToggle = () => {
    toggleAvailability(pendingAvailability);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {/* Hamburger Menu (Left) */}
        <div className="flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border bg-background shadow-sm">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 flex flex-col bg-cream">
              <SheetHeader className="p-6 border-b border-border text-left">
                <SheetTitle className="font-display text-2xl font-bold">Menú</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-2 px-4">
                  <MenuLink 
                    icon={<Navigation className="size-5 text-primary" />} 
                    label="Radar de Pedidos" 
                    tab="radar"
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                  />
                  <MenuLink 
                    icon={<Briefcase className="size-5 text-amber-600" />} 
                    label="Bolsa de Empleo" 
                    tab="bolsa"
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                  />
                  <MenuLink 
                    icon={<Store className="size-5 text-emerald-600" />} 
                    label="Mis Restaurantes" 
                    tab="mis-restaurantes"
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                  />
                  <MenuLink 
                    icon={<History className="size-5 text-blue-600" />} 
                    label="Historial y Ganancias" 
                    tab="historial"
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                  />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Radar Switch (Center) */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-sm">
            <span className={`text-xs font-bold uppercase tracking-widest ${isAvailable ? "text-emerald-600" : "text-muted-foreground"}`}>
              {isAvailable ? "Buscando..." : "Desconectado"}
            </span>
            <Switch 
              checked={isAvailable}
              onCheckedChange={handleToggle}
              className={isAvailable ? "data-[state=checked]:bg-emerald-500" : ""}
            />
          </div>
        </div>

        {/* Spacer for centering (Right) */}
        <div className="flex-1"></div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="w-[90vw] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAvailability ? "¿Iniciar Turno?" : "¿Desconectarse?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAvailability 
                ? "Te pondremos en línea y empezarás a recibir notificaciones de nuevos pedidos en el radar."
                : "Dejarás de recibir notificaciones de nuevos pedidos. Los pedidos actuales seguirán en curso."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmToggle}
              className={`flex-1 rounded-xl ${pendingAvailability ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}`}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MenuLink({ icon, label, tab, activeTab, onSelect }: { icon: React.ReactNode; label: string; tab: CourierTab; activeTab: CourierTab; onSelect: (t: CourierTab) => void }) {
  const isActive = tab === activeTab;
  return (
    <SheetTrigger asChild>
      <button
        onClick={() => onSelect(tab)}
        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
          isActive 
            ? "bg-primary/10 text-primary hover:bg-primary/15" 
            : "text-foreground hover:bg-secondary/50 active:bg-secondary"
        }`}
      >
        {icon}
        {label}
      </button>
    </SheetTrigger>
  );
}
