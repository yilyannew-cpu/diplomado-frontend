import { Eye } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCOP } from "@/context/OrderContext";
import { formatReportAmount, PAYMENT_GATEWAY_FEE_RATE } from "@/lib/salesReportFormat";
import type { MonthlySalesReport } from "@/lib/salesReports";
import { ExportReportButton } from "./ExportReportButton";

interface FinancialDetailTableProps {
  months: MonthlySalesReport[];
}

export function FinancialDetailTable({ months }: FinancialDetailTableProps) {
  const [selectedMonth, setSelectedMonth] = useState<MonthlySalesReport | null>(null);
  const rows = [...months].reverse();

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Resumen por mes
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">Detalle financiero</h2>
        </div>
        <ExportReportButton months={months} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <th className="pb-3 pr-3">Mes</th>
              <th className="pb-3 pr-3 text-right">Facturación bruta</th>
              <th className="pb-3 pr-3 text-right">Costo domicilios</th>
              <th className="pb-3 pr-3 text-right">Comisiones app</th>
              <th className="pb-3 pr-3 text-right">Ganancia neta</th>
              <th className="pb-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Sin datos para el periodo seleccionado.
                </td>
              </tr>
            ) : (
              rows.map((month) => (
                <tr key={month.monthKey} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-3 font-medium">{month.label}</td>
                  <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums">
                    {formatCOP(month.grossSales)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-chart-4">
                    {formatCOP(month.courierPayout)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-xs tabular-nums text-amber-brand">
                    {formatCOP(month.appCommissions)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-xs font-semibold tabular-nums text-chart-2">
                    {formatCOP(month.netProfit)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(month)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <Eye className="size-3.5" />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        {selectedMonth ? (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalle — {selectedMonth.label}</DialogTitle>
            </DialogHeader>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Facturación bruta" value={formatCOP(selectedMonth.grossSales)} />
              <DetailRow
                label="Costo domicilios"
                value={formatCOP(selectedMonth.courierPayout)}
                valueClass="text-chart-4"
              />
              <DetailRow
                label={`Comisiones pasarela (${(PAYMENT_GATEWAY_FEE_RATE * 100).toFixed(1)}%)`}
                value={`-${formatCOP(selectedMonth.appCommissions)}`}
                valueClass="text-amber-brand"
              />
              <DetailRow
                label="Ganancia neta operativa"
                value={formatCOP(selectedMonth.netProfit)}
                valueClass="text-chart-2 font-semibold"
              />
              <DetailRow
                label="Neto real en caja"
                value={formatReportAmount(selectedMonth.realNetProfit)}
                valueClass="text-primary font-semibold"
              />
              <DetailRow
                label="Pedidos entregados"
                value={String(selectedMonth.deliveredOrders)}
              />
            </dl>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-mono text-sm tabular-nums ${valueClass ?? ""}`}>{value}</dd>
    </div>
  );
}
