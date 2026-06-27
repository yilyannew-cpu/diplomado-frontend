import { Star, TrendingUp, Trophy } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import { DashboardPromotionsCard } from "@/components/admin/dashboard/DashboardPromotionsCard";
import { Cell, Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCOP, useOrders } from "@/context/OrderContext";
import {
  buildDashboardStats,
  MONTHLY_SALES_GOAL_COP,
  restaurantReviewsMock,
} from "@/lib/restaurantDashboard";
import type { CategorySalesRow, TopProductRow } from "@/lib/restaurantDashboard";

const RANK_ACCENT = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function slugifyCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function buildCategoryChartConfig(rows: CategorySalesRow[]): ChartConfig {
  const config: ChartConfig = {};
  for (const row of rows) {
    config[slugifyCategory(row.category)] = {
      label: row.category,
      color: row.fill,
    };
  }
  return config;
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-amber-brand text-ink shadow-sm";
  if (rank === 2) return "bg-ink/90 text-cream";
  if (rank === 3) return "bg-primary/15 text-primary";
  return "bg-secondary text-muted-foreground";
}

function TopProductsRanking({
  products,
  totalRevenue,
}: {
  products: TopProductRow[];
  totalRevenue: number;
}) {
  const maxRevenue = products[0]?.revenue ?? 1;

  return (
    <ol className="space-y-2.5" aria-label="Ranking de productos más vendidos">
      {products.map((product, index) => {
        const rank = index + 1;
        const percent =
          totalRevenue > 0 ? Math.round((product.revenue / totalRevenue) * 100) : 0;
        const barWidth = Math.max(8, Math.round((product.revenue / maxRevenue) * 100));
        const accent = RANK_ACCENT[index % RANK_ACCENT.length];

        return (
          <li
            key={product.productId}
            className="animate-top-rank-enter group relative overflow-hidden rounded-xl border border-border/60 bg-background/50 p-3 transition-all duration-300 hover:border-primary/25 hover:bg-background hover:shadow-sm"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="relative flex items-center gap-3">
              <div
                className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums ${rankBadgeClass(rank)}`}
              >
                {rank === 1 ? <Trophy className="size-4" aria-hidden /> : rank}
              </div>

              <img
                src={product.image}
                alt=""
                className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-105"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-snug">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                      {formatCOP(product.revenue)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {percent}% · {product.unitsSold} uds.
                    </p>
                  </div>
                </div>

                <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="animate-top-rank-bar absolute inset-y-0 left-0 rounded-full"
                    style={
                      {
                        "--bar-width": `${barWidth}%`,
                        animationDelay: `${index * 90 + 200}ms`,
                        backgroundColor: accent,
                      } as CSSProperties
                    }
                  />
                  {rank === 1 ? (
                    <div
                      className="animate-top-rank-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      style={{ animationDelay: `${index * 90 + 700}ms` }}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DonutCenterLabel({
  viewBox,
  value,
  subtitle,
}: {
  viewBox?: { cx?: number; cy?: number };
  value: string;
  subtitle: string;
}) {
  if (!viewBox?.cx || !viewBox?.cy) return null;
  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={viewBox.cx} y={viewBox.cy - 6} className="fill-foreground text-lg font-semibold">
        {value}
      </tspan>
      <tspan x={viewBox.cx} y={viewBox.cy + 14} className="fill-muted-foreground text-[11px]">
        {subtitle}
      </tspan>
    </text>
  );
}

function ChartLegend({
  items,
}: {
  items: { label: string; value: string; percent: string; color: string }[];
}) {
  return (
    <ul className="flex w-full flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-3"
          style={{ borderLeftWidth: 3, borderLeftColor: item.color }}
        >
          <span
            className="mt-0.5 size-3 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{item.label}</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
              <p className="font-mono text-xs font-semibold tabular-nums">{item.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{item.percent}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RestaurantDashboard() {
  const { orders, menu } = useOrders();
  const stats = useMemo(() => buildDashboardStats(orders, menu), [orders, menu]);

  const categoryTotal = useMemo(
    () => stats.salesByCategory.reduce((sum, row) => sum + row.sales, 0),
    [stats.salesByCategory],
  );

  const categoryChartConfig = useMemo(
    () => buildCategoryChartConfig(stats.salesByCategory),
    [stats.salesByCategory],
  );

  const topProductsTotal = useMemo(
    () => stats.topProducts.reduce((sum, p) => sum + p.revenue, 0),
    [stats.topProducts],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ventas hoy"
          value={formatCOP(stats.salesToday)}
          hint={`${stats.ordersToday} pedidos en curso o entregados`}
          accent="primary"
        />
        <MetricCard
          label="Ventas del mes"
          value={formatCOP(stats.monthlySales)}
          hint={`Meta: ${formatCOP(MONTHLY_SALES_GOAL_COP)}`}
          accent="ink"
        />
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Cumplimiento de meta
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-semibold tabular-nums">{stats.goalProgress}%</p>
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${stats.goalProgress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {stats.goalProgress >= 100
              ? "¡Meta alcanzada!"
              : `Faltan ${formatCOP(Math.max(0, MONTHLY_SALES_GOAL_COP - stats.monthlySales))}`}
          </p>
        </div>
        <MetricCard
          label="Calificación clientes"
          value={`${stats.averageRating} / 5`}
          hint={`${stats.reviewCount} reseñas recientes`}
          accent="amber"
        />
      </div>

      <DashboardPromotionsCard />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Ventas por categoría
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">Distribución del menú</h2>
          </div>
          {stats.salesByCategory.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aún no hay ventas registradas por categoría.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
              <ChartContainer
                config={categoryChartConfig}
                className="mx-auto aspect-square h-[260px] w-full max-w-[280px] shrink-0"
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="category"
                        formatter={(value) => formatCOP(Number(value))}
                      />
                    }
                  />
                  <Pie
                    data={stats.salesByCategory}
                    dataKey="sales"
                    nameKey="category"
                    innerRadius={68}
                    outerRadius={104}
                    paddingAngle={2}
                    strokeWidth={3}
                    stroke="hsl(var(--card))"
                  >
                    {stats.salesByCategory.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => (
                        <DonutCenterLabel
                          viewBox={viewBox}
                          value={formatCOP(categoryTotal)}
                          subtitle="Total categorías"
                        />
                      )}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="w-full min-w-0 flex-1 lg:max-w-none">
                <ChartLegend
                  items={stats.salesByCategory.map((row) => ({
                    label: row.category,
                    value: formatCOP(row.sales),
                    percent: `${categoryTotal > 0 ? Math.round((row.sales / categoryTotal) * 100) : 0}%`,
                    color: row.fill,
                  }))}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Top 5 productos
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">Más vendidos</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sin datos de productos vendidos.
            </p>
          ) : (
            <TopProductsRanking products={stats.topProducts} totalRevenue={topProductsTotal} />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Opiniones de clientes
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold">Reseñas recientes</h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-brand/15 px-3 py-1">
            <Star className="size-4 fill-amber-brand text-amber-brand" />
            <span className="text-sm font-semibold">{stats.averageRating}</span>
            <span className="text-xs text-muted-foreground">promedio</span>
          </div>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {restaurantReviewsMock.map((review) => (
            <li key={review.id} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{review.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">{review.createdAt}</p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent: "primary" | "ink" | "amber";
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "amber"
        ? "text-amber-brand"
        : "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-3 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${accentClass}`}>
        {value}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rating ? "fill-amber-brand text-amber-brand" : "text-border"
          }`}
        />
      ))}
    </div>
  );
}
