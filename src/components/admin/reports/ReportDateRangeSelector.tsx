import { CalendarDays } from "lucide-react";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  REPORT_DATE_PRESETS,
  type ReportDatePreset,
  type ReportDateRange,
} from "@/lib/salesReports";

interface ReportDateRangeSelectorProps {
  value: ReportDateRange;
  onChange: (range: ReportDateRange) => void;
}

export function ReportDateRangeSelector({ value, onChange }: ReportDateRangeSelectorProps) {
  const showCustom = value.preset === "custom";

  const customSummary = useMemo(() => {
    if (!value.customFrom || !value.customTo) return "Seleccionar fechas";
    return `${value.customFrom} — ${value.customTo}`;
  }, [value.customFrom, value.customTo]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value.preset}
        onValueChange={(preset) =>
          onChange({
            ...value,
            preset: preset as ReportDatePreset,
          })
        }
      >
        <SelectTrigger className="h-9 w-[180px] rounded-xl border-border bg-card text-xs font-medium shadow-sm">
          <CalendarDays className="mr-2 size-3.5 shrink-0 text-primary" />
          <SelectValue placeholder="Periodo" />
        </SelectTrigger>
        <SelectContent>
          {REPORT_DATE_PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustom ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              {customSummary}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3" align="end">
            <div className="space-y-1.5">
              <Label htmlFor="report-from" className="text-xs">
                Desde
              </Label>
              <Input
                id="report-from"
                type="date"
                value={value.customFrom ?? ""}
                onChange={(e) => onChange({ ...value, customFrom: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to" className="text-xs">
                Hasta
              </Label>
              <Input
                id="report-to"
                type="date"
                value={value.customTo ?? ""}
                onChange={(e) => onChange({ ...value, customTo: e.target.value })}
                className="h-9"
              />
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
