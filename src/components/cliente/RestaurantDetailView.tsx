import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react";
import { ProductDetailModal } from "@/components/cliente/ProductDetailModal";
import { ProductImage } from "@/components/shared/ProductImage";
import {
  DiscountBadge,
  ProductPriceDisplay,
} from "@/components/shared/ProductPriceDisplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useCliente } from "@/context/ClienteContext";
import { clienteApi } from "@/lib/api/endpoints/cliente";
import { resolveClientComuna } from "@/lib/clientComunaStorage";
import {
  getOrderedMenuCategories,
  getPopularProducts,
  getRestaurantHeroImage,
  POPULARES_SECTION_ID,
} from "@/lib/clientRestaurantMenu";
import { isCustomizableMainDish } from "@/lib/orderCustomizations";
import { getProductPricing, isPromotionActive } from "@/lib/promotions";
import {
  extractRestaurantComuna,
  getRestaurantProximity,
} from "@/lib/restaurantProximity";
import type { MenuItem } from "@/mocks/menuMock";
import { cn } from "@/lib/utils";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function RestaurantMenuProductCard({
  product,
  onAdd,
}: {
  product: MenuItem;
  onAdd: (item: MenuItem) => void;
}) {
  const { promotions } = useCliente();
  const pricing = getProductPricing(product, promotions);

  return (
    <article
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card",
        !product.available && "opacity-55",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="size-full object-cover"
        />
        <button
          type="button"
          disabled={!product.available}
          onClick={() => onAdd(product)}
          aria-label={`Agregar ${product.name}`}
          className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-emerald-600 text-white shadow-md transition-transform active:scale-95 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
        {pricing.hasPromotion ? (
          <span className="absolute bottom-2 left-2">
            <DiscountBadge percent={pricing.discountPercent} />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-2.5">
        <ProductPriceDisplay pricing={pricing} size="sm" align="left" />
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {product.name}
        </h3>
      </div>
    </article>
  );
}

function ProductSection({
  id,
  title,
  products,
  onAdd,
}: {
  id: string;
  title: string;
  products: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section id={`rest-section-${id}`} className="scroll-mt-28">
      <h2 className="mb-3 font-display text-xl font-semibold tracking-tight sm:mb-4 sm:text-2xl">
        {title}
      </h2>

      <div className="sm:hidden">
        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
          <CarouselContent className="-ml-3">
            {products.map((product) => (
              <CarouselItem key={product.id} className="basis-[42%] pl-3 min-[400px]:basis-[38%]">
                <RestaurantMenuProductCard product={product} onAdd={onAdd} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="hidden gap-4 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <RestaurantMenuProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}

export function RestaurantDetailView() {
  const {
    restaurants,
    activeRestaurantId,
    menu,
    promotions,
    isLoadingMenu,
    closeRestaurantDetail,
    addToCart,
    fetchProductDetail,
  } = useCliente();
  const { user } = useAuth();
  const clientComuna = resolveClientComuna(user);

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId) ?? null;
  const proximity = restaurant ? getRestaurantProximity(restaurant, clientComuna) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState(POPULARES_SECTION_ID);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [proximityInfoOpen, setProximityInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    product: MenuItem;
    basePrice: number;
  } | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const restaurantComuna = restaurant
    ? extractRestaurantComuna(restaurant.city)
    : null;
  const deliveryMinutes = restaurant?.deliveryMinutes || 30;

  const availableMenu = useMemo(() => menu.filter((m) => m.available), [menu]);
  const popular = useMemo(
    () => getPopularProducts(availableMenu, promotions, 10),
    [availableMenu, promotions],
  );
  const categories = useMemo(() => getOrderedMenuCategories(availableMenu), [availableMenu]);
  const sectionTabs = useMemo(
    () => [POPULARES_SECTION_ID, ...categories],
    [categories],
  );

  const normalizedQuery = useMemo(() => normalizeSearch(searchQuery), [searchQuery]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const category of categories) {
      map.set(
        category,
        availableMenu.filter((m) => m.category === category),
      );
    }
    return map;
  }, [availableMenu, categories]);

  const filteredPopular = useMemo(() => {
    if (!normalizedQuery) return popular;
    return popular.filter((p) =>
      normalizeSearch([p.name, p.description, p.category].join(" ")).includes(normalizedQuery),
    );
  }, [popular, normalizedQuery]);

  const heroImage = useMemo(
    () => getRestaurantHeroImage(restaurant ?? {}, availableMenu, popular),
    [restaurant, availableMenu, popular],
  );

  const activePromo = useMemo(() => {
    return promotions.find((p) => isPromotionActive(p) && p.productIds.length > 0) ?? null;
  }, [promotions]);

  useEffect(() => {
    if (!activeRestaurantId) return;
    let cancelled = false;
    setReviewCount(null);
    void clienteApi
      .listReviews(activeRestaurantId, { limit: 1, offset: 0 })
      .then((page) => {
        if (!cancelled) setReviewCount(page.total ?? page.data.length);
      })
      .catch(() => {
        if (!cancelled) setReviewCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRestaurantId]);

  useEffect(() => {
    setSearchQuery("");
    setActiveSection(POPULARES_SECTION_ID);
  }, [activeRestaurantId]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(`rest-section-${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  if (!restaurant) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">No se encontró el restaurante.</p>
        <button
          type="button"
          onClick={closeRestaurantDetail}
          className="mt-4 text-sm font-semibold text-primary hover:underline"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Portada: solo imagen + acciones (sin textos encima) */}
      <div className="relative -mx-3 overflow-hidden sm:-mx-6 lg:mx-0 lg:rounded-3xl">
        <div className="relative aspect-[16/10] max-h-[260px] w-full sm:aspect-[21/9] sm:max-h-[320px]">
          {heroImage ? (
            <img src={heroImage} alt="" className="size-full object-cover" />
          ) : (
            <div
              className="size-full"
              style={{
                background: `linear-gradient(135deg, ${restaurant.accent} 0%, color-mix(in oklab, ${restaurant.accent} 40%, #0f172a) 100%)`,
              }}
            />
          )}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3 sm:p-4">
            <button
              type="button"
              onClick={closeRestaurantDetail}
              aria-label="Cerrar restaurante"
              className="grid size-10 place-items-center rounded-full bg-cream/95 text-foreground shadow-md backdrop-blur-sm transition-transform active:scale-95 hover:bg-cream"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("restaurant-menu-search");
                input?.focus();
                input?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              aria-label="Buscar en el menú"
              className="grid size-10 place-items-center rounded-full bg-cream/95 text-foreground shadow-md backdrop-blur-sm transition-transform active:scale-95 hover:bg-cream"
            >
              <Search className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Identidad: logo sobre el borde; textos completamente debajo de la portada */}
      <div className="relative z-10 space-y-4 px-0">
        <div className="-mt-8 sm:-mt-10">
          <span
            className="grid size-16 place-items-center overflow-hidden rounded-2xl border-4 border-cream bg-card font-display text-lg font-bold text-white shadow-lg sm:size-20 sm:text-xl"
            style={{ backgroundColor: restaurant.accent }}
          >
            {restaurant.logo ? (
              <img src={restaurant.logo} alt="" className="size-full object-cover" />
            ) : (
              restaurant.initials
            )}
          </span>
        </div>

        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {restaurant.name}
          </h1>
          {restaurant.tagline ? (
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{restaurant.tagline}</p>
          ) : null}
        </div>

        <div className="border-y border-border/70">
          <div className="grid grid-cols-2 divide-x divide-border/70">
            <div className="flex flex-col items-center gap-1 px-3 py-4 sm:py-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                <Clock3 className="size-3.5 text-primary" />
                Entrega
              </span>
              <span className="font-display text-base font-semibold tabular-nums sm:text-lg">
                {restaurant.deliveryMinutes || 30} min
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-4 sm:py-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                <Star className="size-3.5 fill-amber-brand text-amber-brand" />
                Calificación
              </span>
              <span className="font-display text-base font-semibold tabular-nums sm:text-lg">
                {restaurant.rating?.toFixed(1) || "0.0"}
                {reviewCount != null && reviewCount > 0 ? (
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    ({reviewCount})
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        </div>

        {proximity === "lejos" ? (
          <button
            type="button"
            onClick={() => setProximityInfoOpen(true)}
            className="flex w-full items-center justify-center gap-2 border-b border-border/70 py-3.5 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-500/5"
          >
            <MapPin className="size-4 shrink-0 opacity-80" />
            <span>Lejos de ti</span>
            <ChevronRight className="size-4 shrink-0 opacity-50" />
          </button>
        ) : proximity === "recomendado" ? (
          <div className="flex w-full items-center justify-center gap-2 border-b border-border/70 py-3.5 text-sm font-medium text-emerald-800">
            <MapPin className="size-4 shrink-0 opacity-80" />
            <span>Cerca de ti</span>
          </div>
        ) : restaurant.city ? (
          <div className="flex w-full items-center justify-center gap-2 border-b border-border/70 py-3.5 text-sm font-medium text-foreground">
            <MapPin className="size-4 shrink-0 text-primary" />
            <span className="truncate">{restaurant.city}</span>
          </div>
        ) : null}

        {activePromo ? (
          <div className="border-b border-border/70 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {activePromo.name}
              </p>
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Vigente
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Hasta {activePromo.discountPercent}% en productos seleccionados
            </p>
          </div>
        ) : null}

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="restaurant-menu-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar en ${restaurant.name}…`}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground/70 focus:ring-2"
          />
        </div>
      </div>

      <Dialog open={proximityInfoOpen} onOpenChange={setProximityInfoOpen}>
        <DialogContent className="max-h-[min(100dvh,var(--vv-height,100dvh))] w-[calc(100%-1rem)] max-w-md overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-10 text-left">
            <DialogTitle className="inline-flex items-center gap-2 font-display text-lg">
              <MapPin className="size-5 text-amber-brand" />
              Lejos de ti
            </DialogTitle>
            <DialogDescription>
              Detalle de zona y tiempo estimado de entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="space-y-1 border-b border-border/70 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                ¿Por qué está lejos?
              </p>
              <p className="leading-relaxed text-foreground">
                {clientComuna && restaurantComuna ? (
                  <>
                    Tu ubicación está en la comuna{" "}
                    <span className="font-semibold">{clientComuna}</span> y este
                    restaurante atiende desde{" "}
                    <span className="font-semibold">{restaurantComuna}</span>. Al
                    no ser la misma zona, el pedido se marca como lejos.
                  </>
                ) : (
                  <>
                    Este restaurante no está en tu misma comuna, por eso aparece
                    como lejos de ti.
                  </>
                )}
              </p>
            </div>

            <div className="space-y-1 border-b border-border/70 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Distancia / alcance
              </p>
              <p className="leading-relaxed text-foreground">
                No usamos kilómetros GPS: la distancia se calcula por{" "}
                <span className="font-semibold">zona (comuna)</span>. Pedidos
                fuera de tu zona suelen tardar más en llegar.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Tiempo estimado
              </p>
              <p className="inline-flex items-center gap-2 font-display text-base font-semibold text-foreground">
                <Clock3 className="size-4 text-primary" />
                {deliveryMinutes} min aprox.
              </p>
              {restaurant.city || restaurant.address ? (
                <p className="mt-2 text-muted-foreground">
                  {[restaurant.city, restaurant.address].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky category tabs */}
      <div
        ref={tabsRef}
        className="sticky top-0 z-20 -mx-3 mt-5 border-b border-border bg-cream/95 px-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
      >
        <div className="flex gap-5 overflow-x-auto scrollbar-none sm:gap-7">
          {sectionTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => scrollToSection(tab)}
              className={cn(
                "shrink-0 border-b-2 py-3 text-sm font-semibold transition-colors",
                activeSection === tab
                  ? "border-ink text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-6 space-y-8 pb-8 sm:mt-8 sm:space-y-10">
        {isLoadingMenu && availableMenu.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando menú…</p>
        ) : availableMenu.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
            Este restaurante aún no tiene productos disponibles.
          </p>
        ) : (
          <>
            <ProductSection
              id={POPULARES_SECTION_ID}
              title={POPULARES_SECTION_ID}
              products={
                normalizedQuery
                  ? filteredPopular
                  : popular
              }
              onAdd={handleAddProduct}
            />

            {categories.map((category) => {
              let items = productsByCategory.get(category) ?? [];
              if (normalizedQuery) {
                items = items.filter((p) =>
                  normalizeSearch([p.name, p.description, p.category].join(" ")).includes(
                    normalizedQuery,
                  ),
                );
              }
              return (
                <ProductSection
                  key={category}
                  id={category}
                  title={category}
                  products={items}
                  onAdd={handleAddProduct}
                />
              );
            })}
          </>
        )}
      </div>

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
