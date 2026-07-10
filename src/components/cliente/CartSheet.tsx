import { useState, useEffect } from "react";
import { CreditCard, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatCOP, useCliente } from "@/context/ClienteContext";
import { formatCustomizationLines } from "@/lib/orderCustomizations";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
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
  } = useCliente();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("Av. 0 #12-34, Caobos, Cúcuta");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (user?.name) setCustomerName(user.name);
    if (user?.phone) setPhone(user.phone);
  }, [user?.name, user?.phone]);

  const deliveryFee = cart.length > 0 ? DEFAULT_DELIVERY_FEE_COP : 0;
  const total = cartTotal + deliveryFee;

  const handleOpenChange = (open: boolean) => {
    setCartOpen(open);
    if (!open) {
      setStep("cart");
      setIsPaying(false);
    }
  };

  const handlePay = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim() || !phone.trim()) return;
    setIsPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    try {
      await confirmCart({
        name: customerName.trim(),
        address,
        phone: phone.trim(),
      });
    } catch (e) {
      console.error("Error creating order:", e);
      alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
      setIsPaying(false);
      return;
    }
    setIsPaying(false);
    setStep("cart");
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
                    <dd className="font-mono tabular-nums">{formatCOP(deliveryFee)}</dd>
                  </div>
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
          <div className="flex flex-1 flex-col">
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
                <label htmlFor="checkout-address" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dirección de entrega
                </label>
                <textarea
                  id="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
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
