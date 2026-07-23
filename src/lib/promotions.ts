import type { MenuItem } from "@/types/menu";
import type { Promotion } from "@/types/promotion";

export type PromotionStatus = "active" | "scheduled" | "expired" | "inactive";

export interface ProductPricing {
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  hasPromotion: boolean;
  promotionName?: string;
}

export function toDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPromotionStatus(promotion: Promotion, reference = new Date()): PromotionStatus {
  if (!promotion.active) return "inactive";
  const key = toDateKey(reference);
  if (key < promotion.startDate) return "scheduled";
  if (key > promotion.endDate) return "expired";
  return "active";
}

export function isPromotionActive(promotion: Promotion, reference = new Date()): boolean {
  return getPromotionStatus(promotion, reference) === "active";
}

function getBestPromotionForProduct(
  productId: string,
  promotions: Promotion[],
  reference = new Date(),
): Promotion | undefined {
  return promotions
    .filter((promo) => isPromotionActive(promo, reference) && promo.productIds.includes(productId))
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];
}

export function getProductPricing(
  product: MenuItem,
  promotions: Promotion[],
  reference = new Date(),
): ProductPricing {
  const best = getBestPromotionForProduct(product.id, promotions, reference);
  if (!best) {
    return {
      originalPrice: product.price,
      salePrice: product.price,
      discountPercent: 0,
      hasPromotion: false,
    };
  }

  const salePrice = Math.round(product.price * (1 - best.discountPercent / 100));
  return {
    originalPrice: product.price,
    salePrice,
    discountPercent: best.discountPercent,
    hasPromotion: true,
    promotionName: best.name,
  };
}

export function getActivePromotedProducts(
  menu: MenuItem[],
  promotions: Promotion[],
  reference = new Date(),
): { product: MenuItem; pricing: ProductPricing; promotion: Promotion }[] {
  const results: { product: MenuItem; pricing: ProductPricing; promotion: Promotion }[] = [];

  for (const product of menu) {
    if (!product.available) continue;
    const promotion = getBestPromotionForProduct(product.id, promotions, reference);
    if (!promotion) continue;
    results.push({
      product,
      pricing: getProductPricing(product, promotions, reference),
      promotion,
    });
  }

  return results.sort(
    (a, b) => b.pricing.discountPercent - a.pricing.discountPercent || a.product.name.localeCompare(b.product.name, "es"),
  );
}

export type ActivePromotionGroup = {
  promotion: Promotion;
  restaurantId: string;
  restaurantName: string;
  products: { product: MenuItem; pricing: ProductPricing }[];
};

/** Agrupa promociones activas (todas las sedes) por campaña. */
export function groupActivePromotions(
  menu: MenuItem[],
  promotions: Promotion[],
  restaurants: Array<{ id: string; name: string }>,
  reference = new Date(),
): ActivePromotionGroup[] {
  const productById = new Map(menu.map((p) => [p.id, p]));
  const restaurantNameById = new Map(restaurants.map((r) => [r.id, r.name]));
  const groups: ActivePromotionGroup[] = [];

  const active = promotions
    .filter((promo) => isPromotionActive(promo, reference))
    .sort((a, b) => b.discountPercent - a.discountPercent || a.name.localeCompare(b.name, "es"));

  for (const promotion of active) {
    const products: ActivePromotionGroup["products"] = [];
    for (const productId of promotion.productIds) {
      const product = productById.get(productId);
      if (!product?.available) continue;
      const salePrice = Math.round(product.price * (1 - promotion.discountPercent / 100));
      products.push({
        product,
        pricing: {
          originalPrice: product.price,
          salePrice,
          discountPercent: promotion.discountPercent,
          hasPromotion: true,
          promotionName: promotion.name,
        },
      });
    }
    if (products.length === 0) continue;

    const restaurantId =
      promotion.restaurantId ??
      products[0]?.product.restaurantId ??
      "";

    groups.push({
      promotion,
      restaurantId,
      restaurantName: restaurantNameById.get(restaurantId) ?? "Restaurante",
      products,
    });
  }

  return groups;
}

export function promotionStatusLabel(status: PromotionStatus): string {
  switch (status) {
    case "active":
      return "Activa";
    case "scheduled":
      return "Programada";
    case "inactive":
      return "Inactiva";
    default:
      return "Finalizada";
  }
}

export function promotionStatusClass(status: PromotionStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/15 text-emerald-700";
    case "scheduled":
      return "bg-primary/10 text-primary";
    case "inactive":
      return "bg-rose-500/15 text-rose-700";
    default:
      return "bg-secondary text-muted-foreground";
  }
}
