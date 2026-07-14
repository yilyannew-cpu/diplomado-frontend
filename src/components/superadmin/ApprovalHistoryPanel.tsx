import { useState } from "react";
import { Building2, Clock, Mail, Phone, RefreshCw } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { ApprovalHistoryFilter } from "@/hooks/useApprovalHistory";
import { useApprovalHistory } from "@/hooks/useApprovalHistory";
import type { User } from "@/lib/api/types";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

const HISTORY_FILTERS: Array<{ id: ApprovalHistoryFilter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "aprobados", label: "Aprobados" },
  { id: "rechazados", label: "Rechazados" },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApprovalHistoryPanel() {
  const [filter, setFilter] = useState<ApprovalHistoryFilter>("todos");
  const { users, loading, error, refresh } = useApprovalHistory(filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {HISTORY_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Cargando historial…
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No hay registros para este filtro.
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-display text-sm font-semibold sm:text-base">
              Historial ({users.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <HistoryRow key={user.id} user={user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryRow({ user }: { user: User }) {
  const isRestaurant = user.role === "admin";
  const isApproved = user.status === "Activo";

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        {isRestaurant ? (
          <UserAvatar
            name={user.restaurant_name?.trim() || user.name}
            src={
              resolveLogoUrl(user.restaurant_logo) ??
              user.restaurant_logo ??
              undefined
            }
            className="size-10 shrink-0"
          />
        ) : (
          <UserAvatar
            name={user.name}
            src={resolveLogoUrl(user.avatar) ?? user.avatar ?? undefined}
            className="size-10 shrink-0"
          />
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm">{user.name}</p>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
              {isRestaurant ? "Restaurante" : "Domiciliario"}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                isApproved ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive",
              )}
            >
              {isApproved ? "Aprobado" : "Rechazado"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            {user.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {user.phone}
              </span>
            )}
            {user.created_at && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                Registro: {formatDate(user.created_at)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3" />
              {user.email}
            </span>
          </div>
        </div>
      </div>
      {isRestaurant && user.restaurant_id && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-right">
          <Building2 className="size-4 shrink-0" />
          <span>Sede vinculada</span>
        </div>
      )}
    </div>
  );
}
