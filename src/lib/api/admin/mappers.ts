import type { ApiOrder, ApiProduct, ApiPromotion } from "@/lib/api/types/admin";
import type {
  Ingredient,
  MenuItem,
  ModifierGroup,
  ModifierOption,
  Category,
} from "@/mocks/menuMock";
import type { Order, OrderItem, OrderStatus } from "@/mocks/ordersMock";
import type { Promotion } from "@/mocks/promotionsMock";

const API_TO_FRONT_STATUS: Record<string, OrderStatus> = {
  Recibido: "Recibido",
  EnPreparacion: "En Cocina",
  Listo: "Listo",
  EnCamino: "En Camino",
  Entregado: "Entregado",
};

const FRONT_TO_API_STATUS: Partial<Record<OrderStatus, string>> = {
  Recibido: "Recibido",
  "En Cocina": "EnPreparacion",
  Listo: "Listo",
  "En Camino": "EnCamino",
  Entregado: "Entregado",
  Recogido: "EnCamino",
};

export function mapApiStatusToFrontend(status: string): OrderStatus {
  return API_TO_FRONT_STATUS[status] ?? (status as OrderStatus);
}

export function mapFrontendStatusToApi(status: OrderStatus): string {
  return FRONT_TO_API_STATUS[status] ?? status;
}

function formatOrderTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function mapApiOrderItem(item: ApiOrder["items"][number]): OrderItem {
  return {
    lineId: item.line_id,
    productId: item.product_id,
    quantity: item.quantity,
    customizations: item.customizations
      ? {
          removedIngredients: item.customizations.removed_ingredients,
          addedModifiers: item.customizations.added_modifiers,
          extraPrice: item.customizations.extra_price,
        }
      : undefined,
  };
}

export function mapApiOrder(raw: ApiOrder): Order {
  return {
    id: raw.id,
    orderId: raw.order_id,
    customerName: raw.customer_name,
    address: raw.address,
    phone: raw.phone,
    notes: raw.notes ?? undefined,
    zone: raw.zone ?? undefined,
    items: raw.items.map(mapApiOrderItem),
    total: raw.total,
    deliveryFee: raw.delivery_fee,
    status: mapApiStatusToFrontend(raw.status),
    deliveryPersonId: raw.courier_id ?? undefined,
    createdAt: formatOrderTime(raw.received_at),
    receivedAt: new Date(raw.received_at).getTime(),
    statusEnteredAt: new Date(raw.status_entered_at).getTime(),
  };
}

export function mapApiOrders(raw: ApiOrder[]): Order[] {
  return raw.map(mapApiOrder);
}

export function getOrderApiId(order: Order): string {
  return order.orderId ?? order.id;
}

export function mapApiProduct(raw: ApiProduct): MenuItem {
  const category = raw.category_name as Category;
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    category,
    categoryId: raw.category_id,
    description: raw.description,
    image: raw.image,
    available: raw.available,
    restaurantId: raw.restaurant_id,
    ingredients: raw.ingredients?.map(
      (i): Ingredient => ({
        id: i.id,
        name: i.name,
        available: i.available,
      }),
    ),
    modifierGroups: raw.modifier_groups?.map(
      (g): ModifierGroup => ({
        id: g.id,
        name: g.name,
        productId: raw.id,
        minSelections: g.min_selections,
        maxSelections: g.max_selections,
        options: g.options.map(
          (o): ModifierOption => ({
            id: o.id,
            name: o.name,
            priceExtra: o.price_extra,
            available: o.available,
            groupId: g.id,
          }),
        ),
      }),
    ),
  };
}

export function mapApiProducts(raw: ApiProduct[]): MenuItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapApiProduct);
}

export function mapApiPromotion(raw: ApiPromotion): Promotion {
  return {
    id: raw.id,
    name: raw.name,
    discountPercent: raw.discount_percent,
    productIds: raw.product_ids,
    startDate: raw.start_date,
    endDate: raw.end_date,
    active: raw.active,
    createdAt: Date.parse(raw.start_date) || Date.now(),
  };
}

export function mapApiPromotions(raw: ApiPromotion[]): Promotion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapApiPromotion);
}

export async function resolveImageUrl(image: string): Promise<string> {
  if (!image || image.startsWith("http")) return image;
  if (!image.startsWith("data:")) return image;

  const response = await fetch(image);
  const blob = await response.blob();
  const file = new File([blob], "upload.jpg", { type: blob.type || "image/jpeg" });
  const { uploadsApi } = await import("@/lib/api/endpoints/uploads");
  const result = await uploadsApi.uploadImage(file);
  return result.url;
}
