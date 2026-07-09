export const CATEGORIES = [
  "Entradas",
  "Platos principales",
  "Acompañamientos",
  "Bebidas",
  "Postres",
  "Adiciones",
] as const;

export const ADDITION_CATEGORY = "Adiciones" as const satisfies Category;

export type Category = (typeof CATEGORIES)[number];

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

export const menuMock: MenuItem[] = [
  {
    id: "prod-01",
    name: "Monster Bacon",
    price: 24900,
    category: "Platos principales",
    description: "Doble carne premium, tocino crujiente y queso cheddar fundido.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-ffcore",
    ingredients: [
      { id: "ing-pan", name: "Pan Brioche", available: true },
      { id: "ing-carne", name: "Carne de Res (150g)", available: true },
      { id: "ing-queso", name: "Queso Cheddar", available: true },
      { id: "ing-tocino", name: "Tocino", available: true },
      { id: "ing-salsa", name: "Salsa de la casa", available: true },
      { id: "ing-tomate", name: "Tomate", available: true },
      { id: "ing-cebolla", name: "Cebolla Grillé", available: true },
    ],
    modifierGroups: [
      {
        id: "modg-termino-01",
        name: "Término de la carne",
        productId: "prod-01",
        minSelections: 1,
        maxSelections: 1,
        options: [
          { id: "modo-term-0", name: "Medio", priceExtra: 0, available: true, groupId: "modg-termino-01" },
          { id: "modo-term-1", name: "Tres Cuartos", priceExtra: 0, available: true, groupId: "modg-termino-01" },
          { id: "modo-term-2", name: "Bien Asada", priceExtra: 0, available: true, groupId: "modg-termino-01" },
        ],
      },
      {
        id: "modg-extras-01",
        name: "Adiciones",
        productId: "prod-01",
        minSelections: 0,
        maxSelections: 3,
        options: [
          { id: "modo-extra-0", name: "Tocino Crujiente", priceExtra: 3500, available: true, groupId: "modg-extras-01" },
          { id: "modo-extra-1", name: "Queso Cheddar", priceExtra: 2500, available: true, groupId: "modg-extras-01" },
          { id: "modo-extra-2", name: "Papas a la francesa pequeñas", priceExtra: 4000, available: true, groupId: "modg-extras-01" },
        ],
      },
    ],
  },
  {
    id: "prod-02",
    name: "La Paisa Smash",
    price: 28500,
    category: "Platos principales",
    description: "Carne Angus, chicharrón, plátano maduro y queso costeño.",
    image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-ffcore",
    ingredients: [
      { id: "ing-pan-02", name: "Pan artesanal", available: true },
      { id: "ing-carne-02", name: "Carne Angus", available: true },
      { id: "ing-chicharron", name: "Chicharrón", available: true },
      { id: "ing-plantano", name: "Plátano maduro", available: true },
      { id: "ing-queso-02", name: "Queso costeño", available: true },
      { id: "ing-cebolla-02", name: "Cebolla grillé", available: true },
      { id: "ing-lechuga", name: "Lechuga", available: true },
    ],
    modifierGroups: [
      {
        id: "modg-adiciones-02",
        name: "Adiciones",
        productId: "prod-02",
        minSelections: 0,
        maxSelections: 3,
        options: [
          { id: "modo-ad-02-0", name: "Tocino crujiente", priceExtra: 4200, available: true, groupId: "modg-adiciones-02" },
          { id: "modo-ad-02-1", name: "Queso cheddar extra", priceExtra: 3500, available: true, groupId: "modg-adiciones-02" },
          { id: "modo-ad-02-2", name: "Huevo frito", priceExtra: 2800, available: true, groupId: "modg-adiciones-02" },
        ],
      },
    ],
  },
  {
    id: "prod-03",
    name: "Chicken Buffalo",
    price: 26900,
    category: "Platos principales",
    description: "Pollo crocante, salsa buffalo, blue cheese y apio.",
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
    available: false,
    restaurantId: "rest-paisapollo",
  },
  {
    id: "prod-04",
    name: "Veggie Supreme",
    price: 22500,
    category: "Platos principales",
    description: "Medallón de garbanzo, aguacate, rúgula y mayo de chipotle.",
    image: "https://images.unsplash.com/photo-1525059696034-4967a729002e?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-verdebrasa",
    ingredients: [
      { id: "ing-pan-04", name: "Pan integral", available: true },
      { id: "ing-garbanzo", name: "Medallón de garbanzo", available: true },
      { id: "ing-aguacate", name: "Aguacate", available: true },
      { id: "ing-rugula", name: "Rúgula", available: true },
      { id: "ing-tomate-04", name: "Tomate", available: true },
      { id: "ing-cebolla-04", name: "Cebolla morada", available: true },
      { id: "ing-mayo", name: "Mayo chipotle", available: true },
    ],
    modifierGroups: [
      {
        id: "modg-adiciones-04",
        name: "Adiciones",
        productId: "prod-04",
        minSelections: 0,
        maxSelections: 2,
        options: [
          { id: "modo-ad-04-0", name: "Queso vegano", priceExtra: 3200, available: true, groupId: "modg-adiciones-04" },
          { id: "modo-ad-04-1", name: "Aguacate extra", priceExtra: 3800, available: true, groupId: "modg-adiciones-04" },
        ],
      },
    ],
  },
  {
    id: "prod-05",
    name: "Papas Rústicas",
    price: 9500,
    category: "Acompañamientos",
    description: "Papas en gajos con piel, sal de mar y aioli de la casa.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-ffcore",
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
  {
    id: "prod-09",
    name: "Queso cheddar extra",
    price: 3500,
    category: "Adiciones",
    description: "Porción adicional de queso cheddar fundido.",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-ffcore",
  },
  {
    id: "prod-10",
    name: "Tocino crujiente",
    price: 4200,
    category: "Adiciones",
    description: "Dos tiras de tocino ahumado extra crocante.",
    image: "https://images.unsplash.com/photo-1528607929212-2636ec44253e?auto=format&fit=crop&w=800&q=80",
    available: true,
    restaurantId: "rest-ffcore",
  },
];