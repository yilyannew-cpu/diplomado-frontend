import { formatCOP } from "@/context/OrderContext";
import type { DashboardMetrics } from "@/lib/api/types/operations";

interface SuperadminMetricsProps {
  metrics: DashboardMetrics | null;
  clientCount: number;
  loading?: boolean;
}

export function SuperadminMetrics({ metrics, clientCount, loading }: SuperadminMetricsProps) {
  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
        ))}
      </section>
    );
  }

  const salesDelta = metrics
    ? `${metrics.sales_delta_percent >= 0 ? "+" : ""}${metrics.sales_delta_percent}% vs ayer`
    : "—";

  const commissionToday = metrics?.platform_commission_today_cop ?? 0;
  const productSalesToday = metrics?.product_sales_today_cop ?? 0;

  return (
    <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
      <MetricCard
        label="Ventas hoy"
        value={formatCOP(metrics?.sales_today_cop ?? 0)}
        delta={salesDelta}
        tone="primary"
      />
      <MetricCard
        label="Comisión plataforma"
        value={formatCOP(commissionToday)}
        delta={
          productSalesToday > 0
            ? `5% de ${formatCOP(productSalesToday)} (productos)`
            : "5% sobre ventas de productos"
        }
        tone="amber"
      />
      <MetricCard
        label="Clientes registrados"
        value={String(clientCount)}
        delta="Activos en plataforma"
      />
      <MetricCard
        label="Admins activos"
        value={String(metrics?.active_restaurants ?? 0)}
        delta={`${metrics?.active_restaurants ?? 0} sedes operando`}
      />
      <MetricCard
        label="Domiciliarios"
        value={String(metrics?.active_couriers ?? 0)}
        delta={`${metrics?.orders_today ?? 0} pedidos hoy`}
        tone="amber"
      />
    </section>
  );
}

function MetricCard({
  label,
  value,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "default" | "primary" | "amber";
}) {
  const accent =
    tone === "primary"
      ? "border-primary/20 bg-primary/5"
      : tone === "amber"
        ? "border-amber-brand/30 bg-amber-brand/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-2xl border ${accent} p-4 sm:p-5`}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      {delta && <p className="mt-1 text-[11px] text-muted-foreground text-pretty">{delta}</p>}
    </div>
  );
}
