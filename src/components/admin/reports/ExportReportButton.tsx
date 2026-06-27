import { Download } from "lucide-react";
import { exportFinancialDetailCsv } from "@/lib/salesReportFormat";
import type { MonthlySalesReport } from "@/lib/salesReports";

interface ExportReportButtonProps {
  months: MonthlySalesReport[];
}

export function ExportReportButton({ months }: ExportReportButtonProps) {
  return (
    <button
      type="button"
      onClick={() => exportFinancialDetailCsv(months)}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
      title="Exportar a CSV"
    >
      <Download className="size-3.5 text-primary" />
      Exportar CSV
    </button>
  );
}
