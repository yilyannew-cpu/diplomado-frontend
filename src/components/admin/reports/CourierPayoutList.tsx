import { Bike } from "lucide-react";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { CourierRatingBadge } from "@/components/shared/CourierRatingBadge";
import { formatCOP } from "@/context/OrderContext";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import type { CourierPayoutRow } from "@/lib/salesReports";

interface CourierPayoutListProps {
  couriers: CourierPayoutRow[];
  periodLabel: string;
}

export function CourierPayoutList({ couriers, periodLabel }: CourierPayoutListProps) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
            {periodLabel}
          </p>
          <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">
            Pago por domiciliario
          </h2>
        </div>
        <div className="flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
          <Bike className="size-3.5" />
          <span className="text-[11px] font-semibold">{couriers.length} repartidores</span>
        </div>
      </div>

      {couriers.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground sm:py-12">
          Sin liquidaciones de domicilio en este periodo.
        </p>
      ) : (
        <ul className="space-y-2">
          {couriers.map((row) => (
            <li
              key={row.courierId}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar
                  name={row.courierName}
                  src={resolveLogoUrl(row.courierAvatar) ?? row.courierAvatar}
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
              </div>
              <div className="shrink-0 border-t border-border/50 pt-2 text-right sm:border-0 sm:pt-0">
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
                    <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground text-pretty break-words">
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
