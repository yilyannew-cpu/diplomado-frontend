/** Códigos de comuna activos (rellenados por CatalogProvider para geocoding sync). */
let comunaCodes: string[] = [];

export function setCatalogComunaCodes(codes: string[]): void {
  comunaCodes = [...codes];
}

export function getCatalogComunaCodes(): string[] {
  return comunaCodes;
}

export function isKnownComunaCode(value: string): boolean {
  return comunaCodes.includes(value);
}
