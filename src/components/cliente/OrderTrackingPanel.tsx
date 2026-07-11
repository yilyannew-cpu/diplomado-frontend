import { MapPin, Package, RefreshCw } from "lucide-react";
import { StatusStepIcon } from "@/components/cliente/StatusStepIcon";
import { OrderItemLines } from "@/components/shared/OrderItemLines";
import { formatCOP, useCliente } from "@/context/ClienteContext";
import { CLIENT_STATUS_FLOW } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

export function OrderTrackingPanel() {
  const { trackedOrder, isTrackingLoading, refreshTracking, menu } = useCliente();

  const order = trackedOrder;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center sm:px-8 sm:py-16">
        <Package className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="font-display text-lg font-semibold">Sin pedido activo</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando confirmes y pagues un pedido, podrás seguir su estado aquí.
        </p>
      </div>
    );
  }

  const normalizedStatus =
    order.status === "Recogido" ? "En Camino" : order.status;
  const currentIdx = CLIENT_STATUS_FLOW.indexOf(normalizedStatus);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;
  const isDelivered = order.status === "Entregado";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 sm:rounded-3xl">
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.08] via-card to-amber-brand/10 px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary sm:text-[11px] sm:tracking-[0.3em]">
              Seguimiento en tiempo real
            </p>
            <button
              type="button"
              onClick={() => void refreshTracking()}
              disabled={isTrackingLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={cn("size-3", isTrackingLoading && "animate-spin")} />
              Actualizar
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground sm:text-sm">Código de seguimiento</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                {order.id}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-muted-foreground sm:text-sm">Estado actual</p>
              <p
                className={cn(
                  "mt-1 font-display text-xl font-semibold sm:text-2xl",
                  isDelivered ? "text-primary" : "text-amber-brand",
                )}
              >
                {order.status}
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-pretty text-foreground/80">{order.address}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pedido a las {order.createdAt} · Total {formatCOP(order.total)}
          </p>
        </div>

        <div className="px-3 py-7 sm:px-8 sm:py-10">
          <ol className="flex w-full items-start">
            {CLIENT_STATUS_FLOW.map((status, idx) => {
              const completed = idx < safeIdx;
              const active = idx === safeIdx;
              const pending = idx > safeIdx;
              const isLast = idx === CLIENT_STATUS_FLOW.length - 1;

              return (
                <li
                  key={status}
                  className={cn("flex min-w-0 flex-1 flex-col items-center", !isLast && "pr-0")}
                >
                  <div className="flex w-full items-center">
                    <div
                      className={cn(
                        "h-0.5 flex-1 rounded-full transition-colors duration-500",
                        idx === 0
                          ? "bg-transparent"
                          : completed || active
                            ? "bg-primary"
                            : "bg-border",
                      )}
                      aria-hidden
                    />

                    <span
                      className={cn(
                        "relative z-[1] grid size-9 shrink-0 place-items-center rounded-full border-2 transition-all duration-500 sm:size-11",
                        active &&
                          "border-amber-brand bg-amber-brand/15 shadow-[0_0_16px_oklch(0.82_0.12_88/0.35)]",
                        completed && "border-primary bg-primary text-primary-foreground",
                        pending && "border-border bg-secondary text-muted-foreground",
                      )}
                    >
                      <StatusStepIcon
                        status={status}
                        active={active}
                        completed={completed}
                        className={cn(
                          "size-3.5 sm:size-5",
                          active && "text-amber-brand",
                          completed && "text-primary-foreground",
                          pending && "text-muted-foreground/50",
                        )}
                      />
                      {active && (
                        <span className="absolute inset-0 rounded-full border-2 border-amber-brand/40 animate-ping" />
                      )}
                    </span>

                    <div
                      className={cn(
                        "relative h-0.5 flex-1 overflow-hidden rounded-full transition-colors duration-500",
                        isLast ? "bg-transparent" : completed ? "bg-primary" : "bg-border",
                      )}
                      aria-hidden
                    >
                      {!isLast && active && (
                        <span className="absolute inset-0 rounded-full animate-order-line-flow-x" />
                      )}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "mt-3 px-0.5 text-center transition-colors duration-500 sm:mt-3.5",
                      active && "text-foreground",
                      completed && "text-foreground/70",
                      pending && "text-muted-foreground/50",
                    )}
                  >
                    <p
                      className={cn(
                        "font-display text-[10px] font-semibold leading-tight sm:text-sm",
                        active && "text-amber-brand",
                      )}
                    >
                      {status}
                    </p>
                    <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block sm:text-xs">
                      {active
                        ? "En curso"
                        : completed
                          ? "Listo"
                          : "Pendiente"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {isDelivered && (
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
              <p className="font-display text-lg font-semibold text-primary">
                ¡Pedido entregado!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Gracias por usar FFCore. ¡Buen provecho!
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-secondary/30 px-4 py-4 sm:px-8 sm:py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Resumen del pedido
          </p>
          <OrderItemLines
            items={order.items}
            menu={menu}
            showPrices
            itemClassName="text-foreground/80"
            customizationClassName="text-primary"
          />
        </div>
      </div>
    </div>
  );
}
