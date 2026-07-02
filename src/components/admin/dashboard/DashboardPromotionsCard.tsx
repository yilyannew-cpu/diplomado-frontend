import { CalendarRange, Sparkles, Tag } from "lucide-react";
import { useMemo } from "react";
import { DiscountBadge } from "@/components/shared/ProductPriceDisplay";
import { formatCOP, useOrders } from "@/context/OrderContext";
import {
  getActivePromotedProducts,
  getProductPricing,
  getPromotionStatus,
  isPromotionActive,
} from "@/lib/promotions";
import type { Promotion } from "@/mocks/promotionsMock";

function formatDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function DashboardPromotionsCard() {
  const { menu, promotions } = useOrders();

  const activePromotions = useMemo(
    () => promotions.filter((promo) => isPromotionActive(promo)),
    [promotions],
  );

  const scheduledCount = useMemo(
    () => promotions.filter((promo) => getPromotionStatus(promo) === "scheduled").length,
    [promotions],
  );

  const promotedProducts = useMemo(
    () => getActivePromotedProducts(menu, promotions),
    [menu, promotions],
  );

  const promotionsWithProducts = useMemo(() => {
    return activePromotions.map((promo) => ({
      promo,
      products: promo.productIds
        .map((id) => menu.find((item) => item.id === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .map((product) => ({
          product,
          pricing: getProductPricing(product, promotions),
        })),
    }));
  }, [activePromotions, menu, promotions]);

  const hasActive = activePromotions.length > 0;

  return (
    <section
      className={`overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        hasActive
          ? "border-primary/25 bg-gradient-to-br from-card via-card to-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              hasActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            {hasActive ? <Sparkles className="size-5" /> : <Tag className="size-5" />}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Marketing
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold">
              {hasActive ? "Promociones activas" : "Sin promociones activas"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActive
                ? `${promotedProducts.length} producto${promotedProducts.length !== 1 ? "s" : ""} con descuento visible para clientes hoy`
                : "No hay campañas vigentes en la fecha actual"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {activePromotions.length} campaña{activePromotions.length !== 1 ? "s" : ""} en curso
            </span>
          ) : null}
          {scheduledCount > 0 ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              {scheduledCount} programada{scheduledCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        {!hasActive ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/50 py-10 text-center">
            <CalendarRange className="size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">
              Todo el menú se muestra a precio regular
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Crea una promoción en el módulo Promociones para destacar productos con descuento
              automático por fechas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {promotionsWithProducts.map(({ promo, products }) => (
              <PromotionGroup key={promo.id} promo={promo} products={products} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PromotionGroup({
  promo,
  products,
}: {
  promo: Promotion;
  products: { product: (typeof products)[number]["product"]; pricing: ReturnType<typeof getProductPricing> }[];
}) {
  return (
    <article className="rounded-xl border border-primary/15 bg-background/70 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">{promo.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarRange className="size-3 shrink-0" />
            {formatDateLabel(promo.startDate)} — {formatDateLabel(promo.endDate)}
          </p>
        </div>
        <DiscountBadge percent={promo.discountPercent} />
      </div>

      <ul className="space-y-2">
        {products.map(({ product, pricing }) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-colors hover:border-primary/20"
          >
            <img
              src={product.image}
              alt=""
              className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-border/60"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-[10px] text-muted-foreground">{product.category}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground line-through">
                {formatCOP(pricing.originalPrice)}
              </p>
              <p className="font-mono text-sm font-bold tabular-nums text-primary">
                {formatCOP(pricing.salePrice)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
