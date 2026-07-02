import { restaurantsMock } from "@/mocks/restaurantsMock";

export function RankinPanel() {
  const ranked = [...restaurantsMock].sort((a, b) => b.rating - a.rating);

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
          Los favoritos de la comunidad FFCore este mes.
        </p>
      </div>

      <ol className="space-y-3">
        {ranked.map((r, idx) => (
          <li
            key={r.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
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
              className="grid size-12 shrink-0 place-items-center rounded-xl font-display text-sm font-semibold text-white"
              style={{ backgroundColor: r.accent }}
            >
              {r.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold leading-tight">{r.name}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className="font-medium text-amber-brand">★ {r.rating.toFixed(1)}</span>
                <span>·</span>
                <span>{r.deliveryMinutes} min</span>
              </p>
            </div>
            {idx === 0 && (
              <span className="hidden rounded-full bg-amber-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-brand sm:inline">
                #1
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
