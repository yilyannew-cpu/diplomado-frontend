import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { ClientTabNav } from "@/components/cliente/ClientTabNav";
import { PromocionesPanel } from "@/components/cliente/PromocionesPanel";
import { RankinPanel } from "@/components/cliente/RankinPanel";
import { MisPedidosPanel } from "@/components/cliente/MisPedidosPanel";
import { OrderTrackingPanel } from "@/components/cliente/OrderTrackingPanel";
import { BRAND_SLOGAN } from "@/components/shared/BrandLogo";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ClienteProvider, useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { resolveClientComuna } from "@/lib/clientComunaStorage";
import { getProductPricing } from "@/lib/promotions";
import { isCustomizableMainDish } from "@/lib/orderCustomizations";
import {
  getRestaurantProximity,
  sortRestaurantsByProximity,
} from "@/lib/restaurantProximity";
import { DiscountBadge, ProductPriceDisplay } from "@/components/shared/ProductPriceDisplay";
import { ProductDetailModal } from "@/components/cliente/ProductDetailModal";
import { RestaurantDetailView } from "@/components/cliente/RestaurantDetailView";
import { ProductImage } from "@/components/shared/ProductImage";
import type { MenuItem } from "@/types/menu";
import type { Restaurant } from "@/types/restaurant";
import { cn } from "@/lib/utils";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function productMatchesQuery(product: MenuItem, query: string): boolean {
  if (!query) return true;
  const haystack = normalizeSearch(
    [product.name, product.description, product.category].filter(Boolean).join(" "),
  );
  return query.split(/\s+/).every((token) => haystack.includes(token));
}

function InicioProductCard({
  product,
  brand,
  onSelectRestaurant,
  onAdd,
}: {
  product: MenuItem;
  brand?: Restaurant;
  onSelectRestaurant: (id: string) => void;
  onAdd: (item: MenuItem) => void;
}) {
  const { promotions } = useCliente();
  const pricing = getProductPricing(product, promotions);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5",
        !product.available && "opacity-60",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary sm:aspect-[4/3]">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {pricing.hasPromotion ? (
          <span className="absolute right-3 top-3">
            <DiscountBadge percent={pricing.discountPercent} />
          </span>
        ) : null}
        {!product.available && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream">
            Agotado
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground">
          {product.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {brand && (
          <button
            type="button"
            onClick={() => onSelectRestaurant(brand.id)}
            className="mb-2 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-border bg-secondary/60 py-1 pl-1 pr-2.5 text-[11px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            title={`Ver más de ${brand.name}`}
          >
            <span
              className="grid size-5 place-items-center overflow-hidden rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: brand.accent }}
            >
              {brand.logo ? (
                <img src={brand.logo} alt="" className="size-full object-cover" />
              ) : (
                brand.initials
              )}
            </span>
            <span className="truncate">{brand.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-amber-brand">★ {brand.rating.toFixed(1)}</span>
          </button>
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">{product.name}</h3>
          <ProductPriceDisplay pricing={pricing} />
        </div>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground text-pretty sm:line-clamp-none">
          {product.description}
        </p>
        <button
          type="button"
          disabled={!product.available}
          onClick={() => onAdd(product)}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
        >
          {product.available
            ? isCustomizableMainDish(product)
              ? "Personalizar"
              : "+ Añadir a la orden"
            : "No disponible"}
        </button>
      </div>
    </article>
  );
}

export const Route = createFileRoute("/cliente")({
  head: () => ({
    meta: [
      { title: "Cliente · FFCore" },
      { name: "description", content: "Catálogo interactivo, carrito reactivo y seguimiento en tiempo real del pedido." },
    ],
  }),
  component: () => (
    <RoleGuard role="cliente">
      <ClienteProvider>
        <ClienteView />
      </ClienteProvider>
    </RoleGuard>
  ),
});

function ClienteView() {
  const {
    menu,
    allMenus,
    isLoadingMenu,
    bootstrapError,
    addToCart,
    fetchProductDetail,
    clientTab,
    clientModule,
    promotions,
    restaurants,
    activeRestaurantId,
    restaurantDetailOpen,
    openRestaurantDetail,
    refreshCatalog,
    ensureAllMenus,
    isLoadingAllMenus,
  } = useCliente();
  const { user } = useAuth();
  const clientComuna = resolveClientComuna(user);
  const [activeCat, setActiveCat] = useState<string>("Todo");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ product: MenuItem; basePrice: number } | null>(null);

  const sortedRestaurants = useMemo(
    () => sortRestaurantsByProximity(restaurants, clientComuna),
    [restaurants, clientComuna],
  );

  const normalizedQuery = useMemo(() => normalizeSearch(searchQuery), [searchQuery]);
  const isGlobalSearch = normalizedQuery.length > 0;

  useEffect(() => {
    if (!isGlobalSearch) return;
    void ensureAllMenus();
  }, [isGlobalSearch, ensureAllMenus]);

  const catalogSource = isGlobalSearch ? allMenus : menu;

  const categories = useMemo(() => {
    const present = new Set(catalogSource.map((m) => m.category));
    const preferred = ["Entradas", "Platos principales", "Bebidas", "Adiciones"];
    const ordered = preferred.filter((name) => present.has(name));
    const extras = Array.from(present)
      .filter((name) => !preferred.includes(name))
      .sort((a, b) => a.localeCompare(b, "es"));
    return [...ordered, ...extras, "Todo"];
  }, [catalogSource]);

  const filtered = useMemo(() => {
    const matches = catalogSource.filter(
      (m) =>
        m.available &&
        (activeCat === "Todo" || m.category === activeCat) &&
        productMatchesQuery(m, normalizedQuery),
    );

    if (!isGlobalSearch) return matches;

    return [...matches].sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      return a.name.localeCompare(b.name, "es");
    });
  }, [catalogSource, activeCat, normalizedQuery, isGlobalSearch]);

  const restaurantById = useMemo(
    () => Object.fromEntries(restaurants.map((r) => [r.id, r])),
    [restaurants],
  );

  useEffect(() => {
    setActiveCat("Todo");
  }, [activeRestaurantId]);

  useEffect(() => {
    if (isGlobalSearch) setActiveCat("Todo");
  }, [isGlobalSearch]);

  const handleRefreshCatalog = async () => {
    setIsRefreshing(true);
    try {
      await refreshCatalog();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddProduct = async (product: MenuItem) => {
    if (isCustomizableMainDish(product)) {
      try {
        const full = await fetchProductDetail(product.id);
        const pricing = getProductPricing(full, promotions);
        setSelectedProduct({ product: full, basePrice: pricing.salePrice });
      } catch {
        const pricing = getProductPricing(product, promotions);
        setSelectedProduct({ product, basePrice: pricing.salePrice });
      }
      return;
    }
    addToCart(product);
  };

  if (isLoadingMenu && menu.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-primary font-semibold text-xl">Cargando menú delicioso...</div>
      </div>
    );
  }

  if (bootstrapError && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
        <p className="text-sm text-destructive">{bootstrapError}</p>
      </div>
    );
  }

  if (!isLoadingMenu && restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <TopBar
          title={BRAND_SLOGAN.headline}
          subtitle={BRAND_SLOGAN.tagline}
          slogan
        />
        <main className="page-container">
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">Aún no hay restaurantes</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando un restaurante se registre y quede activo en la plataforma, aparecerá aquí con su menú.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
          <PromocionesPanel onAdd={handleAddProduct} />
        ) : clientModule === "rankin" ? (
          <RankinPanel />
        ) : clientModule === "mis-pedidos" ? (
          <MisPedidosPanel />
        ) : restaurantDetailOpen ? (
          <RestaurantDetailView />
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
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <span className="text-xs text-muted-foreground">
                {filtered.length} productos
              </span>
              <button
                type="button"
                onClick={() => void handleRefreshCatalog()}
                disabled={isRefreshing || isLoadingMenu}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualizar menú
              </button>
            </div>
          </div>

          <div className="relative mb-6 sm:mb-8">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en todos los menús (ej. papas, hamburguesa…)"
              aria-label="Buscar productos en todos los restaurantes"
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/70 focus:ring-2"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {isGlobalSearch ? (
            <p className="mb-4 text-xs text-muted-foreground">
              {isLoadingAllMenus
                ? "Buscando en todos los restaurantes…"
                : "Resultados de todos los restaurantes · ordenados de menor a mayor precio"}
            </p>
          ) : null}

          {/* Restaurants quick access */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:text-[11px] sm:tracking-[0.2em]">
                {clientComuna ? `Restaurantes · ${clientComuna}` : "Restaurantes"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-4">
              {sortedRestaurants.map((r) => {
                const isActive = activeRestaurantId === r.id;
                const proximity = getRestaurantProximity(r, clientComuna);
                return (
                  <button
                    key={r.id}
                    onClick={() => openRestaurantDetail(r.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
                      isActive ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
                    }`}
                  >
                    <span
                      className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl font-display text-sm font-semibold text-white sm:size-11"
                      style={{ backgroundColor: r.accent || "#4f46e5" }}
                    >
                      {r.logo ? (
                        <img src={r.logo} alt="" className="size-full object-cover" />
                      ) : (
                        r.initials
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-sm font-semibold leading-snug">
                        {r.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-0.5 font-medium text-amber-brand">
                          ★ {r.rating?.toFixed(1) || "0.0"}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{r.deliveryMinutes || 30} min</span>
                      </span>
                      {proximity === "recomendado" ? (
                        <span className="mt-1.5 inline-flex rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Recomendado
                        </span>
                      ) : proximity === "lejos" ? (
                        <span className="mt-1.5 inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Lejos de ti
                        </span>
                      ) : null}
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

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
              {normalizedQuery
                ? `No hay productos que coincidan con “${searchQuery.trim()}”.`
                : "No hay productos con estos filtros."}
            </p>
          ) : (
            <>
              {/* Móvil: carrusel al deslizar (sin botones), igual que promociones */}
              <div className="sm:hidden">
                <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {filtered.map((p) => (
                      <CarouselItem key={p.id} className="basis-[85%] pl-3">
                        <InicioProductCard
                          product={p}
                          brand={restaurantById[p.restaurantId]}
                          onSelectRestaurant={openRestaurantDetail}
                          onAdd={handleAddProduct}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>

              {/* Tablet / desktop: grid */}
              <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <InicioProductCard
                    key={p.id}
                    product={p}
                    brand={restaurantById[p.restaurantId]}
                    onSelectRestaurant={openRestaurantDetail}
                    onAdd={handleAddProduct}
                  />
                ))}
              </div>
            </>
          )}
        </section>
        )}
      </main>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct.product}
          basePrice={selectedProduct.basePrice}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}