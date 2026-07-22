import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  courierApplicationsApi,
  type ApiCourierApplication,
  type ApiApplicationStatus,
} from "@/lib/api/endpoints/courierApplications";
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

const LIST_TTL_MS = 30_000;

type ListCacheKey = string;

let listInflight: { key: ListCacheKey; promise: Promise<ApiCourierApplication[]> } | null =
  null;
let listCache: { key: ListCacheKey; data: ApiCourierApplication[]; fetchedAt: number } | null =
  null;

function listCacheKey(params: { courierId?: string; restaurantId?: string }): ListCacheKey {
  return params.courierId
    ? `courier:${params.courierId}`
    : params.restaurantId
      ? `restaurant:${params.restaurantId}`
      : "none";
}

async function fetchApplicationsCached(
  params: { courierId?: string; restaurantId?: string },
  options?: { force?: boolean },
): Promise<ApiCourierApplication[]> {
  const key = listCacheKey(params);
  const force = options?.force === true;

  if (!force && listCache && listCache.key === key && Date.now() - listCache.fetchedAt < LIST_TTL_MS) {
    return listCache.data;
  }
  if (listInflight && listInflight.key === key) {
    return listInflight.promise;
  }

  const promise = courierApplicationsApi
    .list(params)
    .then((data) => {
      const normalized = Array.isArray(data) ? data : [];
      listCache = { key, data: normalized, fetchedAt: Date.now() };
      return normalized;
    })
    .finally(() => {
      if (listInflight?.promise === promise) listInflight = null;
    });

  listInflight = { key, promise };
  return promise;
}

export function CourierApplicationsProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<ApiCourierApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CourierTab>("radar");
  const { user, isAuthenticated } = useAuth();

  // Solo identidad/rol: NO depender de todo `user` (is_available cambia en cada toggle).
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;
  const restaurantId = user?.restaurant_id ?? null;

  const loadSeq = useRef(0);

  const refreshApplications = useCallback(
    async (options?: { force?: boolean }) => {
      if (!isAuthenticated || !userId || !userRole) {
        setApplications([]);
        return;
      }

      const params =
        userRole === "domiciliario"
          ? { courierId: userId }
          : userRole === "admin" && restaurantId
            ? { restaurantId }
            : undefined;

      if (!params) {
        setApplications([]);
        return;
      }

      const seq = ++loadSeq.current;
      setIsLoading(true);
      try {
        const data = await fetchApplicationsCached(params, options);
        if (seq !== loadSeq.current) return;
        setApplications(data);
      } catch (err) {
        console.error("[CourierApplications] Error loading applications:", err);
        if (seq !== loadSeq.current) return;
        setApplications([]);
      } finally {
        if (seq === loadSeq.current) setIsLoading(false);
      }
    },
    [isAuthenticated, userId, userRole, restaurantId],
  );

  // Cargar solo al login / cambio de identidad (no al toggle de disponibilidad).
  useEffect(() => {
    void refreshApplications();
  }, [refreshApplications]);

  const applyToRestaurant = useCallback(
    async (_courierId: string, restaurantIdToApply: string) => {
      try {
        const newApp = await courierApplicationsApi.apply(restaurantIdToApply);
        listCache = null;
        setApplications((apps) => [newApp, ...apps]);
      } catch (err) {
        console.error("[CourierApplications] Error applying:", err);
        throw err;
      }
    },
    [],
  );

  const reviewApplication = useCallback(async (id: string, status: ApplicationStatus) => {
    try {
      const updated = await courierApplicationsApi.review(id, status);
      listCache = null;
      setApplications((apps) => apps.map((app) => (app.id === id ? updated : app)));
    } catch (err) {
      console.error("[CourierApplications] Error reviewing:", err);
      throw err;
    }
  }, []);

  const refreshApplicationsPublic = useCallback(
    () => refreshApplications({ force: true }),
    [refreshApplications],
  );

  return (
    <CourierApplicationsContext.Provider
      value={{
        applications,
        isLoading,
        applyToRestaurant,
        reviewApplication,
        refreshApplications: refreshApplicationsPublic,
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
  if (!ctx) {
    throw new Error("useCourierApplications must be used inside CourierApplicationsProvider");
  }
  return ctx;
}
