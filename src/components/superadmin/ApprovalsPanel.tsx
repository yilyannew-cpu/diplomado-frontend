import { Building2, Bike, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import type { PendingUser } from "@/lib/api/types";
import { usePendingApprovals, type PendingApprovalsState } from "@/hooks/usePendingApprovals";
import { cn } from "@/lib/utils";

type ApprovalFilter = "todos" | "admin" | "domiciliario";

const ROLE_LABEL: Record<string, string> = {
  admin: "Restaurante",
  domiciliario: "Domiciliario",
};

type ApprovalsPanelProps = {
  compact?: boolean;
  state?: PendingApprovalsState;
};

export function ApprovalsPanel({ compact = false, state }: ApprovalsPanelProps) {
  if (state) {
    return <ApprovalsPanelContent compact={compact} state={state} />;
  }
  return <ApprovalsPanelConnected compact={compact} />;
}

function ApprovalsPanelConnected({ compact }: { compact?: boolean }) {
  const state = usePendingApprovals();
  return <ApprovalsPanelContent compact={compact} state={state} />;
}

function ApprovalsPanelContent({
  compact,
  state,
}: {
  compact?: boolean;
  state: PendingApprovalsState;
}) {
  const {
    pending,
    restaurantPending,
    courierPending,
    pendingCount,
    loading,
    error,
    successMessage,
    actionId,
    refresh,
    approve,
    reject,
    clearSuccess,
  } = state;

  const [filter, setFilter] = useState<ApprovalFilter>("todos");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (filter === "admin") return restaurantPending;
    if (filter === "domiciliario") return courierPending;
    return pending;
  }, [filter, pending, restaurantPending, courierPending]);

  const tabs: Array<{ id: ApprovalFilter; label: string; count: number }> = [
    { id: "todos", label: "Todos", count: pendingCount },
    { id: "admin", label: "Restaurantes", count: restaurantPending.length },
    { id: "domiciliario", label: "Domiciliarios", count: courierPending.length },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold sm:text-xl">Módulo de aprobaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Autoriza registros de restaurantes y domiciliarios para que puedan iniciar sesión en su panel.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-60"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {tab.label}
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{tab.count}</span>
          </button>
        ))}
      </div>

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          <p>{successMessage}</p>
          <button type="button" onClick={clearSuccess} className="text-xs font-semibold hover:underline">
            Cerrar
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando solicitudes pendientes…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="font-medium">No hay solicitudes pendientes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Los registros públicos de restaurante y domiciliario aparecerán aquí hasta ser aprobados.
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-4", compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
          {filtered.map((user) => (
            <ApprovalCard
              key={user.id}
              user={user}
              actionId={actionId}
              rejectReason={rejectReasons[user.id] ?? ""}
              onRejectReasonChange={(value) =>
                setRejectReasons((prev) => ({ ...prev, [user.id]: value }))
              }
              onApprove={() => void approve(user.id, user.name)}
              onReject={() => void reject(user.id, user.name, rejectReasons[user.id])}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ApprovalCard({
  user,
  actionId,
  rejectReason,
  onRejectReasonChange,
  onApprove,
  onReject,
}: {
  user: PendingUser;
  actionId: string | null;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isRestaurant = user.role === "admin";
  const busy = actionId === user.id;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            isRestaurant ? "bg-primary/10 text-primary" : "bg-amber-brand/15 text-amber-brand",
          )}
        >
          {isRestaurant ? <Building2 className="size-5" /> : <Bike className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold">{user.name}</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
            <span className="rounded-full bg-amber-brand/15 px-2 py-0.5 text-[10px] font-semibold text-amber-brand">
              Pendiente
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        {user.phone && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground">Teléfono</dt>
            <dd>{user.phone}</dd>
          </div>
        )}
        {user.document_id && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground">Documento</dt>
            <dd>{user.document_id}</dd>
          </div>
        )}
        {user.vehicle && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground">Vehículo</dt>
            <dd>{user.vehicle}</dd>
          </div>
        )}
        {user.created_at && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground">Solicitud</dt>
            <dd>{new Date(user.created_at).toLocaleString("es-CO")}</dd>
          </div>
        )}
      </dl>

      {user.restaurant && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Restaurante</p>
          <p className="mt-1 font-semibold">{user.restaurant.name}</p>
          <p className="text-xs text-muted-foreground">{user.restaurant.city}</p>
          <p className="text-xs text-muted-foreground">{user.restaurant.address}</p>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-4">
        <input
          type="text"
          value={rejectReason}
          onChange={(e) => onRejectReasonChange(e.target.value)}
          placeholder="Motivo de rechazo (opcional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Procesando…" : "Aprobar acceso"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="flex-1 rounded-lg border border-destructive/30 px-3 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      </div>
    </article>
  );
}

export function ApprovalsSummaryCard({
  pendingCount,
  restaurantCount,
  courierCount,
}: {
  pendingCount: number;
  restaurantCount: number;
  courierCount: number;
}) {
  return (
    <div className="rounded-2xl border border-amber-brand/30 bg-amber-brand/10 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
        Aprobaciones pendientes
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{pendingCount}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {restaurantCount} restaurante{restaurantCount !== 1 ? "s" : ""} · {courierCount} domiciliario
        {courierCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
