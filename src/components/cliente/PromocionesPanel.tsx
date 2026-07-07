import { formatCOP, useOrders } from "@/context/OrderContext";
import { getActivePromotedProducts } from "@/lib/promotions";
import type { MenuItem } from "@/mocks/menuMock";
import { DiscountBadge, ProductPriceDisplay } from "@/components/shared/ProductPriceDisplay";

export function PromocionesPanel({
  menu,
  onAdd,
}: {
  menu: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  const { promotions } = useOrders();
  const promos = getActivePromotedProducts(menu, promotions);

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
        {promos.map(({ product, pricing, promotion }) => (
          <article
            key={product.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
              <img src={product.image} alt={product.name} className="size-full object-cover" loading="lazy" />
              <span className="absolute left-3 top-3">
                <DiscountBadge percent={pricing.discountPercent} />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {promotion.name}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">{product.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <ProductPriceDisplay pricing={pricing} size="lg" />
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
        ))}
        {promos.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No hay promociones activas en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
