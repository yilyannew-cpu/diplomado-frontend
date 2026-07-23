import { Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { CreatePromotionModal } from "@/components/admin/promotions/CreatePromotionModal";
import { EditPromotionModal } from "@/components/admin/promotions/EditPromotionModal";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import type { Promotion } from "@/types/promotion";
import {
  getProductPricing,
  getPromotionStatus,
  promotionStatusClass,
  promotionStatusLabel,
} from "@/lib/promotions";
import type { MenuItem } from "@/types/menu";

export function PromotionsPanel() {
  const { menu, promotions } = useAdmin();
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
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
            Marketing y ventas
          </p>
          <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">
            Promociones programadas
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {activeCount} promoción{activeCount !== 1 ? "es" : ""} activa
            {activeCount !== 1 ? "s" : ""} hoy
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="min-h-11 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto sm:min-h-0 sm:py-2"
        >
          + Nueva promoción
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center sm:p-12">
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
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all duration-300 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words font-display text-base font-semibold sm:text-lg">
                      {promo.name}
                    </h3>
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
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    {promo.productIds.length} producto{promo.productIds.length !== 1 ? "s" : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditing(promo)}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    Editar
                  </button>
                </div>
              </div>

              <ul className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
                {products.map((product) => {
                  const pricing = getProductPricing(product, promotions);
                  return (
                    <li
                      key={product.id}
                      className="flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border border-border/60 bg-background/50 p-2.5 sm:gap-3 sm:p-3"
                    >
                      <img
                        src={product.image}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover sm:size-12"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="shrink-0 whitespace-nowrap text-right">
                        <p className="text-[10px] text-muted-foreground line-through">
                          {formatCOP(pricing.originalPrice)}
                        </p>
                        <p className="font-mono text-xs font-semibold tabular-nums text-primary sm:text-sm">
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
