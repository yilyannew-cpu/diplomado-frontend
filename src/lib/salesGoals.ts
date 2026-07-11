/** Días del mes calendario actual (o de la fecha dada). */
export function daysInCalendarMonth(date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Meta mensual = diaria × días del mes. */
export function monthlyGoalFromDaily(daily: number, date = new Date()): number {
  return Math.round(daily * daysInCalendarMonth(date));
}

/** Meta diaria = mensual ÷ días del mes. */
export function dailyGoalFromMonthly(monthly: number, date = new Date()): number {
  const days = daysInCalendarMonth(date);
  return days > 0 ? Math.round(monthly / days) : monthly;
}
