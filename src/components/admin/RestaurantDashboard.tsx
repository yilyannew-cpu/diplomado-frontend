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
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import { ProductImage } from "@/components/shared/ProductImage";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const RANK_ACCENT = CHART_COLORS;

function slugifyCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function buildCategoryChartConfig(
  rows: { category: string; fill: string }[],
): ChartConfig {
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

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RestaurantDashboard() {
  const { dashboard, reviews, menu } = useAdmin();

  const salesByCategory = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.sales_by_category.map((row, index) => ({
      category: row.category_name,
      sales: row.total,
      fill: CHART_COLORS[index % CHART_COLORS.length],
      image: row.image,
    }));
  }, [dashboard]);

  const topProducts = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.top_products.map((product) => {
      const menuItem = menu.find((m) => m.id === product.product_id);
      return {
        productId: product.product_id,
        name: product.name,
        category: menuItem?.category ?? "Menú",
        image: menuItem?.image ?? "",
        unitsSold: product.quantity_sold,
        revenue: product.revenue,
      };
    });
  }, [dashboard, menu]);

  const categoryTotal = useMemo(
    () => salesByCategory.reduce((sum, row) => sum + row.sales, 0),
    [salesByCategory],
  );

  const categoryChartConfig = useMemo(
    () => buildCategoryChartConfig(salesByCategory),
    [salesByCategory],
  );

  const topProductsTotal = useMemo(
    () => topProducts.reduce((sum, p) => sum + p.revenue, 0),
    [topProducts],
  );

  if (!dashboard) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground sm:p-12">
        Cargando métricas del dashboard…
      </div>
    );
  }

  const goalProgress = Math.round(dashboard.goal_progress_percent ?? 0);
  const dailyGoalProgress = Math.round(dashboard.daily_goal_progress_percent ?? 0);
  const hasMonthlyGoal = dashboard.monthly_goal != null && dashboard.monthly_goal > 0;
  const hasDailyGoal = dashboard.daily_goal != null && dashboard.daily_goal > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          label="Ventas hoy"
          value={formatCOP(dashboard.sales_today)}
          hint={
            hasDailyGoal
              ? `Meta diaria: ${formatCOP(dashboard.daily_goal!)}`
              : `${dashboard.orders_today} pedidos en curso o entregados`
          }
          accent="primary"
        />
        <MetricCard
          label="Ventas del mes"
          value={formatCOP(dashboard.monthly_sales)}
          hint={
            hasMonthlyGoal
              ? `Meta: ${formatCOP(dashboard.monthly_goal!)}`
              : `${dashboard.orders_today} pedidos hoy`
          }
          accent="ink"
        />
        {hasDailyGoal || hasMonthlyGoal ? (
          <div className="col-span-2 space-y-3 rounded-2xl border border-border bg-card p-3.5 sm:col-span-1 sm:space-y-4 sm:p-5 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              Cumplimiento de meta
            </p>
            {hasDailyGoal ? (
              <GoalProgressBlock
                label="Hoy"
                progress={dailyGoalProgress}
                remaining={Math.max(0, (dashboard.daily_goal ?? 0) - dashboard.sales_today)}
              />
            ) : null}
            {hasMonthlyGoal ? (
              <GoalProgressBlock
                label="Mes"
                progress={goalProgress}
                remaining={Math.max(0, (dashboard.monthly_goal ?? 0) - dashboard.monthly_sales)}
              />
            ) : null}
          </div>
        ) : (
          <div className="col-span-2 rounded-2xl border border-dashed border-border bg-card/60 p-3.5 sm:col-span-1 sm:p-5 xl:col-span-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
              Cumplimiento de meta
            </p>
            <p className="mt-2 text-sm leading-snug text-muted-foreground">
              Opcional. Configura metas diarias o mensuales en{" "}
              <span className="font-medium text-foreground">Configuración</span>.
            </p>
          </div>
        )}
        <MetricCard
          label="Calificación"
          value={`${dashboard.average_rating} / 5`}
          hint={`${dashboard.review_count} reseñas recientes`}
          accent="amber"
        />
      </div>

      <DashboardPromotionsCard />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 sm:mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
              Ventas por categoría
            </p>
            <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">
              Distribución del menú
            </h2>
          </div>
          {salesByCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground sm:py-12">
              Aún no hay ventas registradas por categoría.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:gap-6 lg:flex-row lg:items-start">
              <ChartContainer
                config={categoryChartConfig}
                className="mx-auto aspect-square h-[168px] w-full max-w-[168px] shrink-0 sm:h-[240px] sm:max-w-[260px]"
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
                    data={salesByCategory}
                    dataKey="sales"
                    nameKey="category"
                    innerRadius="52%"
                    outerRadius="82%"
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="hsl(var(--card))"
                  >
                    {salesByCategory.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => (
                        <DonutCenterLabel
                          viewBox={
                            viewBox && "cx" in viewBox
                              ? { cx: viewBox.cx, cy: viewBox.cy }
                              : undefined
                          }
                          value={formatCOP(categoryTotal)}
                          subtitle="Total"
                        />
                      )}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="w-full min-w-0 flex-1">
                <ChartLegend
                  items={salesByCategory.map((row) => ({
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

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 sm:mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
              Top 5 productos
            </p>
            <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">Más vendidos</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground sm:py-12">
              Sin datos de productos vendidos.
            </p>
          ) : (
            <TopProductsRanking products={topProducts} totalRevenue={topProductsTotal} />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
              Opiniones de clientes
            </p>
            <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">
              Reseñas recientes
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-brand/15 px-2.5 py-1 sm:px-3">
            <Star className="size-3.5 fill-amber-brand text-amber-brand sm:size-4" />
            <span className="text-sm font-semibold">{dashboard.average_rating}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">promedio</span>
          </div>
        </div>
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sin reseñas todavía.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-border bg-background/60 p-3.5 sm:p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{review.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatReviewDate(review.created_at)}
                    </p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground sm:mt-3">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TopProductsRanking({
  products,
  totalRevenue,
}: {
  products: {
    productId: string;
    name: string;
    category: string;
    image: string;
    unitsSold: number;
    revenue: number;
  }[];
  totalRevenue: number;
}) {
  const maxRevenue = products[0]?.revenue ?? 1;

  return (
    <ol className="space-y-2 sm:space-y-2.5" aria-label="Ranking de productos más vendidos">
      {products.map((product, index) => {
        const rank = index + 1;
        const percent =
          totalRevenue > 0 ? Math.round((product.revenue / totalRevenue) * 100) : 0;
        const barWidth = Math.max(8, Math.round((product.revenue / maxRevenue) * 100));
        const accent = RANK_ACCENT[index % RANK_ACCENT.length];

        return (
          <li
            key={product.productId}
            className="animate-top-rank-enter group relative overflow-hidden rounded-xl border border-border/60 bg-background/50 p-2.5 transition-all duration-300 hover:border-primary/25 hover:bg-background hover:shadow-sm sm:p-3"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="relative flex items-center gap-2.5 sm:gap-3">
              <div
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums sm:size-9 sm:text-sm ${rankBadgeClass(rank)}`}
              >
                {rank === 1 ? <Trophy className="size-3.5 sm:size-4" aria-hidden /> : rank}
              </div>

              {product.image ? (
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-105 sm:size-12"
                />
              ) : (
                <div className="size-10 shrink-0 rounded-lg bg-secondary sm:size-12" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-snug sm:text-base">
                  {product.name}
                </p>
                <div className="mt-0.5 flex items-baseline justify-between gap-2">
                  <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                    {product.category}
                    <span className="mx-1 text-border">·</span>
                    {percent}% · {product.unitsSold} uds.
                  </p>
                  <p className="shrink-0 font-mono text-xs font-semibold tabular-nums text-primary sm:text-sm">
                    {formatCOP(product.revenue)}
                  </p>
                </div>

                <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-secondary sm:mt-2.5 sm:h-1.5">
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
      <tspan
        x={viewBox.cx}
        y={viewBox.cy - 5}
        className="fill-foreground text-[11px] font-semibold sm:text-sm"
      >
        {value}
      </tspan>
      <tspan
        x={viewBox.cx}
        y={viewBox.cy + 11}
        className="fill-muted-foreground text-[9px] sm:text-[11px]"
      >
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
    <ul className="flex w-full flex-col gap-1.5 sm:gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 px-2.5 py-2 sm:items-start sm:gap-3 sm:px-3 sm:py-3"
          style={{ borderLeftWidth: 3, borderLeftColor: item.color }}
        >
          <span
            className="size-2.5 shrink-0 rounded-full ring-2 ring-background sm:mt-0.5 sm:size-3"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium leading-snug sm:text-sm">{item.label}</p>
              <p className="shrink-0 text-[10px] font-medium text-muted-foreground sm:text-xs">
                {item.percent}
              </p>
            </div>
            <p className="mt-0.5 font-mono text-[11px] font-semibold tabular-nums sm:mt-1 sm:text-xs">
              {item.value}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function GoalProgressBlock({
  label,
  progress,
  remaining,
}: {
  label: string;
  progress: number;
  remaining: number;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold tabular-nums sm:text-2xl">{progress}%</p>
        </div>
        <TrendingUp className="size-4 text-emerald-600 sm:size-5" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary sm:h-2">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
        {progress >= 100 ? "¡Meta alcanzada!" : `Faltan ${formatCOP(remaining)}`}
      </p>
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
    <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-lg font-semibold tabular-nums leading-tight sm:mt-3 sm:text-3xl ${accentClass}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground sm:mt-2 sm:text-[11px]">
        {hint}
      </p>
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
