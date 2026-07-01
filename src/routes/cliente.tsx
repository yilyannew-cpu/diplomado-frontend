import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClientTabNav } from "@/components/cliente/ClientTabNav";
import { PromocionesPanel } from "@/components/cliente/PromocionesPanel";
import { RankinPanel } from "@/components/cliente/RankinPanel";
import { OrderTrackingPanel } from "@/components/cliente/OrderTrackingPanel";
import { BRAND_SLOGAN } from "@/components/shared/BrandLogo";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { useOrders } from "@/context/OrderContext";
import { CATEGORIES, type Category } from "@/mocks/menuMock";
import { restaurantsMock } from "@/mocks/restaurantsMock";
import { getProductPricing } from "@/lib/promotions";
import { DiscountBadge, ProductPriceDisplay } from "@/components/shared/ProductPriceDisplay";

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Cliente · FFCore" },
      { name: "description", content: "Catálogo interactivo, carrito reactivo y seguimiento en tiempo real del pedido." },
    ],
  }),
  component: () => (
    <RoleGuard role="cliente">
      <ClienteView />
    </RoleGuard>
  ),
});

const categories: Array<Category | "Todo"> = ["Todo", ...CATEGORIES];

function ClienteView() {
  const { menu, addToCart, clientTab, clientModule, promotions } = useOrders();
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

  return (
    <div className="min-h-screen bg-cream">
      <TopBar
        title={BRAND_SLOGAN.headline}
        subtitle={BRAND_SLOGAN.tagline}
        slogan
      />

      <main className="page-container">
        <ClientTabNav />

        {clientTab === "tracking" ? (
          <OrderTrackingPanel />
        ) : clientModule === "promociones" ? (
          <PromocionesPanel menu={menu} onAdd={addToCart} />
        ) : clientModule === "rankin" ? (
          <RankinPanel />
        ) : (
        <section>
          <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px] sm:tracking-[0.25em]">
                Menú de temporada
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                ¿Qué se te antoja hoy?
              </h1>
            </div>
            <span className="text-xs text-muted-foreground sm:text-right">
              {filtered.length} productos
            </span>
          </div>

          {/* Restaurants quick access */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
                Restaurantes en tu zona
              </p>
              <button
                onClick={() => setActiveRest("Todos")}
                className={`shrink-0 text-[10px] font-medium uppercase tracking-wider transition-colors sm:text-[11px] ${
                  activeRest === "Todos" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ver todos
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-4">
              {restaurantsMock.map((r) => {
                const isActive = activeRest === r.id;
                const count = menu.filter((m) => m.restaurantId === r.id).length;
                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveRest(isActive ? "Todos" : r.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
                      isActive ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-white sm:size-11"
                      style={{ backgroundColor: r.accent }}
                    >
                      {r.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-sm font-semibold leading-snug">
                        {r.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
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

          <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
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
                const pricing = getProductPricing(p, promotions);
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
                  {pricing.hasPromotion ? (
                    <span className="absolute right-3 top-3">
                      <DiscountBadge percent={pricing.discountPercent} />
                    </span>
                  ) : null}
                  {!p.available && (
                    <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream">
                      Agotado
                    </span>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground">
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
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
                    <ProductPriceDisplay pricing={pricing} />
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
        )}
      </main>
    </div>
  );
}