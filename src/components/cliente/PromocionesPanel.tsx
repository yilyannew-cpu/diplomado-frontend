import { useEffect, useMemo } from "react";
import { Store } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { DiscountBadge, ProductPriceDisplay } from "@/components/shared/ProductPriceDisplay";
import { ProductImage } from "@/components/shared/ProductImage";
import { useCliente } from "@/context/ClienteContext";
import { groupActivePromotions, type ActivePromotionGroup } from "@/lib/promotions";
import type { MenuItem } from "@/mocks/menuMock";
import type { ProductPricing } from "@/lib/promotions";
import { cn } from "@/lib/utils";

function PromoProductCard({
  product,
  pricing,
  onAdd,
  className,
}: {
  product: MenuItem;
  pricing: ProductPricing;
  onAdd: (item: MenuItem) => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
        />
        <span className="absolute left-3 top-3">
          <DiscountBadge percent={pricing.discountPercent} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-snug">{product.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <ProductPriceDisplay pricing={pricing} size="lg" align="left" />
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream hover:bg-primary"
          >
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}

function PromotionCampaignSection({
  group,
  onAdd,
  onOpenRestaurant,
}: {
  group: ActivePromotionGroup;
  onAdd: (item: MenuItem) => void;
  onOpenRestaurant: (restaurantId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <header className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {group.promotion.name}
        </h2>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Store className="size-3.5 shrink-0 text-primary" aria-hidden />
          <button
            type="button"
            onClick={() => onOpenRestaurant(group.restaurantId)}
            className="truncate font-medium text-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
            title={`Ver menú de ${group.restaurantName}`}
          >
            {group.restaurantName}
          </button>
          <span className="text-border">·</span>
          <span className="shrink-0 font-semibold text-primary">
            −{group.promotion.discountPercent}%
          </span>
        </p>
      </header>

      {/* Móvil: carrusel deslizable con el dedo (sin botones) */}
      <div className="md:hidden">
        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
          <CarouselContent className="-ml-3">
            {group.products.map(({ product, pricing }) => (
              <CarouselItem key={product.id} className="basis-[85%] pl-3 sm:basis-[70%]">
                <PromoProductCard product={product} pricing={pricing} onAdd={onAdd} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop / tablet: grid */}
      <div className="hidden grid-cols-2 gap-5 md:grid lg:grid-cols-3">
        {group.products.map(({ product, pricing }) => (
          <PromoProductCard
            key={product.id}
            product={product}
            pricing={pricing}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}

export function PromocionesPanel({ onAdd }: { onAdd: (item: MenuItem) => void }) {
  const {
    allMenus,
    allPromotions,
    restaurants,
    ensureAllPromotionsCatalog,
    isLoadingAllMenus,
    openRestaurantDetail,
  } = useCliente();

  useEffect(() => {
    void ensureAllPromotionsCatalog();
  }, [ensureAllPromotionsCatalog]);

  const groups = useMemo(
    () => groupActivePromotions(allMenus, allPromotions, restaurants),
    [allMenus, allPromotions, restaurants],
  );

  return (
    <section>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px]">
          Ofertas del día
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Promociones exclusivas
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todas las campañas activas de la plataforma, agrupadas por promoción y restaurante.
        </p>
      </div>

      {isLoadingAllMenus && groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando promociones…</p>
      ) : groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay promociones activas en este momento.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <PromotionCampaignSection
              key={group.promotion.id}
              group={group}
              onAdd={onAdd}
              onOpenRestaurant={openRestaurantDetail}
            />
          ))}
        </div>
      )}
    </section>
  );
}
