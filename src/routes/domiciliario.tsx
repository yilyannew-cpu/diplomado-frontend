import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { OrderSpecialInstructions } from "@/components/shared/OrderSpecialInstructions";
import { useAuth } from "@/context/AuthContext";
import { useOrders, formatCOP } from "@/context/OrderContext";
import type { Order, OrderStatus } from "@/mocks/ordersMock";

export const Route = createFileRoute("/domiciliario")({
  head: () => ({
    meta: [
      { title: "Domiciliario · FFCore" },
      { name: "description", content: "Interfaz mobile-first para entregas: buscador, ficha del cliente y cambio de estado logístico." },
    ],
  }),
  component: () => (
    <RoleGuard role="domiciliario">
      <DomiciliarioView />
    </RoleGuard>
  ),
});

const NEXT: Record<OrderStatus, { next?: OrderStatus; label: string }> = {
  Recibido: { next: "Recogido", label: "Marcar como recogido en tienda" },
  "En Cocina": { next: "Recogido", label: "Marcar como recogido en tienda" },
  Listo: { next: "Recogido", label: "Marcar como recogido en tienda" },
  Recogido: { next: "En Camino", label: "Marcar como en camino" },
  "En Camino": { next: "Entregado", label: "Marcar como entregado con éxito" },
  Entregado: { label: "Entrega completada" },
};

function DomiciliarioView() {
  const { user } = useAuth();
  const { findOrder, menu, updateOrderStatus, orders } = useOrders();
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const myActiveOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.deliveryPersonId === user?.id &&
          (o.status === "En Camino" || o.status === "Recogido"),
      ),
    [orders, user?.id],
  );

  useEffect(() => {
    if (order) return;
    const first = myActiveOrders[0];
    if (first) {
      setOrder(first);
      setCode(first.id);
    }
  }, [myActiveOrders, order]);

  useEffect(() => {
    if (!order) return;
    const fresh = orders.find((o) => o.id === order.id);
    if (!fresh || fresh.status === "Entregado") {
      const next = myActiveOrders[0] ?? null;
      setOrder(next);
      setCode(next?.id ?? "");
      return;
    }
    if (fresh.status !== order.status) {
      setOrder(fresh);
    }
  }, [orders, order, myActiveOrders]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findOrder(code);
    if (!found) {
      setError("No se encontró ningún pedido con ese código.");
      setOrder(null);
      return;
    }
    setError(null);
    setOrder(found);
  };

  const advance = () => {
    if (!order) return;
    const next = NEXT[order.status].next;
    if (!next) return;
    updateOrderStatus(order.id, next);
  };

  return (
    <div className="min-h-screen bg-lime-500 text-ink">
      <TopBar title="Ruta activa" subtitle="Buscar y entregar" />
      <main className="page-container grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
        {/* Mobile phone frame */}
        <section className="mx-auto w-full max-w-[420px] lg:max-w-none">
          <div className="overflow-hidden rounded-2xl border border-border bg-cream text-foreground shadow-xl sm:rounded-[36px] sm:border-[6px] sm:border-white/10 sm:shadow-2xl">
            <div className="bg-ink px-4 py-4 text-cream sm:px-6">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-cream/50">
                <span>9:41</span>
                <span>Domicilio · 4G</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold sm:text-2xl">Nueva entrega</h2>
                {order && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-cream">
                    {order.id}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={search} className="space-y-2 bg-cream px-4 py-4 sm:px-6 sm:py-5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Buscar pedido por código
              </label>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PED-104"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-base"
                />
                <button className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream min-[400px]:py-0">
                  Buscar
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </form>

            {order ? (
              <div className="space-y-5 bg-cream px-4 pb-6 sm:px-6">
                {/* Map */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-brand/30 via-cream to-primary/15">
                  <svg className="absolute inset-0 size-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 220 L60 200 L100 230 L160 180 L220 200 L280 150 L340 170 L400 130" stroke="oklch(0.5 0.02 60)" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
                    <path d="M0 160 L80 140 L140 160 L200 110 L260 140 L320 90 L400 110" stroke="oklch(0.5 0.02 60)" strokeOpacity="0.2" strokeWidth="1" fill="none" />
                    <path d="M40 280 Q 140 200 220 220 T 360 100" stroke="oklch(0.58 0.22 18)" strokeWidth="3" strokeDasharray="6 4" fill="none" />
                  </svg>
                  <span className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream">A</span>
                  <span className="absolute bottom-6 right-6 grid size-9 place-items-center rounded-full bg-primary text-[11px] font-bold text-cream shadow-lg shadow-primary/40">B</span>
                  <div className="absolute bottom-3 left-3 rounded-full bg-cream/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-foreground">
                    Ruta optimizada · 2.4 km
                  </div>
                </div>

                {/* Customer info */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Cliente
                  </p>
                  <h3 className="font-display text-xl font-semibold">{order.customerName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{order.address}</p>
                  {order.notes ? (
                    <div className="mt-2">
                      <OrderSpecialInstructions notes={order.notes} compact />
                    </div>
                  ) : null}
                </div>

                {/* Items mini */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <ul className="space-y-1.5 text-xs">
                    {order.items.map((i) => {
                      const p = menu.find((m) => m.id === i.productId);
                      return (
                        <li key={i.productId} className="flex justify-between">
                          <span><span className="font-mono">{i.quantity}×</span> {p?.name ?? i.productId}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-dashed border-border pt-2 text-xs font-semibold">
                    <span>Total a cobrar</span>
                    <span className="font-mono text-primary">{formatCOP(order.total)}</span>
                  </div>
                </div>

                {/* Contact actions */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${order.phone}`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-xs font-semibold uppercase tracking-wider"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72a2 2 0 0 1 1.72 2z"/></svg>
                    Llamar
                  </a>
                  <a
                    href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1c-1-.4-1.9-1-2.7-1.9-.7-.7-1.2-1.7-1.4-2.1-.1-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5s.1-.3 0-.5-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 2 3.1 4.9 4.3c.7.3 1.2.4 1.6.5.7.2 1.3.2 1.8.1.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.1-1.4-.1-.1-.3-.2-.5-.3zM12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/></svg>
                    WhatsApp
                  </a>
                </div>

                {/* Big CTA */}
                <button
                  onClick={advance}
                  disabled={!NEXT[order.status].next}
                  className="w-full rounded-2xl bg-primary py-5 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-xl shadow-primary/30 transition-transform active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
                >
                  {NEXT[order.status].label}
                </button>
              </div>
            ) : (
              <div className="bg-cream px-6 pb-10 pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Digita el código del pedido para ver la ficha de entrega.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Side queue */}
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
            Tu cola de hoy
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold">Pedidos activos</h3>
          <ul className="mt-4 space-y-2">
            {myActiveOrders.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => {
                    setOrder(o);
                    setCode(o.id);
                    setError(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    order?.id === o.id
                      ? "border-primary/40 bg-primary/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs text-cream/60">{o.id}</p>
                    <p className="font-medium">{o.customerName}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cream/80">
                    {o.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}