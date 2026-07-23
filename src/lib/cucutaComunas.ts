/**
 * Heurísticas de geocoding para Cúcuta.
 * Los códigos oficiales de comuna viven en la API (`/catalog/comunas`);
 * este módulo solo ayuda a inferir comuna desde dirección/GPS.
 */
import { getCatalogComunaCodes } from "@/lib/catalogCache";

export type CucutaComuna = string;

export function getCucutaComunaCodes(): string[] {
  return getCatalogComunaCodes();
}

export function isCucutaComuna(value: string): value is CucutaComuna {
  const codes = getCatalogComunaCodes();
  if (codes.length === 0) return value.trim().length > 0;
  return codes.includes(value);
}
