import { Bike, Clock3, MapPin, Package, RefreshCw, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DeliveryReviewModal } from "@/components/cliente/DeliveryReviewModal";
import { DeliveryRouteMap } from "@/components/cliente/DeliveryRouteMap";
import { StatusStepIcon } from "@/components/cliente/StatusStepIcon";
import { OrderItemLines } from "@/components/shared/OrderItemLines";
import { useAuth } from "@/context/AuthContext";
import { formatCOP, useCliente } from "@/context/ClienteContext";
import { deliveryReviewsApi } from "@/lib/api/endpoints/deliveryReviews";
import { getOrderApiId } from "@/lib/api/admin/mappers";
import {
  isDeliveryReviewDone,
  markDeliveryReviewDone,
} from "@/lib/clientDeliveryReviewStorage";
import { readClientAddress, readClientAddressCoords } from "@/lib/clientAddressStorage";
import { getOrderDeliveryFee, getOrderProductSales } from "@/lib/deliveryFees";
import { CLIENT_STATUS_FLOW } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

export function OrderTrackingPanel() {
  const { user } = useAuth();
  const {
    trackedOrder,
    isTrackingLoading,
    refreshTracking,
    clearTracking,
    menu,
    restaurants,
    activeRestaurantId,
  } = useCliente();
  const [manualCode, setManualCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const order = trackedOrder;

  const destinationCoords = useMemo(() => {
    if (!user?.id || !order?.address) return null;
    const saved = readClientAddress(user.id);
    if (!saved || saved.trim().toLowerCase() !== order.address.trim().toLowerCase()) {
      return null;
    }
    return readClientAddressCoords(user.id);
  }, [user?.id, order?.address]);

  const restaurant = useMemo(() => {
    if (!order) return null;
    const fromItem = order.items
      .map((item) => menu.find((m) => m.id === item.productId)?.restaurantId)
      .find(Boolean);
    const restaurantId = order.restaurantId ?? fromItem ?? activeRestaurantId;
    if (!restaurantId) return restaurants[0] ?? null;
    return restaurants.find((r) => r.id === restaurantId) ?? restaurants[0] ?? null;
  }, [order, menu, restaurants, activeRestaurantId]);

  useEffect(() => {
    if (!order || order.status !== "Entregado") {
      setShowReviewModal(false);
      return;
    }

    const apiId = getOrderApiId(order);
    if (isDeliveryReviewDone(apiId) || isDeliveryReviewDone(order.id)) {
      setShowReviewModal(false);
      clearTracking();
      return;
    }

    let cancelled = false;
    void deliveryReviewsApi
      .getStatus(apiId)
      .then((status) => {
        if (cancelled) return;
        if (status.reviewed) {
          markDeliveryReviewDone(apiId);
          markDeliveryReviewDone(order.id);
          clearTracking();
          return;
        }
        setShowReviewModal(Boolean(status.can_review));
      })
      .catch(() => {
        // Si el endpoint aún no desplegó, igual mostrar el modal en local.
        if (!cancelled) setShowReviewModal(true);
      });

    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.orderId, order?.status, clearTracking]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!/^PED-\d+$/i.test(code)) return;
    setLookingUp(true);
    try {
      await refreshTracking(code);
    } finally {
      setLookingUp(false);
    }
  };

  if (isTrackingLoading && !order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center sm:px-8 sm:py-16">
        <RefreshCw className="mx-auto mb-4 size-8 animate-spin text-primary/50" />
        <p className="text-sm text-muted-foreground">Buscando tu pedido activo…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center sm:px-8 sm:py-12">
        <Package className="mx-auto mb-4 size-10 text-muted-foreground/40" />
        <p className="font-display text-lg font-semibold">Sin pedido activo en esta sesión</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si ya pediste, ingresa el código aquí para recuperar el seguimiento.
        </p>
        <form onSubmit={handleLookup} className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ej. PED-101"
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Código de pedido"
          />
          <button
            type="submit"
            disabled={lookingUp || !manualCode.trim()}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {lookingUp ? "Buscando…" : "Ver estado"}
          </button>
        </form>
      </div>
    );
  }

  const normalizedStatus =
    order.status === "Recogido" ? "En Camino" : order.status;
  const currentIdx = CLIENT_STATUS_FLOW.indexOf(normalizedStatus);
  const safeIdx = currentIdx >= 0 ? currentIdx : 0;
  const isDelivered = order.status === "Entregado";
  const isOnTheWay = normalizedStatus === "En Camino";
  const isPreparing = !isDelivered && !isOnTheWay;

  const deliveryFee = getOrderDeliveryFee(order);
  const productsSubtotal = getOrderProductSales(order);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-primary/5 sm:rounded-3xl">
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.08] via-card to-amber-brand/10 px-4 py-6 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary sm:text-[11px] sm:tracking-[0.3em]">
              Seguimiento del pedido
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
                  isDelivered ? "text-primary" : isOnTheWay ? "text-primary" : "text-amber-brand",
                )}
              >
                {order.status === "Recogido" ? "En Camino" : order.status}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Pedido a las {order.createdAt}
            {restaurant ? ` · ${restaurant.name}` : null}
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
                      {isLast && (completed || active)
                        ? "Completado"
                        : active
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

          {isPreparing && (
            <div className="mt-8 rounded-2xl border border-border bg-secondary/40 px-5 py-5 text-center">
              <Clock3 className="mx-auto mb-2 size-7 text-amber-brand" />
              <p className="font-display text-base font-semibold text-foreground">
                Tu pedido se está preparando
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                Cuando el domiciliario salga con tu pedido (estado <strong>En camino</strong>),
                verás aquí la ruta estimada, el tiempo de llegada y los datos del repartidor.
                No hay GPS en vivo del domiciliario.
              </p>
            </div>
          )}

          {isOnTheWay && (
            <div className="mt-8 space-y-6">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Ruta estimada · el pedido ya salió
                </p>
                <DeliveryRouteMap
                  restaurant={restaurant}
                  destinationAddress={order.address}
                  destinationCoords={destinationCoords}
                />
              </div>

              <div className="rounded-2xl border border-border bg-secondary/25 px-4 py-4 sm:px-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Detalle de tu compra
                </p>
                <OrderItemLines
                  items={order.items}
                  menu={menu}
                  showPrices
                  itemClassName="text-foreground/80"
                  customizationClassName="text-primary"
                />

                <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Productos</dt>
                    <dd className="font-mono tabular-nums">{formatCOP(productsSubtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Domicilio</dt>
                    <dd className="font-mono tabular-nums">{formatCOP(deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="font-mono text-primary tabular-nums">
                      {formatCOP(order.total)}
                    </dd>
                  </div>
                </dl>

                {order.notes?.trim() ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Nota para el repartidor:{" "}
                    <span className="text-foreground/80">{order.notes.trim()}</span>
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  Repartidor asignado
                </p>
                {order.courierName || order.deliveryPersonId ? (
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Bike className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold text-foreground">
                        {order.courierName ?? "Domiciliario asignado"}
                      </p>
                      {order.courierPhone ? (
                        <a
                          href={`tel:${order.courierPhone}`}
                          className="mt-1 inline-flex text-sm text-primary hover:underline"
                        >
                          {order.courierPhone}
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Teléfono no disponible en esta versión del seguimiento.
                        </p>
                      )}
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        Entrega en {order.address}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <UserRound className="mt-0.5 size-5 shrink-0" />
                    <p>
                      Aún no figura el nombre del repartidor. Actualiza en unos segundos; el
                      restaurante puede estar asignándolo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isDelivered && (
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center">
                <p className="font-display text-lg font-semibold text-primary">
                  ¡Pedido entregado!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gracias por usar FFCore. ¡Buen provecho!
                </p>
                {!showReviewModal &&
                (isDeliveryReviewDone(getOrderApiId(order)) || isDeliveryReviewDone(order.id)) ? (
                  <p className="mt-2 text-xs font-medium text-primary">
                    Ya recibimos tu calificación. ¡Gracias!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
                  >
                    Calificar ahora
                  </button>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-secondary/25 px-4 py-4 sm:px-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Resumen final
                </p>
                <OrderItemLines
                  items={order.items}
                  menu={menu}
                  showPrices
                  itemClassName="text-foreground/80"
                  customizationClassName="text-primary"
                />
                <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Domicilio</dt>
                    <dd className="font-mono tabular-nums">{formatCOP(deliveryFee)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <dt>Total</dt>
                    <dd className="font-mono text-primary tabular-nums">
                      {formatCOP(order.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      {order && showReviewModal ? (
        <DeliveryReviewModal
          open={showReviewModal}
          orderId={getOrderApiId(order)}
          orderCode={order.id}
          restaurantName={restaurant?.name ?? "Restaurante"}
          courierName={order.courierName}
          customerName={order.customerName || user?.name}
          hasCourier={Boolean(order.deliveryPersonId || order.courierName)}
          onDone={() => {
            const apiId = getOrderApiId(order);
            markDeliveryReviewDone(apiId);
            markDeliveryReviewDone(order.id);
            setShowReviewModal(false);
            clearTracking();
          }}
        />
      ) : null}
    </div>
  );
}
