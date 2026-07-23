/** Categoría de menú (nombre desde API / plantillas de catálogo). */
export type Category = string;

export const ADDITION_CATEGORY = "Adiciones";

export interface Ingredient {
  id: string;
  name: string;
  available: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceExtra: number;
  available: boolean;
  groupId: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  productId: string;
  minSelections: number;
  maxSelections: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  categoryId?: string;
  description: string;
  image: string;
  available: boolean;
  restaurantId: string;
  ingredients?: Ingredient[];
  modifierGroups?: ModifierGroup[];
}
