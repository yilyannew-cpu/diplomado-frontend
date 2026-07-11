/** Comunas oficiales de Cúcuta (10). */
export const CUCUTA_COMUNAS = [
  { value: "Centro", label: "Comuna 1 · Centro" },
  { value: "Centro Oriental", label: "Comuna 2 · Centro Oriental" },
  { value: "Oriental Oriental", label: "Comuna 3 · Oriental Oriental" },
  { value: "Oriental Occidental", label: "Comuna 4 · Oriental Occidental" },
  { value: "Occidental", label: "Comuna 5 · Occidental" },
  { value: "Sur Occidental", label: "Comuna 6 · Sur Occidental" },
  { value: "Sur Oriental", label: "Comuna 7 · Sur Oriental" },
  { value: "Norte", label: "Comuna 8 · Norte" },
  { value: "Atalaya", label: "Comuna 9 · Atalaya" },
  { value: "La Libertad", label: "Comuna 10 · La Libertad" },
] as const;

export type CucutaComuna = (typeof CUCUTA_COMUNAS)[number]["value"];

export const CUCUTA_COMUNA_VALUES: CucutaComuna[] = CUCUTA_COMUNAS.map((c) => c.value);

export function isCucutaComuna(value: string): value is CucutaComuna {
  return (CUCUTA_COMUNA_VALUES as string[]).includes(value);
}
