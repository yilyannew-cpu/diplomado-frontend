export interface RestaurantReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const restaurantReviewsMock: RestaurantReview[] = [
  {
    id: "REV-01",
    customerName: "Laura Martínez",
    rating: 5,
    comment: "Las hamburguesas llegaron calientes y el domicilio fue rapidísimo. ¡Volveré a pedir!",
    createdAt: "Hace 2 h",
  },
  {
    id: "REV-02",
    customerName: "Juan Pablo Montoya",
    rating: 4,
    comment: "Muy buen sabor en La Paisa Smash. Solo faltó un poco más de salsa en las papas.",
    createdAt: "Hace 5 h",
  },
  {
    id: "REV-03",
    customerName: "Diana Restrepo",
    rating: 5,
    comment: "Excelente atención en la sede El Poblado. El brownie es espectacular.",
    createdAt: "Ayer",
  },
  {
    id: "REV-04",
    customerName: "Andrés Quintero",
    rating: 3,
    comment: "La comida estuvo bien, pero el pedido tardó un poco más de lo esperado.",
    createdAt: "Ayer",
  },
  {
    id: "REV-05",
    customerName: "Valeria Ospina",
    rating: 5,
    comment: "Me encantó el Veggie Supreme. Porciones generosas y empaque impecable.",
    createdAt: "Hace 2 días",
  },
];
