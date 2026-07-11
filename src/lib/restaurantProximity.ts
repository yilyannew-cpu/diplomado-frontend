import type { Restaurant } from "@/mocks/restaurantsMock";

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export type RestaurantProximity = "recomendado" | "lejos";

/**
 * Extrae la comuna del campo city del restaurante.
 * Formato esperado al registrar: "Cúcuta · Centro Oriental"
 */
export function extractRestaurantComuna(city: string | null | undefined): string | null {
  if (!city?.trim()) return null;
  const parts = city.split("·").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1] ?? null;
  return city.trim();
}

export function isSameComuna(
  restaurantCity: string | null | undefined,
  clientComuna: string | null | undefined,
): boolean {
  if (!clientComuna?.trim()) return false;
  const restaurantComuna = extractRestaurantComuna(restaurantCity);
  if (!restaurantComuna) return false;
  return normalizeLabel(restaurantComuna) === normalizeLabel(clientComuna);
}

export function getRestaurantProximity(
  restaurant: Pick<Restaurant, "city">,
  clientComuna: string | null | undefined,
): RestaurantProximity | null {
  if (!clientComuna?.trim()) return null;
  return isSameComuna(restaurant.city, clientComuna) ? "recomendado" : "lejos";
}

/** Cerca primero (recomendados), luego lejos; empate por nombre. */
export function sortRestaurantsByProximity<T extends Pick<Restaurant, "id" | "name" | "city">>(
  restaurants: T[],
  clientComuna: string | null | undefined,
): T[] {
  if (!clientComuna?.trim()) {
    return [...restaurants].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return [...restaurants].sort((a, b) => {
    const aNear = isSameComuna(a.city, clientComuna) ? 0 : 1;
    const bNear = isSameComuna(b.city, clientComuna) ? 0 : 1;
    if (aNear !== bNear) return aNear - bNear;
    return a.name.localeCompare(b.name, "es");
  });
}
