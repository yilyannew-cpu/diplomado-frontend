import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { courierApplicationsApi, type ApiCourierApplication, type ApiApplicationStatus } from "@/lib/api/endpoints/courierApplications";
import { useAuth } from "@/context/AuthContext";

export type CourierTab = "radar" | "bolsa" | "mis-restaurantes" | "historial";

export type ApplicationStatus = ApiApplicationStatus;

interface CourierApplicationsState {
  applications: ApiCourierApplication[];
  isLoading: boolean;
  applyToRestaurant: (courierId: string, restaurantId: string) => Promise<void>;
  reviewApplication: (id: string, status: ApplicationStatus) => Promise<void>;
  refreshApplications: () => Promise<void>;
  activeTab: CourierTab;
  setActiveTab: (tab: CourierTab) => void;
}

const CourierApplicationsContext = createContext<CourierApplicationsState | null>(null);

export function CourierApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<ApiCourierApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CourierTab>("radar");
  const { user, isAuthenticated } = useAuth();

  const refreshApplications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      // Dependiendo del rol, filtramos por courier o por restaurante
      const params =
        user.role === "domiciliario"
          ? { courierId: user.id }
          : user.role === "admin" && user.restaurant_id
            ? { restaurantId: user.restaurant_id }
            : undefined;

      if (!params) {
        setApplications([]);
        return;
      }

      const data = await courierApplicationsApi.list(params);
      setApplications(data);
    } catch (err) {
      console.error("[CourierApplications] Error loading applications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Cargar aplicaciones cada vez que el usuario cambie (login/logout)
  useEffect(() => {
    void refreshApplications();
  }, [refreshApplications]);

  const applyToRestaurant = useCallback(
    async (_courierId: string, restaurantId: string) => {
      try {
        const newApp = await courierApplicationsApi.apply(restaurantId);
        setApplications((apps) => [newApp, ...apps]);
      } catch (err) {
        console.error("[CourierApplications] Error applying:", err);
        throw err;
      }
    },
    [],
  );

  const reviewApplication = useCallback(
    async (id: string, status: ApplicationStatus) => {
      try {
        const updated = await courierApplicationsApi.review(id, status);
        setApplications((apps) =>
          apps.map((app) => (app.id === id ? updated : app)),
        );
      } catch (err) {
        console.error("[CourierApplications] Error reviewing:", err);
        throw err;
      }
    },
    [],
  );

  return (
    <CourierApplicationsContext.Provider
      value={{
        applications,
        isLoading,
        applyToRestaurant,
        reviewApplication,
        refreshApplications,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </CourierApplicationsContext.Provider>
  );
}

export function useCourierApplications() {
  const ctx = useContext(CourierApplicationsContext);
  if (!ctx) throw new Error("useCourierApplications must be used inside CourierApplicationsProvider");
  return ctx;
}
