import type { MenuItem } from "@/types/menu";
import type { Promotion } from "@/types/promotion";
import { getProductPricing } from "@/lib/promotions";

export const CLIENT_CATEGORY_ORDER = [
  "Entradas",
  "Platos principales",
  "Acompañamientos",
  "Bebidas",
  "Postres",
  "Adiciones",
] as const;

export const POPULARES_SECTION_ID = "Populares";

/** Categorías presentes en el menú, en el orden del proyecto. */
export function getOrderedMenuCategories(menu: MenuItem[]): string[] {
  const present = new Set(menu.map((m) => m.category));
  const ordered = CLIENT_CATEGORY_ORDER.filter((name) => present.has(name));
  const extras = Array.from(present)
    .filter((name) => !(CLIENT_CATEGORY_ORDER as readonly string[]).includes(name))
    .sort((a, b) => a.localeCompare(b, "es"));
  return [...ordered, ...extras];
}

/**
 * Productos “Populares” del restaurante.
 * Prioriza ítems en promoción y platos principales (aún no hay quantity_sold en API cliente).
 */
export function getPopularProducts(
  menu: MenuItem[],
  promotions: Promotion[],
  limit = 10,
): MenuItem[] {
  const available = menu.filter((m) => m.available);
  if (available.length === 0) return [];

  const promoIds = new Set(promotions.flatMap((promo) => promo.productIds ?? []));

  const score = (product: MenuItem) => {
    let points = 0;
    if (promoIds.has(product.id)) points += 100;
    if (getProductPricing(product, promotions).hasPromotion) points += 80;
    if (product.category === "Platos principales") points += 45;
    if (product.category === "Entradas") points += 25;
    if (product.category === "Bebidas") points += 10;
    // Prioriza firmas de precio medio-alto como “más vendidos”.
    points += Math.min(35, Math.round(product.price / 4000));
    return points;
  };

  return [...available]
    .sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, "es");
    })
    .slice(0, Math.min(limit, available.length));
}

export function getRestaurantHeroImage(
  restaurant: { coverImage?: string | null; accent?: string },
  menu: MenuItem[],
  popular: MenuItem[],
): string | null {
  if (restaurant.coverImage) return restaurant.coverImage;

  const candidate =
    popular.find((p) => p.image)?.image ??
    menu.find((p) => p.category === "Platos principales" && p.image)?.image ??
    menu.find((p) => p.image)?.image ??
    null;
  return candidate;
}
