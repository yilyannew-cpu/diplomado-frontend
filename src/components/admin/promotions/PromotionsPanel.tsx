import { Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { CreatePromotionModal } from "@/components/admin/promotions/CreatePromotionModal";
import { EditPromotionModal } from "@/components/admin/promotions/EditPromotionModal";
import { formatCOP, useOrders } from "@/context/OrderContext";
import type { Promotion } from "@/mocks/promotionsMock";
import {
  getProductPricing,
  getPromotionStatus,
  promotionStatusClass,
  promotionStatusLabel,
} from "@/lib/promotions";
import type { MenuItem } from "@/mocks/menuMock";

export function PromotionsPanel() {
  const { menu, promotions } = useOrders();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const rows = useMemo(
    () =>
      [...promotions].sort((a, b) => b.createdAt - a.createdAt).map((promo) => {
        const status = getPromotionStatus(promo);
        const products = promo.productIds
          .map((id) => menu.find((item) => item.id === id))
          .filter((item): item is MenuItem => Boolean(item));
        return { promo, status, products };
      }),
    [menu, promotions],
  );

  const activeCount = rows.filter((row) => row.status === "active").length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Marketing y ventas
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">Promociones programadas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} promoción{activeCount !== 1 ? "es" : ""} activa{activeCount !== 1 ? "s" : ""} hoy
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nueva promoción
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Tag className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Sin promociones creadas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Programa descuentos por producto con fecha de inicio y fin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ promo, status, products }) => (
            <article
              key={promo.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{promo.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${promotionStatusClass(status)}`}
                    >
                      {promotionStatusLabel(status)}
                    </span>
                    <span className="rounded-full bg-amber-brand/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-brand">
                      -{promo.discountPercent}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {promo.startDate} → {promo.endDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(promo)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Editar
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {promo.productIds.length} producto{promo.productIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {products.map((product) => {
                  const pricing = getProductPricing(product, promotions);
                  return (
                    <li
                      key={product.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3"
                    >
                      <img
                        src={product.image}
                        alt=""
                        className="size-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-[11px] text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] text-muted-foreground line-through">
                          {formatCOP(pricing.originalPrice)}
                        </p>
                        <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                          {formatCOP(pricing.salePrice)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}

      <CreatePromotionModal open={creating} onClose={() => setCreating(false)} />
      <EditPromotionModal
        promotion={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
