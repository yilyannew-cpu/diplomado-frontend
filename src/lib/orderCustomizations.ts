import type { MenuItem } from "@/mocks/menuMock";
import type { OrderItem, OrderItemCustomizations } from "@/mocks/ordersMock";

export const MAIN_DISH_CATEGORY = "Platos principales" as const;

export function isCustomizableMainDish(product: MenuItem): boolean {
  return product.category === MAIN_DISH_CATEGORY;
}

export function formatCustomizationLines(
  customizations?: OrderItemCustomizations,
): string[] {
  if (!customizations) return [];

  const lines: string[] = [];

  for (const ingredient of customizations.removedIngredients) {
    lines.push(`Sin ${ingredient.toLowerCase()}`);
  }

  for (const [groupName, options] of Object.entries(customizations.addedModifiers)) {
    for (const option of options) {
      if (/adici/i.test(groupName)) {
        lines.push(`Con adición de ${option.toLowerCase()}`);
      } else {
        lines.push(`${groupName}: ${option}`);
      }
    }
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
