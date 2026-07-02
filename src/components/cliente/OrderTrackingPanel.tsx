import { MapPin, Package } from "lucide-react";
import { StatusStepIcon } from "@/components/cliente/StatusStepIcon";
import { formatCOP, useOrders } from "@/context/OrderContext";
import { CLIENT_STATUS_FLOW } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

export function OrderTrackingPanel() {
  const { orders, activeClientOrderId, menu } = useOrders();

  const order = activeClientOrderId
    ? orders.find((o) => o.id === activeClientOrderId)
    : undefined;

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
      <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl bg-ink text-cream shadow-2xl shadow-ink/20 sm:rounded-3xl">
        <div className="border-b border-white/10 bg-gradient-to-br from-ink via-ink to-primary/30 px-4 py-6 sm:px-8 sm:py-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-brand sm:text-[11px] sm:tracking-[0.3em]">
            Esperando pedido
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-cream/60 sm:text-sm">Código de seguimiento</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-cream sm:text-4xl md:text-5xl">
                {order.id}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-cream/60 sm:text-sm">Estado actual</p>
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
          <p className="mt-4 flex items-start gap-2 text-xs text-cream/70 sm:text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-amber-brand" />
            <span className="text-pretty">{order.address}</span>
          </p>
          <p className="mt-1 text-xs text-cream/50">
            Pedido a las {order.createdAt} · Total {formatCOP(order.total)}
          </p>
        </div>

        <div className="px-4 py-8 sm:px-8 sm:py-10">
          <ol className="space-y-0">
            {CLIENT_STATUS_FLOW.map((status, idx) => {
              const completed = idx < safeIdx;
              const active = idx === safeIdx;
              const pending = idx > safeIdx;

              return (
                <li key={status} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "relative grid size-12 shrink-0 place-items-center rounded-full border-2 transition-all duration-500",
                        active &&
                          "border-amber-brand bg-amber-brand/15 shadow-[0_0_20px_oklch(0.75_0.16_75/0.25)]",
                        completed && "border-primary bg-primary/90 text-primary-foreground",
                        pending && "border-white/15 bg-white/5 text-cream/30",
                      )}
                    >
                      <StatusStepIcon
                        status={status}
                        active={active}
                        completed={completed}
                        className={cn(
                          active && "text-amber-brand",
                          completed && "text-primary-foreground",
                          pending && "text-cream/30",
                        )}
                      />
                      {active && (
                        <span className="absolute inset-0 rounded-full border-2 border-amber-brand/40 animate-ping" />
                      )}
                    </span>

                    {idx < CLIENT_STATUS_FLOW.length - 1 && (
                      <div className="relative my-1 h-12 w-1 overflow-hidden rounded-full bg-white/10">
                        {completed && (
                          <span className="absolute inset-0 rounded-full bg-primary" />
                        )}
                        {active && (
                          <span className="absolute inset-0 rounded-full animate-order-line-flow" />
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "pb-10 transition-colors duration-500",
                      active && "text-cream",
                      completed && "text-cream/75",
                      pending && "text-cream/35",
                    )}
                  >
                    <p
                      className={cn(
                        "font-display text-lg font-semibold leading-tight",
                        active && "text-amber-brand",
                      )}
                    >
                      {status}
                    </p>
                    <p className="mt-1 text-sm text-cream/45">
                      {active
                        ? "En curso — actualizando en tiempo real"
                        : completed
                          ? "Completado"
                          : "Pendiente"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {isDelivered && (
            <div className="mt-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-center">
              <p className="font-display text-lg font-semibold text-primary">
                ¡Pedido entregado!
              </p>
              <p className="mt-1 text-sm text-cream/60">
                Gracias por usar FFCore. ¡Buen provecho!
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-4 sm:px-8 sm:py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-cream/40">
            Resumen del pedido
          </p>
          <ul className="space-y-2">
            {order.items.map((item) => {
              const product = menu.find((m) => m.id === item.productId);
              return (
                <li
                  key={item.productId}
                  className="flex justify-between text-sm text-cream/70"
                >
                  <span>
                    {item.quantity}× {product?.name ?? item.productId}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatCOP((product?.price ?? 0) * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
