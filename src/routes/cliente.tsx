import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { formatCOP, useOrders } from "@/context/OrderContext";
import type { Category } from "@/mocks/menuMock";
import type { OrderStatus } from "@/mocks/ordersMock";
import { restaurantsMock } from "@/mocks/restaurantsMock";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Cliente · BurgerCore" },
      { name: "description", content: "Catálogo interactivo, carrito reactivo y seguimiento en tiempo real del pedido." },
    ],
  }),
  component: () => (
    <RoleGuard role="cliente">
      <ClienteView />
    </RoleGuard>
  ),
});

const categories: Array<Category | "Todo"> = ["Todo", "Hamburguesas", "Acompañamientos", "Bebidas", "Postres"];

const STATUS_FLOW: OrderStatus[] = ["Recibido", "En Cocina", "Listo", "En Camino", "Entregado"];

function ClienteView() {
  const { menu, cart, addToCart, removeFromCart, cartTotal, orders } = useOrders();
  const [activeCat, setActiveCat] = useState<(typeof categories)[number]>("Todo");
  const [activeRest, setActiveRest] = useState<string | "Todos">("Todos");

  const filtered = useMemo(
    () =>
      menu.filter(
        (m) =>
          (activeCat === "Todo" || m.category === activeCat) &&
          (activeRest === "Todos" || m.restaurantId === activeRest),
      ),
    [menu, activeCat, activeRest],
  );

  const restaurantById = useMemo(
    () => Object.fromEntries(restaurantsMock.map((r) => [r.id, r])),
    [],
  );

  // Track the customer's most recent order (mock: PED-101 belongs to Laura)
  const currentOrder = orders.find((o) => o.id === "PED-101") ?? orders[0];
  const currentIdx = STATUS_FLOW.indexOf(currentOrder.status);
  const deliveryFee = cart.length > 0 ? 5000 : 0;

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Tu menú" subtitle="Pide, paga y haz tracking en tiempo real" />

      <main className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                Menú de temporada
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
                ¿Qué se te antoja hoy?
              </h1>
            </div>
            <span className="hidden text-xs text-muted-foreground md:block">
              {filtered.length} productos
            </span>
          </div>

          {/* Restaurants quick access */}
          <div className="mb-6">
            <div className="mb-3 flex items-end justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Restaurantes en tu zona
              </p>
              <button
                onClick={() => setActiveRest("Todos")}
                className={`text-[11px] font-medium uppercase tracking-wider transition-colors ${
                  activeRest === "Todos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {restaurantsMock.map((r) => {
                const isActive = activeRest === r.id;
                const count = menu.filter((m) => m.restaurantId === r.id).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRest(isActive ? "Todos" : r.id)}
                    className={`group flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isActive ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-white"
                      style={{ backgroundColor: r.accent }}
                    >
                      {r.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-sm font-semibold leading-tight">
                        {r.name}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5 font-medium text-amber-brand">
                          ★ {r.rating.toFixed(1)}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{r.deliveryMinutes} min</span>
                        <span aria-hidden>·</span>
                        <span>{count} ítems</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCat === c
                    ? "bg-ink text-cream"
                    : "border border-border bg-card text-foreground hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filtered.map((p) => (
              (() => {
                const brand = restaurantById[p.restaurantId];
                return (
              <article
                key={p.id}
                className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5 ${
                  !p.available ? "opacity-60" : ""
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {!p.available && (
                    <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream">
                      Agotado
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground">
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {brand && (
                    <button
                      type="button"
                      onClick={() => setActiveRest(brand.id)}
                      className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-1 pr-2.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                      title={`Ver más de ${brand.name}`}
                    >
                      <span
                        className="grid size-5 place-items-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: brand.accent }}
                      >
                        {brand.initials}
                      </span>
                      <span className="truncate">{brand.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-amber-brand">★ {brand.rating.toFixed(1)}</span>
                    </button>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold leading-tight">
                      {p.name}
                    </h3>
                    <span className="shrink-0 font-mono text-sm font-semibold text-primary">
                      {formatCOP(p.price)}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground text-pretty">
                    {p.description}
                  </p>
                  <button
                    type="button"
                    disabled={!p.available}
                    onClick={() => addToCart(p)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
                  >
                    {p.available ? "+ Añadir a la orden" : "No disponible"}
                  </button>
                </div>
              </article>
                );
              })()
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
                No hay productos con estos filtros.
              </p>
            )}
          </div>
        </section>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            {/* Cart */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Tu pedido</h3>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium">
                  {cart.reduce((a, i) => a + i.quantity, 0)} items
                </span>
              </div>

              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Tu carrito está vacío.
                </p>
              ) : (
                <ul className="mb-4 space-y-3 border-b border-border pb-4">
                  {cart.map((c) => (
                    <li
                      key={c.product.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(c.product.id)}
                          className="grid size-6 place-items-center rounded-md border border-border text-xs hover:bg-secondary"
                          aria-label="Quitar uno"
                        >
                          −
                        </button>
                        <span className="font-mono text-xs tabular-nums">{c.quantity}×</span>
                        <span>{c.product.name}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums">
                        {formatCOP(c.product.price * c.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatCOP(cartTotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>Domicilio</dt>
                  <dd className="font-mono tabular-nums">{formatCOP(deliveryFee)}</dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="font-mono text-primary tabular-nums">
                    {formatCOP(cartTotal + deliveryFee)}
                  </dd>
                </div>
              </dl>

              <button
                disabled={cart.length === 0}
                className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
              >
                Confirmar pedido
              </button>
            </div>

            {/* Tracking */}
            <div className="rounded-2xl bg-ink p-6 text-cream">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
                  Pedido en curso
                </p>
                <span className="font-mono text-xs">{currentOrder.id}</span>
              </div>
              <p className="font-display text-xl font-semibold">{currentOrder.status}</p>
              <p className="text-xs text-cream/60">
                {currentOrder.address.split(",")[0]}
              </p>

              <ol className="mt-6 space-y-5">
                {STATUS_FLOW.map((s, idx) => {
                  const reached = idx <= currentIdx;
                  const active = idx === currentIdx;
                  return (
                    <li key={s} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`size-3 rounded-full ${
                            active
                              ? "bg-amber-brand ring-4 ring-amber-brand/25"
                              : reached
                                ? "bg-primary"
                                : "bg-white/15"
                          }`}
                        />
                        {idx < STATUS_FLOW.length - 1 && (
                          <span className={`mt-1 h-8 w-px ${reached ? "bg-primary/40" : "bg-white/10"}`} />
                        )}
                      </div>
                      <div className={`-mt-1 ${reached ? "text-cream" : "text-cream/40"}`}>
                        <p className="text-sm font-medium">{s}</p>
                        <p className="text-[11px] text-cream/40">
                          {active ? "En curso" : reached ? "Completado" : "Pendiente"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}