import { Store } from "lucide-react";
import { useCliente } from "@/context/ClienteContext";
import { getActivePromotedProducts } from "@/lib/promotions";
import type { MenuItem } from "@/mocks/menuMock";
import { DiscountBadge, ProductPriceDisplay } from "@/components/shared/ProductPriceDisplay";
import { ProductImage } from "@/components/shared/ProductImage";

export function PromocionesPanel({
  menu,
  onAdd,
}: {
  menu: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  const { promotions, restaurants } = useCliente();
  const promos = getActivePromotedProducts(menu, promotions);

  const restaurantNameById = new Map(restaurants.map((r) => [r.id, r.name]));

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
          Descuentos activos según las fechas programadas por el restaurante.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {promos.map(({ product, pricing, promotion }) => {
          const restaurantName =
            restaurantNameById.get(product.restaurantId) ?? "Restaurante";

          return (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                <ProductImage src={product.image} alt={product.name} className="size-full object-cover" />
                <span className="absolute left-3 top-3">
                  <DiscountBadge percent={pricing.discountPercent} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                    <Store className="size-3 shrink-0 text-primary" aria-hidden />
                    {restaurantName}
                  </span>
                  <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary">
                    −{pricing.discountPercent}% de descuento
                  </span>
                </div>
                <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                  {promotion.name}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{product.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{product.description}</p>
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
        })}
        {promos.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No hay promociones activas en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
