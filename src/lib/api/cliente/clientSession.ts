import type { MenuItem } from "@/mocks/menuMock";
import type { Order } from "@/mocks/ordersMock";
import type { OrderItemCustomizations } from "@/mocks/ordersMock";
import type { Promotion } from "@/mocks/promotionsMock";
import type { Restaurant } from "@/mocks/restaurantsMock";

export type ClientTab = "menu" | "tracking";
export type ClientModule = "inicio" | "promociones" | "rankin";

export interface ClienteSessionCartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  customizations?: OrderItemCustomizations;
}

/** Estado de UI del panel cliente que sobrevive al desmontar la ruta. */
export interface ClienteSessionState {
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  menu: MenuItem[];
  allMenus: MenuItem[];
  promotions: Promotion[];
  cart: ClienteSessionCartItem[];
  clientTab: ClientTab;
  clientModule: ClientModule;
  activeClientOrderId: string | null;
  trackedOrder: Order | null;
}

let session: ClienteSessionState | null = null;

export function readClienteSession(): ClienteSessionState | null {
  return session;
}

export function writeClienteSession(next: ClienteSessionState): void {
  session = next;
}

export function clearClienteSession(): void {
  session = null;
}
