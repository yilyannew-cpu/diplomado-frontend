export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  city: string;
  /** Dirección física del local (si el API la envía). */
  address?: string | null;
  rating: number;
  deliveryMinutes: number;
  accent: string;
  initials: string;
  logo?: string | null;
  /** Imagen de portada (vista ficha del restaurante). */
  coverImage?: string | null;
}
