import { formatCOP } from "@/context/OrderContext";

/** Comisión estimada de la pasarela de pagos (mock). */
export const PAYMENT_GATEWAY_FEE_RATE = 0.035;

export function calcGatewayFee(grossSales: number): number {
  return Math.round(grossSales * PAYMENT_GATEWAY_FEE_RATE);
}

/** Formato compacto alineado con la escala del gráfico (K / M). */
export function formatReportAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted =
      millions >= 10
        ? Math.round(millions).toString()
        : millions.toFixed(1).replace(".", ",").replace(",0", "");
    return `$ ${formatted} M`;
  }
  if (abs >= 1_000) {
    return `$ ${Math.round(value / 1_000)}K`;
  }
  return formatCOP(value);
}

export function exportFinancialDetailCsv(
  rows: {
    label: string;
    grossSales: number;
    courierPayout: number;
    appCommissions: number;
    netProfit: number;
  }[],
): void {
  const header = [
    "Mes",
    "Facturación Bruta",
    "Costo Domicilios",
    "Comisiones App",
    "Ganancia Neta",
  ];
  const body = rows.map((row) =>
    [
      row.label,
      row.grossSales,
      row.courierPayout,
      row.appCommissions,
      row.netProfit,
    ].join(","),
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
