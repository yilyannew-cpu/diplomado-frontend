import type { ApiRestaurantListItem } from "@/lib/api/endpoints/cliente";
import type { Restaurant } from "@/mocks/restaurantsMock";

export function mapApiRestaurantListItem(raw: ApiRestaurantListItem): Restaurant {
  return {
    id: raw.id,
    name: raw.name,
    tagline: raw.tagline ?? "",
    city: raw.city,
    rating: raw.rating,
    deliveryMinutes: raw.deliveryMinutes,
    accent: raw.accent || "#4f46e5",
    initials: raw.initials,
  };
}

export function mapApiRestaurantList(items: ApiRestaurantListItem[]): Restaurant[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((r) => !r.status || r.status === "Activo")
    .map(mapApiRestaurantListItem);
}
