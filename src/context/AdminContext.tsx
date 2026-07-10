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
import { PLACEHOLDER_IMAGE } from "@/lib/mediaUrl";
import { reportRangeLabel, reportRangeToDates, reportRangeToQuery } from "@/lib/api/admin/reportDates";
import { mapHistoryPeriodToApi } from "@/lib/api/admin/historyPeriod";
import { adminOrdersApi } from "@/lib/api/endpoints/adminOrders";
import { productsApi } from "@/lib/api/endpoints/products";
import { promotionsApi } from "@/lib/api/endpoints/promotions";
import { restaurantsApi, type ApiReview } from "@/lib/api/endpoints/restaurants";
import { getSocketUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
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

function isKitchenOrder(order: Order): boolean {
  return KITCHEN_STATUSES.includes(order.status);
}

function mergeKitchenOrder(current: Order[], incoming: Order): Order[] {
  if (!isKitchenOrder(incoming)) {
    return current.filter((o) => o.orderId !== incoming.orderId && o.id !== incoming.id);
  }
  const key = incoming.orderId ?? incoming.id;
  const idx = current.findIndex((o) => (o.orderId ?? o.id) === key);
  if (idx >= 0) {
    const next = [...current];
    next[idx] = incoming;
    return next;
  }
  return [incoming, ...current];
}

function mergeKitchenOrders(current: Order[], incoming: Order[]): Order[] {
  return incoming.reduce((acc, order) => mergeKitchenOrder(acc, order), current);
}

function buildMonthlyReports(monthly: ApiMonthlySales, year: number): MonthlySalesReport[] {
  return monthly.data.map((point) => {
    const grossSales = point.gross_sales;
    const appCommissions = Math.round(grossSales * 0.05);
    const courierPayout = 0;
    const netProfit = grossSales - appCommissions - courierPayout;
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
  refreshMenu: () => Promise<void>;
  refreshPromotions: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshActiveDeliveries: () => Promise<void>;
  refreshDispatchHistory: (period?: HistoryPeriod) => Promise<void>;
  fetchAvailableCouriers: (batchSize: number) => Promise<ApiAvailableCourier[]>;
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
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const restaurantId = user?.restaurant_id ?? null;

  const [restaurant, setRestaurant] = useState<ApiRestaurantProfile | null>(null);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
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

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof ApiError ? err.message : fallback;
    setError(message);
    toast.error(message);
  }, []);

  const refreshKitchenOrders = useCallback(async () => {
    if (!restaurantId) return;
    const raw = await adminOrdersApi.listKitchenOrders(restaurantId);
    setKitchenOrders(mapApiOrders(raw));
  }, [restaurantId]);

  const refreshMenu = useCallback(async () => {
    if (!restaurantId) return;
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
  }, [restaurantId]);

  const refreshPromotions = useCallback(async () => {
    if (!restaurantId) return;
    const raw = await restaurantsApi.listPromotions(restaurantId);
    setPromotions(mapApiPromotions(raw));
  }, [restaurantId]);

  const refreshDashboard = useCallback(async () => {
    if (!restaurantId) return;
    const [profile, dash, reviewsPage] = await Promise.all([
      restaurantsApi.getProfile(restaurantId),
      restaurantsApi.getDashboard(restaurantId),
      restaurantsApi.listReviews(restaurantId, { limit: 10, offset: 0 }),
    ]);
    setRestaurant(profile);
    setDashboard(dash);
    setReviews(reviewsPage.data);
  }, [restaurantId]);

  const refreshActiveDeliveries = useCallback(async () => {
    if (!restaurantId) return;
    const res = await restaurantsApi.getActiveDeliveries(restaurantId);
    setActiveDeliveries(res.data);
  }, [restaurantId]);

  const refreshDispatchHistory = useCallback(
    async (period: HistoryPeriod = "month") => {
      if (!restaurantId) return;
      const apiPeriod = mapHistoryPeriodToApi(period);
      const [records, summary] = await Promise.all([
        restaurantsApi.listDispatches(restaurantId, { period: apiPeriod }),
        restaurantsApi.getDispatchSummary(restaurantId, apiPeriod),
      ]);
      setDispatchRecords(records.data);
      setDispatchSummary(summary);
    },
    [restaurantId],
  );

  const bootstrap = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshKitchenOrders(),
        refreshMenu(),
        refreshPromotions(),
        refreshDashboard(),
        refreshActiveDeliveries(),
        refreshDispatchHistory("month"),
      ]);
    } catch (err) {
      handleApiError(err, "Error al cargar el panel admin");
    } finally {
      setLoading(false);
    }
  }, [
    restaurantId,
    refreshKitchenOrders,
    refreshMenu,
    refreshPromotions,
    refreshDashboard,
    refreshActiveDeliveries,
    refreshDispatchHistory,
    handleApiError,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(getSocketUrl(), { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("join_restaurant", restaurantId);

    const onNewOrder = (payload: unknown) => {
      const order = mapApiOrder(payload as Parameters<typeof mapApiOrder>[0]);
      setKitchenOrders((current) => mergeKitchenOrder(current, order));
    };

    const onStatusChanged = (payload: unknown) => {
      if (Array.isArray(payload)) {
        setKitchenOrders((current) => mergeKitchenOrders(current, mapApiOrders(payload as Parameters<typeof mapApiOrders>[0])));
      } else {
        const order = mapApiOrder(payload as Parameters<typeof mapApiOrder>[0]);
        setKitchenOrders((current) => mergeKitchenOrder(current, order));
      }
      void refreshActiveDeliveries();
      void refreshDispatchHistory("month");
    };

    socket.on("new_order", onNewOrder);
    socket.on("order_status_changed", onStatusChanged);

    return () => {
      socket.off("new_order", onNewOrder);
      socket.off("order_status_changed", onStatusChanged);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [restaurantId, refreshActiveDeliveries, refreshDispatchHistory]);

  const fetchAvailableCouriers = useCallback(
    async (batchSize: number) => {
      if (!restaurantId) return [];
      const res = await restaurantsApi.listAvailableCouriers(restaurantId, batchSize);
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
        toast.success("Domiciliario asignado");
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
        setKitchenOrders((current) =>
          current.filter((o) => !orders.some((x) => getOrderApiId(x) === getOrderApiId(o))),
        );
        await Promise.all([refreshActiveDeliveries(), refreshDispatchHistory("month")]);
        toast.success("Pedidos despachados");
      } catch (err) {
        handleApiError(err, "No se pudo despachar el lote");
        throw err;
      }
    },
    [restaurantId, refreshActiveDeliveries, refreshDispatchHistory, handleApiError],
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
      const [period, monthly, courierRes] = await Promise.all([
        restaurantsApi.getSalesReport(restaurantId, reportRangeToQuery(range)),
        restaurantsApi.getMonthlySales(restaurantId, year),
        restaurantsApi.getCourierPayouts(restaurantId, dates),
      ]);

      const months = buildMonthlyReports(monthly, year);
      const courierPayouts: CourierPayoutRow[] = courierRes.data.map((row) => ({
        courierId: row.courier_id,
        courierName: row.courier_name,
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

  const value = useMemo<AdminContextValue>(
    () => ({
      restaurantId,
      restaurant,
      kitchenOrders,
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
    }),
    [
      restaurantId,
      restaurant,
      kitchenOrders,
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
