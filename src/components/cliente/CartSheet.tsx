import { useState, useEffect } from "react";
import { CreditCard, LocateFixed, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCOP, useCliente } from "@/context/ClienteContext";
import { formatCustomizationLines } from "@/lib/orderCustomizations";
import {
  calculateDeliveryFeeFromRoute,
  DEFAULT_DELIVERY_FEE_COP,
  DELIVERY_BASE_FEE_COP,
  type DeliveryFeeBreakdown,
} from "@/lib/deliveryFees";
import {
  buildRestaurantOriginQuery,
  formatRouteEta,
  resolveDeliveryRoute,
} from "@/lib/deliveryRoute";
import { persistClientAddress, readClientAddress, readClientAddressCoords } from "@/lib/clientAddressStorage";
import { resolveCurrentLocation } from "@/lib/geolocationAddress";
import { getProductPricing } from "@/lib/promotions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CheckoutStep = "cart" | "payment";

export function CartSheet() {
  const { user } = useAuth();
  const {
    cart,
    cartTotal,
    cartItemCount,
    cartOpen,
    setCartOpen,
    removeFromCart,
    confirmCart,
    promotions,
    restaurants,
    activeRestaurantId,
  } = useCliente();

  const restaurant =
    restaurants.find((r) => r.id === activeRestaurantId) ?? restaurants[0] ?? null;

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [courierNote, setCourierNote] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE_COP);
  const [feeBreakdown, setFeeBreakdown] = useState<DeliveryFeeBreakdown | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [estimatingFee, setEstimatingFee] = useState(false);

  useEffect(() => {
    if (user?.name) setCustomerName(user.name);
    if (user?.phone) setPhone(user.phone);
    if (user?.id) {
      const saved = readClientAddress(user.id);
      if (saved) setAddress(saved);
    }
  }, [user?.id, user?.name, user?.phone]);

  useEffect(() => {
    if (cart.length === 0 || !restaurant || !address.trim()) {
      setDeliveryFee(DEFAULT_DELIVERY_FEE_COP);
      setFeeBreakdown(null);
      setEtaSeconds(null);
      setEstimatingFee(false);
      return;
    }

    let cancelled = false;
    setEstimatingFee(true);

    const savedAddress = user?.id ? readClientAddress(user.id) : null;
    const savedCoords =
      user?.id &&
      savedAddress &&
      savedAddress.trim().toLowerCase() === address.trim().toLowerCase()
        ? readClientAddressCoords(user.id)
        : null;

    const timer = window.setTimeout(() => {
      void resolveDeliveryRoute({
        originQuery: buildRestaurantOriginQuery(restaurant),
        destinationQuery: address.trim(),
        destinationCoords: savedCoords,
      })
        .then((route) => {
          if (cancelled) return;
          const breakdown = calculateDeliveryFeeFromRoute({
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
          });
          setEtaSeconds(route.durationSeconds);
          setFeeBreakdown(breakdown);
          setDeliveryFee(breakdown.total_domicilio);
        })
        .catch(() => {
          if (cancelled) return;
          setEtaSeconds(null);
          setFeeBreakdown(null);
          setDeliveryFee(DEFAULT_DELIVERY_FEE_COP);
        })
        .finally(() => {
          if (!cancelled) setEstimatingFee(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [address, restaurant, cart.length, user?.id]);

  const appliedDeliveryFee = cart.length > 0 ? deliveryFee : 0;
  const total = cartTotal + appliedDeliveryFee;

  const handleOpenChange = (open: boolean) => {
    setCartOpen(open);
    if (!open) {
      setStep("cart");
      setIsPaying(false);
      setCourierNote("");
      setLocationError(null);
    }
  };

  const handleUseLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const loc = await resolveCurrentLocation();
      setAddress(loc.address);
      if (user?.id) {
        persistClientAddress(user.id, loc.address, { lat: loc.lat, lng: loc.lng });
      }
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "No se pudo obtener la ubicación.",
      );
    } finally {
      setLocating(false);
    }
  };

  const handlePay = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !phone.trim()) return;
    setIsPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    try {
      if (user?.id && address.trim()) {
        persistClientAddress(user.id, address.trim());
      }
      await confirmCart({
        name: customerName.trim(),
        address,
        phone: phone.trim(),
        notes: courierNote.trim() || undefined,
        deliveryFee,
      });
    } catch (e) {
      console.error("Error creating order:", e);
      alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
      setIsPaying(false);
      return;
    }
    setIsPaying(false);
    setStep("cart");
    setCourierNote("");
    setCartOpen(false);
  };

  return (
    <Sheet open={cartOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">
            {step === "cart" ? "Tu pedido" : "Confirmar pago"}
          </SheetTitle>
          <SheetDescription>
            {step === "cart"
              ? "Revisa los productos antes de pagar."
              : "Completa el pago para enviar tu pedido a cocina."}
          </SheetDescription>
        </SheetHeader>

        {step === "cart" ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <ShoppingBag className="size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
                <p className="text-xs text-muted-foreground">
                  Añade productos del menú para empezar.
                </p>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {cart.map((c) => {
                    const pricing = getProductPricing(c.product, promotions);
                    return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => removeFromCart(c.id)}
                          className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-xs hover:bg-secondary"
                          aria-label="Quitar uno"
                        >
                          −
                        </button>
                        <span className="shrink-0 font-mono text-xs tabular-nums">{c.quantity}×</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{c.product.name}</span>
                          {c.customizations && formatCustomizationLines(c.customizations).length > 0 && (
                            <span className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                              {formatCustomizationLines(c.customizations).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-xs tabular-nums">
                        {formatCOP((pricing.salePrice + (c.customizations?.extraPrice || 0)) * c.quantity)}
                      </span>
                    </li>
                    );
                  })}
                </ul>

                <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd className="font-mono tabular-nums">{formatCOP(cartTotal)}</dd>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <dt>Domicilio</dt>
                    <dd className="font-mono tabular-nums">
                      {estimatingFee ? "Calculando…" : formatCOP(appliedDeliveryFee)}
                    </dd>
                  </div>
                  {feeBreakdown && address.trim() ? (
                    <div className="space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                      <p>
                        Ruta ≈ {feeBreakdown.distancia_km} km ·{" "}
                        {etaSeconds != null
                          ? formatRouteEta(etaSeconds)
                          : `≈ ${feeBreakdown.tiempo_estimado_minutos} min`}
                      </p>
                      <p>
                        Base {formatCOP(feeBreakdown.tarifa_base)}
                        {feeBreakdown.valor_km_adicionales > 0
                          ? ` + km extra ${formatCOP(feeBreakdown.valor_km_adicionales)}`
                          : ""}
                        {feeBreakdown.recargo_trafico > 0
                          ? ` + tráfico ${formatCOP(feeBreakdown.recargo_trafico)}`
                          : ""}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      La tarifa se calcula por kilómetros de ruta (mín.{" "}
                      {formatCOP(DELIVERY_BASE_FEE_COP)}). Indica tu dirección para confirmarla.
                    </p>
                  )}
                  <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold">
                    <dt>Total</dt>
                    <dd className="font-mono text-primary tabular-nums">{formatCOP(total)}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setStep("payment")}
                  className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Ir a pagar
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label htmlFor="checkout-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nombre
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                />
              </div>

              <div>
                <label htmlFor="checkout-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Teléfono
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                />
              </div>

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Dirección de entrega
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleUseLocation()}
                    disabled={locating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
                  >
                    {locating ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <LocateFixed className="size-3.5" aria-hidden />
                    )}
                    {locating ? "Detectando…" : "Usar mi ubicación"}
                  </button>
                </div>
                <textarea
                  id="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Usa tu ubicación o escribe tu dirección"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
                />
                {locationError ? (
                  <p className="mt-1 text-xs text-destructive">{locationError}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="checkout-courier-note" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nota al repartidor
                </label>
                <input
                  id="checkout-courier-note"
                  type="text"
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  maxLength={500}
                  placeholder="Casa de dos pisos / Apartamento 201"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/70 focus:ring-2"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="size-4 text-primary" />
                  Pasarela de pago
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulación de pago — al confirmar se crea tu pedido y podrás ver el estado en tiempo real.
                </p>
                <p className="mt-3 font-mono text-lg font-semibold text-primary tabular-nums">
                  {formatCOP(total)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Incluye domicilio {formatCOP(appliedDeliveryFee)}
                  {etaSeconds != null ? ` · ruta ${formatRouteEta(etaSeconds)}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-auto flex gap-2 pt-6">
              <button
                type="button"
                onClick={() => setStep("cart")}
                disabled={isPaying}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying || !address.trim() || !customerName.trim() || !phone.trim()}
                className="flex-1 rounded-xl bg-ink py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPaying ? "Procesando…" : "Pagar ahora"}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
