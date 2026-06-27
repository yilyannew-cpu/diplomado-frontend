export interface CourierReview {
  id: string;
  courierId: string;
  customerName: string;
  orderId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

/** Reseñas de clientes dirigidas al domiciliario tras la entrega. */
export const courierReviewsMock: CourierReview[] = [
  {
    id: "CRV-01",
    courierId: "USR-04",
    customerName: "Laura Martínez",
    orderId: "PED-104",
    rating: 5,
    comment: "Mariana fue súper amable y llegó antes de lo previsto. Todo perfecto.",
    createdAt: "Hace 1 h",
  },
  {
    id: "CRV-02",
    courierId: "USR-04",
    customerName: "Andrés Quintero",
    orderId: "PED-109",
    rating: 4,
    comment: "Buen servicio, solo tardó un poco en subir al apartamento.",
    createdAt: "Hace 3 h",
  },
  {
    id: "CRV-03",
    courierId: "USR-04",
    customerName: "Diana Restrepo",
    orderId: "PED-105",
    rating: 5,
    comment: "Excelente domiciliario, muy cuidadosa con el pedido.",
    createdAt: "Ayer",
  },
  {
    id: "CRV-04",
    courierId: "USR-04",
    customerName: "Felipe Gómez",
    rating: 5,
    comment: "Rápida y siempre con buena actitud. La recomiendo.",
    createdAt: "Hace 2 días",
  },
  {
    id: "CRV-05",
    courierId: "USR-06",
    customerName: "Camila Henao",
    rating: 5,
    comment: "Sebastián llegó en bici y el pedido llegó intacto. Muy puntual.",
    createdAt: "Hace 4 h",
  },
  {
    id: "CRV-06",
    courierId: "USR-06",
    customerName: "Natalia Ruiz",
    rating: 4,
    comment: "Buen domiciliario, empaque bien cuidado.",
    createdAt: "Ayer",
  },
  {
    id: "CRV-07",
    courierId: "USR-06",
    customerName: "Ricardo Mejía",
    rating: 5,
    comment: "Muy profesional y amable en la entrega.",
    createdAt: "Hace 3 días",
  },
];
