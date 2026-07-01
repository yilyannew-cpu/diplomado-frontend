import { formatCOP } from "@/context/OrderContext";
import { type Role } from "@/mocks/usersMock";

interface MetricCounts {
  cliente: number;
  admin: number;
  domiciliario: number;
}

interface SuperadminMetricsProps {
  counts: MetricCounts;
  sales: number;
}

export function SuperadminMetrics({ counts, sales }: SuperadminMetricsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 md:gap-4">
      <MetricCard label="Ventas hoy" value={formatCOP(sales)} delta="+12% vs ayer" tone="primary" />
      <MetricCard label="Clientes registrados" value={String(counts.cliente)} delta="Activos en plataforma" />
      <MetricCard label="Admins activos" value={String(counts.admin)} delta={`${counts.admin} sedes operando`} />
      <MetricCard label="Domiciliarios" value={String(counts.domiciliario)} delta="En ruta o disponibles" tone="amber" />
    </section>
  );
}

function MetricCard({ label, value, delta, tone = "default" }: { label: string; value: string; delta?: string; tone?: "default" | "primary" | "amber" }) {
  const accent =
    tone === "primary"
      ? "border-primary/20 bg-primary/5"
      : tone === "amber"
        ? "border-amber-brand/30 bg-amber-brand/10"
        : "border-border bg-card";
  return (
    <div className={`rounded-2xl border ${accent} p-4 sm:p-5`}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:text-[11px]">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      {delta && <p className="mt-1 text-[11px] text-muted-foreground">{delta}</p>}
    </div>
  );
}
