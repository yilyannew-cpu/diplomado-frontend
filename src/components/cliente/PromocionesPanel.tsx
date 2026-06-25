import { formatCOP } from "@/context/OrderContext";
import type { MenuItem } from "@/mocks/menuMock";

const PROMO_IDS = new Set(["prod-01", "prod-03", "prod-05", "prod-07"]);

export function PromocionesPanel({
  menu,
  onAdd,
}: {
  menu: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  const promos = menu.filter((m) => PROMO_IDS.has(m.id) && m.available);

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
          Aprovecha descuentos en productos seleccionados de nuestros aliados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {promos.map((p) => {
          const discounted = Math.round(p.price * 0.8);
          return (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
                <img src={p.image} alt={p.name} className="size-full object-cover" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  -20%
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground line-through">{formatCOP(p.price)}</p>
                    <p className="font-mono text-lg font-bold text-primary">{formatCOP(discounted)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
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
