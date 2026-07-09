import type { ServiceHealthStatus, SystemStatus } from "@/lib/api/types/operations";
import { cn } from "@/lib/utils";

const OVERALL_LABEL: Record<ServiceHealthStatus, string> = {
  operational: "Todo operando",
  degraded: "Servicios degradados",
  down: "Interrupción detectada",
};

const STATUS_LABEL: Record<ServiceHealthStatus, string> = {
  operational: "Operativo",
  degraded: "Degradado",
  down: "Caído",
};

interface SystemStatusProps {
  system: SystemStatus | null;
  loading?: boolean;
}

export function SystemStatus({ system, loading }: SystemStatusProps) {
  if (loading) {
    return (
      <aside className="h-64 animate-pulse rounded-2xl bg-ink/80 p-6" aria-hidden />
    );
  }

  const overall = system?.overall ?? "operational";

  return (
    <aside className="rounded-2xl bg-ink p-6 text-cream">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
        Estado del sistema
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold">{OVERALL_LABEL[overall]}</h3>
      <p className="mt-1 text-xs text-cream/60">
        {system?.services.length
          ? `${system.services.length} servicios monitoreados`
          : "Sin datos de servicios"}
      </p>
      <ul className="mt-5 space-y-3 text-xs">
        {(system?.services ?? []).map((service) => (
          <StatusLine
            key={service.name}
            label={service.name}
            status={service.status}
            latencyMs={service.latency_ms}
          />
        ))}
      </ul>
    </aside>
  );
}

function StatusLine({
  label,
  status,
  latencyMs,
}: {
  label: string;
  status: ServiceHealthStatus;
  latencyMs: number;
}) {
  const dotColor =
    status === "operational"
      ? "bg-emerald-400"
      : status === "degraded"
        ? "bg-amber-brand"
        : "bg-red-400";

  const textColor =
    status === "operational"
      ? "text-emerald-300"
      : status === "degraded"
        ? "text-amber-brand"
        : "text-red-300";

  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-cream/80">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-1.5 rounded-full", dotColor)} />
        <span className={textColor}>{STATUS_LABEL[status]}</span>
        <span className="text-cream/40 tabular-nums">{latencyMs}ms</span>
      </span>
    </li>
  );
}
