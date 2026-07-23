import type { ApiRestaurantListItem } from "@/lib/api/endpoints/cliente";
import type { Restaurant } from "@/types/restaurant";
import { resolveLogoUrl } from "@/lib/mediaUrl";

export function mapApiRestaurantListItem(raw: ApiRestaurantListItem): Restaurant {
  return {
    id: raw.id,
    name: raw.name,
    tagline: raw.tagline ?? "",
    city: raw.city,
    address: raw.address ?? null,
    rating: raw.rating,
    deliveryMinutes: raw.deliveryMinutes,
    accent: raw.accent || "#4f46e5",
    initials: raw.initials,
    logo: resolveLogoUrl(raw.logo),
    coverImage: resolveLogoUrl(raw.coverImage ?? (raw as { cover_image?: string | null }).cover_image),
  };
}

export function mapApiRestaurantList(items: ApiRestaurantListItem[]): Restaurant[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((r) => !r.status || r.status === "Activo")
    .map(mapApiRestaurantListItem);
}
