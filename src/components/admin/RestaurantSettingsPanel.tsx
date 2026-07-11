import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import {
  formatThousands,
  formatThousandsInput,
  parseThousandsInput,
} from "@/lib/formatThousandsInput";
import {
  dailyGoalFromMonthly,
  daysInCalendarMonth,
  monthlyGoalFromDaily,
} from "@/lib/salesGoals";

export function RestaurantSettingsPanel() {
  const { restaurant, updateSalesGoals } = useAdmin();
  const [dailyInput, setDailyInput] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const daysInMonth = daysInCalendarMonth();

  useEffect(() => {
    const daily =
      restaurant?.daily_goal != null && restaurant.daily_goal > 0
        ? restaurant.daily_goal
        : null;
    const monthly =
      restaurant?.monthly_goal != null && restaurant.monthly_goal > 0
        ? restaurant.monthly_goal
        : null;

    if (daily != null) {
      setDailyInput(formatThousands(daily));
      setMonthlyInput(formatThousands(monthlyGoalFromDaily(daily)));
    } else if (monthly != null) {
      setMonthlyInput(formatThousands(monthly));
      setDailyInput(formatThousands(dailyGoalFromMonthly(monthly)));
    } else {
      setDailyInput("");
      setMonthlyInput("");
    }
  }, [restaurant?.daily_goal, restaurant?.monthly_goal]);

  const dailyGoal = parseThousandsInput(dailyInput);
  const monthlyGoal = parseThousandsInput(monthlyInput);

  const onDailyChange = (raw: string) => {
    const formatted = formatThousandsInput(raw);
    setDailyInput(formatted);
    const value = parseThousandsInput(formatted);
    if (value == null) {
      setMonthlyInput("");
      return;
    }
    setMonthlyInput(formatThousands(monthlyGoalFromDaily(value)));
  };

  const onMonthlyChange = (raw: string) => {
    const formatted = formatThousandsInput(raw);
    setMonthlyInput(formatted);
    const value = parseThousandsInput(formatted);
    if (value == null) {
      setDailyInput("");
      return;
    }
    setDailyInput(formatThousands(dailyGoalFromMonthly(value)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let daily = dailyGoal != null && dailyGoal > 0 ? dailyGoal : null;
      let monthly = monthlyGoal != null && monthlyGoal > 0 ? monthlyGoal : null;

      if (daily != null && monthly == null) {
        monthly = monthlyGoalFromDaily(daily);
      } else if (monthly != null && daily == null) {
        daily = dailyGoalFromMonthly(monthly);
      } else if (daily != null && monthly != null) {
        // Mantener coherencia: la última edición ya sincronizó ambos inputs.
        monthly = monthlyGoalFromDaily(daily);
      }

      await updateSalesGoals({ dailyGoal: daily, monthlyGoal: monthly });
      toast.success("Metas guardadas");
    } catch {
      // error ya notificado en AdminContext
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setDailyInput("");
    setMonthlyInput("");
    setSaving(true);
    try {
      await updateSalesGoals({ dailyGoal: null, monthlyGoal: null });
      toast.success("Metas desactivadas");
    } catch {
      // error ya notificado
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-[11px]">
          Metas de ventas
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold sm:text-xl">
          Objetivos opcionales
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ingresa la meta diaria o la mensual: la otra se calcula sola con los{" "}
          <span className="font-medium text-foreground">{daysInMonth} días</span> de este
          mes. El dashboard usa ambas para el cumplimiento.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Meta diaria (COP)</span>
            <input
              type="text"
              inputMode="numeric"
              value={dailyInput}
              onChange={(e) => onDailyChange(e.target.value)}
              placeholder="Ej. 800.000"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm tabular-nums outline-none ring-primary/30 focus:ring-2"
            />
            <span className="text-[11px] text-muted-foreground">
              {dailyGoal != null
                ? `Hoy · ${formatCOP(dailyGoal)} → mes ${formatCOP(monthlyGoalFromDaily(dailyGoal))}`
                : "Sin meta diaria"}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-foreground">Meta mensual (COP)</span>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyInput}
              onChange={(e) => onMonthlyChange(e.target.value)}
              placeholder="Ej. 18.000.000"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm tabular-nums outline-none ring-primary/30 focus:ring-2"
            />
            <span className="text-[11px] text-muted-foreground">
              {monthlyGoal != null
                ? `Mes · ${formatCOP(monthlyGoal)} → día ${formatCOP(dailyGoalFromMonthly(monthlyGoal))}`
                : "Sin meta mensual"}
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={saving}
            className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50 sm:min-h-0"
          >
            Quitar metas
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !restaurant}
            className="min-h-11 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-primary disabled:opacity-50 sm:min-h-0"
          >
            {saving ? "Guardando…" : "Guardar metas"}
          </button>
        </div>
      </section>
    </div>
  );
}
