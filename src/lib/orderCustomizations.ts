import type { MenuItem } from "@/types/menu";
import type { OrderItem, OrderItemCustomizations, SelectedMenuExtra } from "@/types/order";

export const MAIN_DISH_CATEGORY = "Platos principales" as const;
export const ADDITION_CATEGORY = "Adiciones" as const;
export const SIDE_CATEGORY = "Acompañamientos" as const;
export const DRINK_CATEGORY = "Bebidas" as const;

export function isCustomizableMainDish(product: MenuItem): boolean {
  return product.category === MAIN_DISH_CATEGORY;
}

export function filterMenuExtras(
  menu: MenuItem[],
  restaurantId: string,
  category: string,
): MenuItem[] {
  return menu.filter(
    (item) =>
      item.restaurantId === restaurantId &&
      item.category === category &&
      item.available,
  );
}

export function sumExtraPrices(extras: SelectedMenuExtra[]): number {
  return extras.reduce((sum, item) => sum + item.price, 0);
}

export function formatCustomizationLines(
  customizations?: OrderItemCustomizations,
): string[] {
  if (!customizations) return [];

  const lines: string[] = [];

  for (const ingredient of customizations.removedIngredients ?? []) {
    lines.push(`Sin ${ingredient.toLowerCase()}`);
  }

  for (const [groupName, options] of Object.entries(customizations.addedModifiers ?? {})) {
    for (const option of options) {
      if (/adici/i.test(groupName)) {
        lines.push(`Con adición de ${option.toLowerCase()}`);
      } else {
        lines.push(`${groupName}: ${option}`);
      }
    }
  }

  for (const addition of customizations.additions ?? []) {
    lines.push(`Adición: ${addition.name}`);
  }
  for (const side of customizations.sides ?? []) {
    lines.push(`Acompañamiento: ${side.name}`);
  }
  for (const drink of customizations.drinks ?? []) {
    lines.push(`Bebida: ${drink.name}`);
  }

  const instructions = customizations.specialInstructions?.trim();
  if (instructions) {
    lines.push(`Nota: ${instructions}`);
  }

  return lines;
}

export function getOrderItemLineKey(item: OrderItem, index: number): string {
  return item.lineId ?? `${item.productId}-${index}`;
}

export function getOrderItemUnitPrice(
  basePrice: number,
  customizations?: OrderItemCustomizations,
): number {
  return basePrice + (customizations?.extraPrice ?? 0);
}

export function hasMeaningfulCustomizations(
  customizations?: OrderItemCustomizations,
): boolean {
  if (!customizations) return false;
  return (
    (customizations.additions?.length ?? 0) > 0 ||
    (customizations.sides?.length ?? 0) > 0 ||
    (customizations.drinks?.length ?? 0) > 0 ||
    Boolean(customizations.specialInstructions?.trim()) ||
    (customizations.removedIngredients?.length ?? 0) > 0 ||
    Object.values(customizations.addedModifiers ?? {}).some((opts) => opts.length > 0)
  );
}
