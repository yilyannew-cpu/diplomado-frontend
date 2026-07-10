import { createContext, useContext, useState, type ReactNode } from "react";
import { courierApplicationsMock, type CourierApplicationMock, type ApplicationStatus } from "@/mocks/courierApplicationsMock";

export type CourierTab = "radar" | "bolsa" | "mis-restaurantes" | "historial";

interface CourierApplicationsState {
  applications: CourierApplicationMock[];
  applyToRestaurant: (courierId: string, restaurantId: string) => void;
  reviewApplication: (id: string, status: ApplicationStatus) => void;
  activeTab: CourierTab;
  setActiveTab: (tab: CourierTab) => void;
}

const CourierApplicationsContext = createContext<CourierApplicationsState | null>(null);

export function CourierApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<CourierApplicationMock[]>(courierApplicationsMock);
  const [activeTab, setActiveTab] = useState<CourierTab>("radar");

  const applyToRestaurant = (courierId: string, restaurantId: string) => {
    const newApp: CourierApplicationMock = {
      id: `APP-${Date.now()}`,
      courierId,
      restaurantId,
      status: "PENDING",
      createdAt: Date.now(),
    };
    setApplications((apps) => [newApp, ...apps]);
  };

  const reviewApplication = (id: string, status: ApplicationStatus) => {
    setApplications((apps) =>
      apps.map((app) => (app.id === id ? { ...app, status } : app))
    );
  };

  return (
    <CourierApplicationsContext.Provider value={{ 
      applications, 
      applyToRestaurant, 
      reviewApplication,
      activeTab,
      setActiveTab
    }}>
      {children}
    </CourierApplicationsContext.Provider>
  );
}

export function useCourierApplications() {
  const ctx = useContext(CourierApplicationsContext);
  if (!ctx) throw new Error("useCourierApplications must be used inside CourierApplicationsProvider");
  return ctx;
}
