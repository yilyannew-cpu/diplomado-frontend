import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCliente } from "@/context/ClienteContext";
import { resolveClientComuna } from "@/lib/clientComunaStorage";
import {
  getRestaurantProximity,
  sortRestaurantsByProximity,
} from "@/lib/restaurantProximity";

export function RankinPanel() {
  const { restaurants, openRestaurantDetail } = useCliente();
  const { user } = useAuth();
  const clientComuna = resolveClientComuna(user);

  const ranked = useMemo(() => {
    const byProximity = sortRestaurantsByProximity(restaurants, clientComuna);
    return [...byProximity].sort((a, b) => {
      const aNear = getRestaurantProximity(a, clientComuna) === "recomendado" ? 0 : 1;
      const bNear = getRestaurantProximity(b, clientComuna) === "recomendado" ? 0 : 1;
      if (aNear !== bNear) return aNear - bNear;
      return b.rating - a.rating;
    });
  }, [restaurants, clientComuna]);

  return (
    <section>
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-[11px]">
          Top restaurantes
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Rankin de la zona
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientComuna
            ? `Priorizamos restaurantes en ${clientComuna}; el resto aparecen como lejos de ti.`
            : "Los favoritos de la comunidad FFCore este mes."}
        </p>
      </div>

      <ol className="space-y-3">
        {ranked.map((r, idx) => {
          const proximity = getRestaurantProximity(r, clientComuna);
          return (
            <li
              key={r.id}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              onClick={() => openRestaurantDetail(r.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openRestaurantDetail(r.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-bold ${
                  idx === 0
                    ? "bg-amber-brand text-ink"
                    : idx === 1
                      ? "bg-secondary text-foreground"
                      : idx === 2
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                }`}
              >
                {idx + 1}
              </span>
              <span
                className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl font-display text-sm font-semibold text-white"
                style={{ backgroundColor: r.accent }}
              >
                {r.logo ? (
                  <img src={r.logo} alt="" className="size-full object-cover" />
                ) : (
                  r.initials
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold leading-tight">{r.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="font-medium text-amber-brand">★ {r.rating.toFixed(1)}</span>
                  <span>·</span>
                  <span>{r.deliveryMinutes} min</span>
                </p>
                {proximity === "recomendado" ? (
                  <span className="mt-1.5 inline-flex rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Recomendado
                  </span>
                ) : proximity === "lejos" ? (
                  <span className="mt-1.5 inline-flex rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Lejos de ti
                  </span>
                ) : null}
              </div>
              {idx === 0 && (
                <span className="hidden rounded-full bg-amber-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-brand sm:inline">
                  #1
                </span>
              )}
            </li>
          );
        })}
        {ranked.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay restaurantes disponibles en este momento.
          </p>
        )}
      </ol>
    </section>
  );
}
