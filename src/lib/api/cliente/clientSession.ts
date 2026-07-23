import type { MenuItem } from "@/types/menu";
import type { Order } from "@/types/order";
import type { OrderItemCustomizations } from "@/types/order";
import type { Promotion } from "@/types/promotion";
import type { Restaurant } from "@/types/restaurant";

export type ClientTab = "menu" | "tracking";
export type ClientModule = "inicio" | "promociones" | "rankin" | "mis-pedidos";

export interface ClienteSessionCartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  customizations?: OrderItemCustomizations;
}

/** Estado de UI del panel cliente que sobrevive al desmontar la ruta. */
export interface ClienteSessionState {
  /** Dueño de la sesión; si cambia el login, se descarta el tracking. */
  userId: string | null;
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  /** Vista ficha del restaurante (estilo Uber Eats / menú por sede). */
  restaurantDetailOpen: boolean;
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
