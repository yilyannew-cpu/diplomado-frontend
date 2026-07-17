import type { MenuItem } from "@/mocks/menuMock";
import type { OrderItemCustomizations } from "@/mocks/ordersMock";

const CLIENT_CART_KEY = "ffcore_client_cart";

export type StoredCartItem = {
  id: string;
  product: MenuItem;
  quantity: number;
  customizations?: OrderItemCustomizations;
};

type StoredCart = {
  userId: string;
  items: StoredCartItem[];
  updatedAt: number;
};

function isValidCartItem(value: unknown): value is StoredCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as StoredCartItem;
  return (
    typeof item.id === "string" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    item.product != null &&
    typeof item.product === "object" &&
    typeof item.product.id === "string" &&
    typeof item.product.name === "string"
  );
}

export function readClientCart(userId: string): StoredCartItem[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = window.localStorage.getItem(CLIENT_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCart;
    if (parsed.userId !== userId || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter(isValidCartItem);
  } catch {
    return [];
  }
}

export function writeClientCart(userId: string, items: StoredCartItem[]): void {
  if (typeof window === "undefined" || !userId) return;
  const payload: StoredCart = {
    userId,
    items,
    updatedAt: Date.now(),
  };
  window.localStorage.setItem(CLIENT_CART_KEY, JSON.stringify(payload));
}

export function clearClientCart(userId?: string): void {
  if (typeof window === "undefined") return;
  if (!userId) {
    window.localStorage.removeItem(CLIENT_CART_KEY);
    return;
  }
  try {
    const raw = window.localStorage.getItem(CLIENT_CART_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredCart;
    if (parsed.userId === userId) {
      window.localStorage.removeItem(CLIENT_CART_KEY);
    }
  } catch {
    window.localStorage.removeItem(CLIENT_CART_KEY);
  }
}
