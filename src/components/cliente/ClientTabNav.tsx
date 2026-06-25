import { Menu, Radio } from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import { cn } from "@/lib/utils";

export function ClientTabNav() {
  const { clientTab, setClientTab, activeClientOrderId, orders } = useOrders();

  const activeOrder = activeClientOrderId
    ? orders.find((o) => o.id === activeClientOrderId)
    : undefined;

  const hasTracking = Boolean(activeOrder);
  const isInProgress = activeOrder && activeOrder.status !== "Entregado";

  return (
    <nav
      className="mb-6 flex gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm sm:mb-8 sm:p-1.5"
      aria-label="Navegación del cliente"
    >
      <button
        type="button"
        onClick={() => setClientTab("menu")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
          clientTab === "menu"
            ? "bg-ink text-cream shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Menu className="size-3.5 sm:size-4" />
        Menú
      </button>

      <button
        type="button"
        onClick={() => setClientTab("tracking")}
        disabled={!hasTracking}
        className={cn(
          "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
          clientTab === "tracking"
            ? "bg-ink text-cream shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          !hasTracking && "cursor-not-allowed opacity-45",
        )}
      >
        <Radio
          className={cn("size-3.5 sm:size-4", isInProgress && clientTab !== "tracking" && "text-primary")}
        />
        <span className="sm:hidden">Pedido</span>
        <span className="hidden sm:inline">Esperando pedido</span>
        {isInProgress && (
          <span className="absolute right-2 top-1.5 size-2 rounded-full bg-amber-brand animate-order-dot-blink sm:right-3 sm:top-2" />
        )}
      </button>
    </nav>
  );
}
