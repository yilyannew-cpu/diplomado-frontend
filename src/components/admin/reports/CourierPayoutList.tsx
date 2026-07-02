import { Bike } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CourierRatingBadge } from "@/components/shared/CourierRatingBadge";
import { formatCOP } from "@/context/OrderContext";
import type { CourierPayoutRow } from "@/lib/salesReports";

interface CourierPayoutListProps {
  couriers: CourierPayoutRow[];
  periodLabel: string;
}

export function CourierPayoutList({ couriers, periodLabel }: CourierPayoutListProps) {
  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            {periodLabel}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">Pago por domiciliario</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
          <Bike className="size-3.5" />
          <span className="text-[11px] font-semibold">{couriers.length} repartidores</span>
        </div>
      </div>

      {couriers.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Sin liquidaciones de domicilio en este periodo.
        </p>
      ) : (
        <ul className="space-y-2">
          {couriers.map((row) => (
            <li
              key={row.courierId}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-3"
            >
              <UserAvatar
                name={row.courierName}
                src={row.courierAvatar}
                className="size-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{row.courierName}</p>
                  <SettlementBadge status={row.status} />
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.vehicle ?? "Sin vehículo"} · {row.deliveries} entregas
                </p>
                <CourierRatingBadge
                  averageRating={row.averageRating}
                  reviewCount={row.reviewCount}
                  className="mt-1"
                />
              </div>
              <div className="shrink-0 text-right">
                {row.status === "liquidado" ? (
                  <>
                    <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                      {formatCOP(row.settledAmount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">liquidado</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm font-semibold tabular-nums text-amber-brand">
                      {formatCOP(row.pendingAmount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      pendiente · {formatCOP(row.settledAmount)} pagado
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SettlementBadge({ status }: { status: CourierPayoutRow["status"] }) {
  if (status === "liquidado") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        Liquidado
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-brand/20 px-2 py-0.5 text-[10px] font-semibold text-amber-brand">
      Pendiente por pagar
    </span>
  );
}
