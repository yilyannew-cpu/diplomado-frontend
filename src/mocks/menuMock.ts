export type Category = "Hamburguesas" | "Acompañamientos" | "Bebidas" | "Postres";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  image: string;
  available: boolean;
  restaurantId: string;
}

export const menuMock: MenuItem[] = [
  {
    id: "prod-01",
    name: "Monster Bacon",
    price: 24900,
    category: "Hamburguesas",
    description: "Doble carne premium, tocino crujiente y queso cheddar fundido.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-burgercore",
  },
  {
    id: "prod-02",
    name: "La Paisa Smash",
    price: 28500,
    category: "Hamburguesas",
    description: "Carne Angus, chicharrón, plátano maduro y queso costeño.",
    image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-burgercore",
  },
  {
    id: "prod-03",
    name: "Chicken Buffalo",
    price: 26900,
    category: "Hamburguesas",
    description: "Pollo crocante, salsa buffalo, blue cheese y apio.",
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
    available: false,
    restaurantId: "rest-paisapollo",
  },
  {
    id: "prod-04",
    name: "Veggie Supreme",
    price: 22500,
    category: "Hamburguesas",
    description: "Medallón de garbanzo, aguacate, rúgula y mayo de chipotle.",
    image: "https://images.unsplash.com/photo-1525059696034-4967a729002e?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-verdebrasa",
  },
  {
    id: "prod-05",
    name: "Papas Rústicas",
    price: 9500,
    category: "Acompañamientos",
    description: "Papas en gajos con piel, sal de mar y aioli de la casa.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-burgercore",
  },
  {
    id: "prod-06",
    name: "Aros de Cebolla",
    price: 8900,
    category: "Acompañamientos",
    description: "Cebolla dulce empanizada en panko crocante.",
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-paisapollo",
  },
  {
    id: "prod-07",
    name: "Limonada de Coco",
    price: 7500,
    category: "Bebidas",
    description: "Receta caribeña con leche de coco fresca.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-dulcecaribe",
  },
  {
    id: "prod-08",
    name: "Brownie de Chocolate",
    price: 11500,
    category: "Postres",
    description: "Brownie tibio con helado de vainilla bourbon.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-dulcecaribe",
  },
];