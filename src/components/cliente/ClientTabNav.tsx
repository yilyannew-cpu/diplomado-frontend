import { Radio } from "lucide-react";
import { useEffect } from "react";
import { ClientMenuModulesButton } from "@/components/cliente/ClientModuleNav";
import { useCliente } from "@/context/ClienteContext";
import { isTrackingCycleClosed } from "@/lib/clientDeliveryReviewStorage";
import { cn } from "@/lib/utils";

export function ClientTabNav() {
  const { clientTab, setClientTab, trackedOrder, activeClientOrderId } = useCliente();

  const showTrackingTab = Boolean(
    (trackedOrder && !isTrackingCycleClosed(trackedOrder)) ||
      (!trackedOrder && activeClientOrderId),
  );

  useEffect(() => {
    if (!showTrackingTab && clientTab === "tracking") {
      setClientTab("menu");
    }
  }, [showTrackingTab, clientTab, setClientTab]);

  const isInProgress = Boolean(trackedOrder && trackedOrder.status !== "Entregado");
  const hasActivePulse = Boolean(
    showTrackingTab &&
      (isInProgress || trackedOrder?.status === "Entregado" || activeClientOrderId),
  );

  return (
    <nav
      className="mb-6 flex gap-1 rounded-2xl bg-gray-100 p-1 shadow-sm sm:mb-8 sm:p-1.5"
      aria-label="Navegación del cliente"
    >
      <ClientMenuModulesButton className={showTrackingTab ? "flex-1" : "w-full"} />

      {showTrackingTab ? (
        <button
          type="button"
          onClick={() => setClientTab("tracking")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
            clientTab === "tracking"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-blue-100 hover:text-blue-700",
          )}
        >
          <Radio
            className={cn(
              "size-3.5 sm:size-4",
              isInProgress && clientTab !== "tracking" && "text-blue-600",
            )}
          />
          <span className="sm:hidden">Estado</span>
          <span className="hidden sm:inline">Estado del pedido</span>

          {hasActivePulse && (
            <span className="absolute right-2 top-1.5 size-2 animate-order-dot-blink rounded-full bg-blue-500 sm:right-3 sm:top-2" />
          )}
        </button>
      ) : null}
    </nav>
  );
}
