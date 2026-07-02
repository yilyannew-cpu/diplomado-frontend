export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  city: string;
  rating: number;
  deliveryMinutes: number;
  accent: string; // tailwind utility-ready hex for ring/badge
  initials: string;
}

export const restaurantsMock: Restaurant[] = [
  {
    id: "rest-ffcore",
    name: "FFCore",
    tagline: "Hamburguesas de autor",
    city: "Cúcuta · Caobos",
    rating: 4.8,
    deliveryMinutes: 25,
    accent: "#4f46e5",
    initials: "FC",
  },
  {
    id: "rest-paisapollo",
    name: "Paisa Pollo",
    tagline: "Pollo crocante & buffalo",
    city: "Cúcuta · Centro",
    rating: 4.6,
    deliveryMinutes: 30,
    accent: "#d97706",
    initials: "PP",
  },
  {
    id: "rest-verdebrasa",
    name: "Verde & Brasa",
    tagline: "Cocina vegetal a la brasa",
    city: "Cúcuta · Atalaya",
    rating: 4.7,
    deliveryMinutes: 35,
    accent: "#16a34a",
    initials: "VB",
  },
  {
    id: "rest-dulcecaribe",
    name: "Dulce Caribe",
    tagline: "Postres y bebidas tropicales",
    city: "Cúcuta · San Luis",
    rating: 4.9,
    deliveryMinutes: 20,
    accent: "#db2777",
    initials: "DC",
  },
];
