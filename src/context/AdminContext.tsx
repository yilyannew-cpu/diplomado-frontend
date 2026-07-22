import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getOrderApiId,
  mapApiOrder,
  mapApiOrders,
  mapApiProduct,
  mapApiProducts,
  mapApiPromotion,
  mapApiPromotions,
  mapFrontendStatusToApi,
  resolveImageUrl,
  uploadProductDataImage,
} from "@/lib/api/admin/mappers";
import { PLACEHOLDER_IMAGE, resolveLogoUrl } from "@/lib/mediaUrl";
import { dedupeAsync, invalidateDedupeCache } from "@/lib/api/admin/dedupeAsync";
import { reportRangeLabel, reportRangeToDates, reportRangeToQuery } from "@/lib/api/admin/reportDates";
import { mapHistoryPeriodToApi } from "@/lib/api/admin/historyPeriod";
import { adminOrdersApi } from "@/lib/api/endpoints/adminOrders";
import { productsApi } from "@/lib/api/endpoints/products";
import { promotionsApi } from "@/lib/api/endpoints/promotions";
import { restaurantsApi, type ApiReview } from "@/lib/api/endpoints/restaurants";
import { getSocketUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { RESTAURANT_PROFILE_UPDATED_EVENT } from "@/components/shared/ProfileAccountDialog";
import type {
  ApiActiveDeliveryGroup,
  ApiAvailableCourier,
  ApiCategory,
  ApiDashboard,
  ApiDispatchRecord,
  ApiDispatchSummary,
  ApiMonthlySales,
  ApiRestaurantProfile,
  ApiSalesReport,
} from "@/lib/api/types/admin";
import type { AdminTab } from "@/components/admin/AdminNav";
import type { NewProductData } from "@/components/admin/AddProductModal";
import type { EditProductData } from "@/components/admin/EditProductModal";
import type { Ingredient, MenuItem, ModifierGroup } from "@/mocks/menuMock";
import { ADDITION_CATEGORY, CATEGORIES } from "@/mocks/menuMock";
import type { Order, OrderStatus } from "@/mocks/ordersMock";
import type { Promotion } from "@/mocks/promotionsMock";
import type { CourierPayoutRow, MonthlySalesReport, ReportDateRange } from "@/lib/salesReports";
import type { HistoryPeriod } from "@/lib/orderHistory";
import type { NewAdditionData } from "@/components/admin/AddAdditionModal";

const KITCHEN_STATUSES: OrderStatus[] = ["Recibido", "En Cocina", "Listo"];
/** Pedidos en seguimiento de despacho (ruta + entregados del día). */
const DISPATCH_TRACKING_STATUSES: OrderStatus[] = ["En Camino", "Recogido", "Entregado"];

/** Módulos que se precargan al abrir el panel (reportes se pide al elegir rango). */
const PRELOAD_TABS: AdminTab[] = [
  "dashboard",
  "comandas",
  "menu",
  "promociones",
  "despachados",
  "domicilios",
  "historial",
];

function isKitchenOrder(order: Order): boolean {
  return KITCHEN_STATUSES.includes(order.status);
}

function isDispatchTrackingOrder(order: Order): boolean {
  return DISPATCH_TRACKING_STATUSES.includes(order.status);
}

function upsertOrderList(current: Order[], incoming: Order): Order[] {
  const key = incoming.orderId ?? incoming.id;
  const idx = current.findIndex((o) => (o.orderId ?? o.id) === key);
  if (idx >= 0) {
    const next = [...current];
    next[idx] = incoming;
    return next;
  }
  return [incoming, ...current];
}

function removeOrderFromList(current: Order[], incoming: Order): Order[] {
  return current.filter((o) => o.orderId !== incoming.orderId && o.id !== incoming.id);
}

function mergeKitchenOrder(current: Order[], incoming: Order): Order[] {
  if (!isKitchenOrder(incoming)) {
    return removeOrderFromList(current, incoming);
  }
  return upsertOrderList(current, incoming);
}

function mergeKitchenOrders(current: Order[], incoming: Order[]): Order[] {
  return incoming.reduce((acc, order) => mergeKitchenOrder(acc, order), current);
}

function mergeEnRouteOrder(current: Order[], incoming: Order): Order[] {
  if (!isDispatchTrackingOrder(incoming)) {
    return removeOrderFromList(current, incoming);
  }
  if (
    incoming.status === "Entregado" &&
    !isSameLocalDay(incoming.statusEnteredAt || incoming.receivedAt || Date.now())
  ) {
    return removeOrderFromList(current, incoming);
  }
  return upsertOrderList(current, incoming);
}

function mergeEnRouteOrders(current: Order[], incoming: Order[]): Order[] {
  return incoming.reduce((acc, order) => mergeEnRouteOrder(acc, order), current);
}

function isSameLocalDay(timestampMs: number, now = Date.now()): boolean {
  const a = new Date(timestampMs);
  const b = new Date(now);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** En ruta siempre; entregados solo del día (control operativo). */
function filterDispatchTrackingOrders(orders: Order[]): Order[] {
  return orders.filter((order) => {
    if (order.status === "En Camino" || order.status === "Recogido") return true;
    if (order.status === "Entregado") {
      return isSameLocalDay(order.statusEnteredAt || order.receivedAt || Date.now());
    }
    return false;
  });
}

function buildMonthlyReports(monthly: ApiMonthlySales, year: number): MonthlySalesReport[] {
  return monthly.data.map((point) => {
    const grossSales = point.gross_sales;
    const appCommissions = Math.round(grossSales * 0.05);
    const courierPayout = 0;
    // gross_sales de la API ya es solo productos (sin domicilio)
    const netProfit = grossSales - appCommissions;
    return {
      monthKey: `${year}-${String(point.month).padStart(2, "0")}`,
      label: `${point.label} ${year}`,
      grossSales,
      courierPayout,
      deliveredOrders: point.orders,
      netProfit,
      appCommissions,
      realNetProfit: netProfit,
      marginPercent: grossSales > 0 ? Math.round((netProfit / grossSales) * 1000) / 10 : 0,
    };
  });
}

interface AdminContextValue {
  restaurantId: string | null;
  restaurant: ApiRestaurantProfile | null;
  kitchenOrders: Order[];
  /** Pedidos En Camino con ficha completa (ítems, cliente, etc.). */
  enRouteOrders: Order[];
  menu: MenuItem[];
  categories: ApiCategory[];
  promotions: Promotion[];
  dashboard: ApiDashboard | null;
  reviews: ApiReview[];
  activeDeliveries: ApiActiveDeliveryGroup[];
  dispatchRecords: ApiDispatchRecord[];
  dispatchSummary: ApiDispatchSummary | null;
  loading: boolean;
  error: string | null;
  refreshKitchenOrders: () => Promise<void>;
  refreshEnRouteOrders: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  refreshPromotions: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshActiveDeliveries: () => Promise<void>;
  refreshDispatchHistory: (period?: HistoryPeriod) => Promise<void>;
  fetchAvailableCouriers: (batchSize: number, zone?: string) => Promise<ApiAvailableCourier[]>;
  updateOrderStatus: (order: Order, next: OrderStatus) => Promise<void>;
  assignCourierBatch: (orders: Order[], courierId: string) => Promise<void>;
  dispatchBatch: (orders: Order[]) => Promise<void>;
  toggleAvailability: (productId: string) => Promise<void>;
  addMenuItem: (data: NewProductData) => Promise<void>;
  addAddition: (data: NewAdditionData) => Promise<void>;
  updateMenuItem: (productId: string, data: EditProductData) => Promise<void>;
  updateProductCustomization: (
    productId: string,
    ingredients: Ingredient[],
    modifierGroups: ModifierGroup[],
  ) => Promise<void>;
  addPromotion: (payload: Omit<Promotion, "id" | "createdAt">) => Promise<void>;
  updatePromotion: (promotionId: string, payload: Partial<Promotion>) => Promise<void>;
  deletePromotion: (promotionId: string) => Promise<void>;
  fetchSalesReport: (range: ReportDateRange) => Promise<{
    period: ApiSalesReport;
    monthly: ApiMonthlySales;
    months: MonthlySalesReport[];
    courierPayouts: CourierPayoutRow[];
    rangeLabel: string;
    ytdRealNetProfit: number;
    ytdCourierPayout: number;
    ytdNetProfit: number;
  }>;
  exportSalesCsv: (range: ReportDateRange) => Promise<void>;
  getCategoryIdByName: (name: string) => string | undefined;
  /** Guarda metas de ventas opcionales y refresca el dashboard. */
  updateSalesGoals: (goals: {
    dailyGoal: number | null;
    monthlyGoal: number | null;
  }) => Promise<void>;
  /** Recarga un módulo (no-op si ya está cargado, salvo force). */
  ensureTabData: (tab: AdminTab, force?: boolean) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurant_id ?? null;

  const [restaurant, setRestaurant] = useState<ApiRestaurantProfile | null>(null);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [enRouteOrders, setEnRouteOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const categoriesRef = useRef<ApiCategory[]>([]);
  categoriesRef.current = categories;
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dashboard, setDashboard] = useState<ApiDashboard | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ApiActiveDeliveryGroup[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<ApiDispatchRecord[]>([]);
  const [dispatchSummary, setDispatchSummary] = useState<ApiDispatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const loadedTabsRef = useRef<Set<AdminTab>>(new Set());
  const tabInflightRef = useRef<Partial<Record<AdminTab, Promise<void>>>>({});

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof ApiError ? err.message : fallback;
    setError(message);
    toast.error(message);
  }, []);

  const refreshDashboard = useCallback(async (force = false) => {
    if (!restaurantId) return;
    const result = await dedupeAsync(
      `admin:dashboard:${restaurantId}`,
      async () => {
        const [profile, dash, reviewsPage] = await Promise.all([
          dedupeAsync(
            `admin:profile:${restaurantId}`,
            () => restaurantsApi.getProfile(restaurantId),
            { ttlMs: 60_000, force },
          ),
          restaurantsApi.getDashboard(restaurantId),
          restaurantsApi.listReviews(restaurantId, { limit: 10, offset: 0 }),
        ]);
        return { profile, dash, reviews: reviewsPage.data };
      },
      { ttlMs: 20_000, force },
    );
    setRestaurant(result.profile);
    setDashboard(result.dash);
    setReviews(result.reviews);
  }, [restaurantId]);

  const refreshKitchenOrders = useCallback(async (force = false) => {
    if (!restaurantId) return;
    const raw = await dedupeAsync(
      `admin:kitchen:${restaurantId}`,
      () => adminOrdersApi.listKitchenOrders(restaurantId),
      { ttlMs: 8_000, force },
    );
    setKitchenOrders(mapApiOrders(raw));
  }, [restaurantId]);

  const refreshEnRouteOrders = useCallback(async (force = false) => {
    if (!restaurantId) return;
    const raw = await dedupeAsync(
      `admin:enroute:${restaurantId}`,
      () => adminOrdersApi.listEnRouteOrders(restaurantId),
      { ttlMs: 8_000, force },
    );
    setEnRouteOrders(filterDispatchTrackingOrders(mapApiOrders(raw)));
  }, [restaurantId]);

  const refreshMenu = useCallback(async (force = false) => {
    if (!restaurantId) return;
    await dedupeAsync(
      `admin:menu:${restaurantId}`,
      async () => {
        let cats = await restaurantsApi.listCategories(restaurantId);
        if (cats.length === 0) {
          cats = await Promise.all(
            [...CATEGORIES].map((name, position) =>
              restaurantsApi.createCategory(restaurantId, { name, position }),
            ),
          );
        }
        const products = await productsApi.list({ restaurantId }, { auth: true });
        setCategories(cats);
        setMenu(mapApiProducts(products));
      },
      { ttlMs: 45_000, force },
    );
  }, [restaurantId]);

  const refreshPromotions = useCallback(async (force = false) => {
    if (!restaurantId) return;
    const raw = await dedupeAsync(
      `admin:promos:${restaurantId}`,
      () => restaurantsApi.listPromotions(restaurantId),
      { ttlMs: 30_000, force },
    );
    setPromotions(mapApiPromotions(raw));
  }, [restaurantId]);

  const refreshActiveDeliveries = useCallback(async (force = false) => {
    if (!restaurantId) return;
    const res = await dedupeAsync(
      `admin:deliveries:${restaurantId}`,
      () => restaurantsApi.getActiveDeliveries(restaurantId),
      { ttlMs: 12_000, force },
    );
    setActiveDeliveries(res.data);
  }, [restaurantId]);

  const refreshDispatchHistory = useCallback(
    async (period: HistoryPeriod = "month", force = false) => {
      if (!restaurantId) return;
      const apiPeriod = mapHistoryPeriodToApi(period);
      const result = await dedupeAsync(
        `admin:history:${restaurantId}:${apiPeriod}`,
        async () => {
          const [records, summary] = await Promise.all([
            restaurantsApi.listDispatches(restaurantId, { period: apiPeriod }),
            restaurantsApi.getDispatchSummary(restaurantId, apiPeriod),
          ]);
          return { records: records.data, summary };
        },
        { ttlMs: 20_000, force },
      );
      setDispatchRecords(result.records);
      setDispatchSummary(result.summary);
    },
    [restaurantId],
  );

  const ensureTabData = useCallback(
    async (tab: AdminTab, force = false) => {
      if (!restaurantId) return;

      const existing = tabInflightRef.current[tab];
      if (existing) return existing;
      if (!force && loadedTabsRef.current.has(tab)) return;

      if (force) {
        loadedTabsRef.current.delete(tab);
      }

      const run = (async () => {
        switch (tab) {
          case "dashboard":
            await refreshDashboard(force);
            break;
          case "comandas":
            await refreshKitchenOrders(force);
            break;
          case "menu":
            await refreshMenu(force);
            break;
          case "promociones":
            await Promise.all([refreshPromotions(force), refreshMenu(force)]);
            break;
          case "despachados":
            await Promise.all([refreshKitchenOrders(force), refreshEnRouteOrders(force)]);
            break;
          case "domicilios":
            await refreshActiveDeliveries(force);
            break;
          case "historial":
            await refreshDispatchHistory("month", force);
            break;
          case "configuracion":
          case "reportes":
            break;
          default:
            break;
        }
        loadedTabsRef.current.add(tab);
      })()
        .catch((err) => {
          handleApiError(err, `Error al cargar ${tab}`);
        })
        .finally(() => {
          delete tabInflightRef.current[tab];
        });

      tabInflightRef.current[tab] = run;
      return run;
    },
    [
      restaurantId,
      refreshDashboard,
      refreshKitchenOrders,
      refreshEnRouteOrders,
      refreshMenu,
      refreshPromotions,
      refreshActiveDeliveries,
      refreshDispatchHistory,
      handleApiError,
    ],
  );

  const loadAllPanelData = useCallback(async () => {
    if (!restaurantId) return;

    // Marca tabs como en carga para que ensureTabData no dispare un segundo round.
    for (const tab of PRELOAD_TABS) {
      loadedTabsRef.current.add(tab);
    }

    await Promise.all([
      refreshDashboard(),
      refreshKitchenOrders(),
      refreshEnRouteOrders(),
      refreshMenu(),
      refreshPromotions(),
      refreshActiveDeliveries(),
      refreshDispatchHistory("month"),
    ]);
  }, [
    restaurantId,
    refreshDashboard,
    refreshKitchenOrders,
    refreshEnRouteOrders,
    refreshMenu,
    refreshPromotions,
    refreshActiveDeliveries,
    refreshDispatchHistory,
  ]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    loadedTabsRef.current.clear();
    invalidateDedupeCache(`admin:`);
    setLoading(true);
    setError(null);

    // Precarga todos los módulos; dedupeAsync+TTL evita duplicados (Strict Mode / tabs).
    void loadAllPanelData()
      .catch((err) => {
        if (!cancelled) {
          // Si falló la precarga, permitir reintento por pestaña.
          loadedTabsRef.current.clear();
          handleApiError(err, "Error al cargar el panel");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, loadAllPanelData, handleApiError]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ApiRestaurantProfile>).detail;
      if (!detail?.id || detail.id !== restaurantId) return;
      setRestaurant(detail);
    };
    window.addEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(getSocketUrl(), { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("join_restaurant", restaurantId);

    const onNewOrder = (payload: unknown) => {
      const order = mapApiOrder(payload as Parameters<typeof mapApiOrder>[0]);
      setKitchenOrders((current) => mergeKitchenOrder(current, order));
      setEnRouteOrders((current) => mergeEnRouteOrder(current, order));
    };

    let socketRefreshTimer = 0;
    const onStatusChanged = (payload: unknown) => {
      if (Array.isArray(payload)) {
        const mapped = mapApiOrders(payload as Parameters<typeof mapApiOrders>[0]);
        setKitchenOrders((current) => mergeKitchenOrders(current, mapped));
        setEnRouteOrders((current) => mergeEnRouteOrders(current, mapped));
      } else {
        const order = mapApiOrder(payload as Parameters<typeof mapApiOrder>[0]);
        setKitchenOrders((current) => mergeKitchenOrder(current, order));
        setEnRouteOrders((current) => mergeEnRouteOrder(current, order));
      }
      // Debounce: muchos eventos de cocina no deben martillar /active + historial.
      window.clearTimeout(socketRefreshTimer);
      socketRefreshTimer = window.setTimeout(() => {
        void refreshActiveDeliveries(true);
        void refreshDispatchHistory("month", true);
        void refreshEnRouteOrders(true);
      }, 900);
    };

    socket.on("new_order", onNewOrder);
    socket.on("order_status_changed", onStatusChanged);

    return () => {
      window.clearTimeout(socketRefreshTimer);
      socket.off("new_order", onNewOrder);
      socket.off("order_status_changed", onStatusChanged);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, refreshActiveDeliveries, refreshDispatchHistory, refreshEnRouteOrders]);

  const fetchAvailableCouriers = useCallback(
    async (batchSize: number, zone?: string) => {
      if (!restaurantId) return [];
      const res = await restaurantsApi.listAvailableCouriers(restaurantId, batchSize, zone);
      return res.data;
    },
    [restaurantId],
  );

  const updateOrderStatus = useCallback(
    async (order: Order, next: OrderStatus) => {
      try {
        const updated = await adminOrdersApi.updateStatus(
          getOrderApiId(order),
          mapFrontendStatusToApi(next),
        );
        setKitchenOrders((current) => mergeKitchenOrder(current, mapApiOrder(updated)));
      } catch (err) {
        handleApiError(err, "No se pudo actualizar el estado");
        throw err;
      }
    },
    [handleApiError],
  );

  const assignCourierBatch = useCallback(
    async (orders: Order[], courierId: string) => {
      if (!restaurantId) return;
      try {
        const updated = await adminOrdersApi.batchAssign(
          orders.map(getOrderApiId),
          courierId,
        );
        setKitchenOrders((current) => mergeKitchenOrders(current, mapApiOrders(updated)));
        toast.success("Domiciliario asignado. El pedido pasó a Pedidos despachados.");
      } catch (err) {
        handleApiError(err, "No se pudo asignar el domiciliario");
        throw err;
      }
    },
    [restaurantId, handleApiError],
  );

  const dispatchBatch = useCallback(
    async (orders: Order[]) => {
      if (!restaurantId) return;
      try {
        await adminOrdersApi.batchDispatch(
          orders.map(getOrderApiId),
          restaurantId,
        );
        // Siguen en Listo+repartidor hasta que el domi marque En camino;
        // permanecen visibles en Pedidos despachados para control de estado.
        await Promise.all([
          refreshActiveDeliveries(true),
          refreshEnRouteOrders(true),
          refreshDispatchHistory("month", true),
        ]);
        toast.success(
          "Entregado al repartidor. El pedido sigue en Despachados hasta que se entregue.",
        );
      } catch (err) {
        handleApiError(err, "No se pudo despachar el lote");
        throw err;
      }
    },
    [restaurantId, refreshActiveDeliveries, refreshEnRouteOrders, refreshDispatchHistory, handleApiError],
  );

  const ensureCategoryIdByName = useCallback(
    async (name: string): Promise<string> => {
      const existing = categoriesRef.current.find((c) => c.name === name);
      if (existing) return existing.id;
      if (!restaurantId) throw new Error("Restaurante no configurado");
      const created = await restaurantsApi.createCategory(restaurantId, { name });
      setCategories((prev) => [...prev, created]);
      return created.id;
    },
    [restaurantId],
  );

  const getCategoryIdByName = useCallback(
    (name: string) => categories.find((c) => c.name === name)?.id,
    [categories],
  );

  const toggleAvailability = useCallback(
    async (productId: string) => {
      try {
        const updated = await productsApi.toggleAvailability(productId);
        setMenu((current) =>
          current.map((item) => (item.id === productId ? mapApiProduct(updated) : item)),
        );
      } catch (err) {
        handleApiError(err, "No se pudo cambiar la disponibilidad");
        throw err;
      }
    },
    [handleApiError],
  );

  const addMenuItem = useCallback(
    async (data: NewProductData) => {
      if (!restaurantId) {
        const message = "No se encontró el restaurante del administrador.";
        toast.error(message);
        throw new Error(message);
      }
      try {
        const categoryId = await ensureCategoryIdByName(data.category);
        const hasNewImage = data.image.startsWith("data:");
        // Crear primero con URL https válida; la foto nueva se sube por multipart.
        const imageForCreate = hasNewImage
          ? PLACEHOLDER_IMAGE
          : await resolveImageUrl(data.image || PLACEHOLDER_IMAGE);

        let created = await productsApi.create({
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: categoryId,
          restaurant_id: restaurantId,
          image: imageForCreate,
          available: data.available,
        });

        if (hasNewImage) {
          const withImage = await uploadProductDataImage(created.id, data.image);
          if (withImage) created = withImage;
        }

        setMenu((current) => [...current, mapApiProduct(created)]);
        toast.success("Producto creado");
      } catch (err) {
        handleApiError(err, "No se pudo crear el producto");
        throw err;
      }
    },
    [restaurantId, ensureCategoryIdByName, handleApiError],
  );

  const addAddition = useCallback(
    async (data: { name: string; description: string; price: number; image: string; available: boolean }) => {
      await addMenuItem({ ...data, category: ADDITION_CATEGORY });
    },
    [addMenuItem],
  );

  const updateMenuItem = useCallback(
    async (productId: string, data: EditProductData) => {
      try {
        const hasNewImage = data.image.startsWith("data:");

        // Campos de texto/precio sin meter data URL en el JSON (causa 500 en Render).
        let updated = await productsApi.update(productId, {
          description: data.description,
          price: data.price,
          available: data.available,
          ...(hasNewImage ? {} : { image: await resolveImageUrl(data.image) }),
        });

        if (hasNewImage) {
          const withImage = await uploadProductDataImage(productId, data.image);
          if (withImage) updated = withImage;
        }

        setMenu((current) =>
          current.map((item) => (item.id === productId ? mapApiProduct(updated) : item)),
        );
        toast.success("Producto actualizado");
      } catch (err) {
        handleApiError(err, "No se pudo actualizar el producto");
        throw err;
      }
    },
    [handleApiError],
  );

  const updateProductCustomization = useCallback(
    async (productId: string, ingredients: Ingredient[], modifierGroups: ModifierGroup[]) => {
      try {
        await productsApi.setIngredients(
          productId,
          ingredients.map((i) => ({ name: i.name, available: i.available })),
        );
        const updated = await productsApi.setModifierGroups(
          productId,
          modifierGroups.map((g) => ({
            name: g.name,
            min_selections: g.minSelections,
            max_selections: g.maxSelections,
            options: g.options.map((o) => ({
              name: o.name,
              price_extra: o.priceExtra,
              available: o.available,
            })),
          })),
        );
        setMenu((current) =>
          current.map((item) => (item.id === productId ? mapApiProduct(updated) : item)),
        );
        toast.success("Receta actualizada");
      } catch (err) {
        handleApiError(err, "No se pudo guardar la receta");
        throw err;
      }
    },
    [handleApiError],
  );

  const addPromotion = useCallback(
    async (payload: Omit<Promotion, "id" | "createdAt">) => {
      if (!restaurantId) return;
      try {
        const created = await restaurantsApi.createPromotion(restaurantId, {
          name: payload.name,
          discount_percent: payload.discountPercent,
          product_ids: payload.productIds,
          start_date: payload.startDate,
          end_date: payload.endDate,
          active: payload.active,
        });
        setPromotions((current) => [...current, mapApiPromotion(created)]);
        toast.success("Promoción creada");
      } catch (err) {
        handleApiError(err, "No se pudo crear la promoción");
        throw err;
      }
    },
    [restaurantId, handleApiError],
  );

  const updatePromotion = useCallback(
    async (promotionId: string, payload: Partial<Promotion>) => {
      try {
        const updated = await promotionsApi.update(promotionId, {
          name: payload.name,
          discount_percent: payload.discountPercent,
          product_ids: payload.productIds,
          start_date: payload.startDate,
          end_date: payload.endDate,
          active: payload.active,
        });
        setPromotions((current) =>
          current.map((p) => (p.id === promotionId ? mapApiPromotion(updated) : p)),
        );
        toast.success("Promoción actualizada");
      } catch (err) {
        handleApiError(err, "No se pudo actualizar la promoción");
        throw err;
      }
    },
    [handleApiError],
  );

  const deletePromotion = useCallback(
    async (promotionId: string) => {
      try {
        await promotionsApi.delete(promotionId);
        setPromotions((current) => current.filter((p) => p.id !== promotionId));
        toast.success("Promoción eliminada");
      } catch (err) {
        handleApiError(err, "No se pudo eliminar la promoción");
        throw err;
      }
    },
    [handleApiError],
  );

  const fetchSalesReport = useCallback(
    async (range: ReportDateRange) => {
      if (!restaurantId) throw new Error("Sin restaurante");
      const year = new Date().getFullYear();
      const dates = reportRangeToDates(range);
      const query = reportRangeToQuery(range);
      const cacheKey = `admin:sales:${restaurantId}:${JSON.stringify(query)}:${year}:${dates.from}:${dates.to}`;

      return dedupeAsync(cacheKey, async () => {
        const [period, monthly, courierRes] = await Promise.all([
          restaurantsApi.getSalesReport(restaurantId, query),
          restaurantsApi.getMonthlySales(restaurantId, year),
          restaurantsApi.getCourierPayouts(restaurantId, dates),
        ]);

        const months = buildMonthlyReports(monthly, year);
        const courierPayouts: CourierPayoutRow[] = courierRes.data.map((row) => ({
          courierId: row.courier_id,
          courierName: row.courier_name,
          courierAvatar: resolveLogoUrl(row.courier_avatar) ?? row.courier_avatar ?? undefined,
          deliveries: row.orders_delivered,
          settledAmount: row.total_payout,
          pendingAmount: 0,
          status: "liquidado" as const,
          averageRating: 0,
          reviewCount: 0,
        }));

        const ytdRealNetProfit = months.reduce((sum, m) => sum + m.realNetProfit, 0);
        const ytdCourierPayout = months.reduce((sum, m) => sum + m.courierPayout, 0);
        const ytdNetProfit = months.reduce((sum, m) => sum + m.netProfit, 0);

        return {
          period,
          monthly,
          months,
          courierPayouts,
          rangeLabel: reportRangeLabel(range),
          ytdRealNetProfit,
          ytdCourierPayout,
          ytdNetProfit,
        };
      });
    },
    [restaurantId],
  );

  const exportSalesCsv = useCallback(
    async (range: ReportDateRange) => {
      if (!restaurantId) return;
      const dates = reportRangeToDates(range);
      const blob = await restaurantsApi.exportSalesCsv(restaurantId, dates);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ventas-${dates.from}-${dates.to}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [restaurantId],
  );

  const updateSalesGoals = useCallback(
    async (goals: { dailyGoal: number | null; monthlyGoal: number | null }) => {
      if (!restaurantId) {
        const message = "No se encontró el restaurante del administrador.";
        toast.error(message);
        throw new Error(message);
      }
      try {
        // Siempre enviar ambos campos (número o null) para mantener diaria ↔ mensual sincronizadas.
        const updated = await restaurantsApi.updateProfile(restaurantId, {
          daily_goal: goals.dailyGoal,
          monthly_goal: goals.monthlyGoal,
        });
        setRestaurant(updated);
        await refreshDashboard(true);
      } catch (err) {
        handleApiError(err, "No se pudieron guardar las metas");
        throw err;
      }
    },
    [restaurantId, refreshDashboard, handleApiError],
  );

  const value = useMemo<AdminContextValue>(
    () => ({
      restaurantId,
      restaurant,
      kitchenOrders,
      enRouteOrders,
      menu,
      categories,
      promotions,
      dashboard,
      reviews,
      activeDeliveries,
      dispatchRecords,
      dispatchSummary,
      loading,
      error,
      refreshKitchenOrders,
      refreshEnRouteOrders,
      refreshMenu,
      refreshPromotions,
      refreshDashboard,
      refreshActiveDeliveries,
      refreshDispatchHistory,
      fetchAvailableCouriers,
      updateOrderStatus,
      assignCourierBatch,
      dispatchBatch,
      toggleAvailability,
      addMenuItem,
      addAddition,
      updateMenuItem,
      updateProductCustomization,
      addPromotion,
      updatePromotion,
      deletePromotion,
      fetchSalesReport,
      exportSalesCsv,
      getCategoryIdByName,
      updateSalesGoals,
      ensureTabData,
    }),
    [
      restaurantId,
      restaurant,
      kitchenOrders,
      enRouteOrders,
      menu,
      categories,
      promotions,
      dashboard,
      reviews,
      activeDeliveries,
      dispatchRecords,
      dispatchSummary,
      loading,
      error,
      refreshKitchenOrders,
      refreshEnRouteOrders,
      refreshMenu,
      refreshPromotions,
      refreshDashboard,
      refreshActiveDeliveries,
      refreshDispatchHistory,
      fetchAvailableCouriers,
      updateOrderStatus,
      assignCourierBatch,
      dispatchBatch,
      toggleAvailability,
      addMenuItem,
      addAddition,
      updateMenuItem,
      updateProductCustomization,
      addPromotion,
      updatePromotion,
      deletePromotion,
      fetchSalesReport,
      exportSalesCsv,
      getCategoryIdByName,
      updateSalesGoals,
      ensureTabData,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin debe usarse dentro de AdminProvider");
  }
  return ctx;
}

/** Disponible dentro o fuera de AdminProvider (p. ej. avatar del TopBar). */
export function useOptionalAdmin() {
  return useContext(AdminContext);
}
