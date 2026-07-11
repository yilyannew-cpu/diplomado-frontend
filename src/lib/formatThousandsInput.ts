/** Formato de enteros con separador de miles (es-CO: 1.800.000). */

export function parseThousandsInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

export function formatThousands(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  return Math.round(value).toLocaleString("es-CO");
}

/** Reformatea lo que escribe el usuario mientras tipea. */
export function formatThousandsInput(raw: string): string {
  const value = parseThousandsInput(raw);
  return value == null ? "" : formatThousands(value);
}
