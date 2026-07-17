export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface CourierApplicationMock {
  id: string;
  courierId: string;
  restaurantId: string;
  status: ApplicationStatus;
  createdAt: number;
}

export const courierApplicationsMock: CourierApplicationMock[] = [
  {
    id: "APP-01",
    courierId: "USR-04", // Mariana Gil
    restaurantId: "rest-ffcore", // BurgerCore
    status: "ACCEPTED",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "APP-02",
    courierId: "USR-06", // Seba Courier
    restaurantId: "rest-ffcore",
    status: "PENDING",
    createdAt: Date.now() - 3600000,
  }
];
