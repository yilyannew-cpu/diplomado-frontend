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
import { RESTAURANT_PROFILE_UPDATED_EVENT } from "@/components/shared/ProfileAccountDialog";
import { mapApiRestaurantList } from "@/lib/api/cliente/mappers";
import { clienteApi } from "@/lib/api/endpoints/cliente";
import { clientOrdersApi } from "@/lib/api/endpoints/clientOrders";
import { productsApi } from "@/lib/api/endpoints/products";
import {
  mapApiOrder,
  mapApiProduct,
  mapApiProducts,
  mapApiPromotions,
} from "@/lib/api/admin/mappers";
import { getSocketUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiRestaurantProfile } from "@/lib/api/types/admin";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { getProductPricing } from "@/lib/promotions";
import type { MenuItem } from "@/mocks/menuMock";
import type { Order } from "@/mocks/ordersMock";
import type { Promotion } from "@/mocks/promotionsMock";
import type { Restaurant } from "@/mocks/restaurantsMock";
import type { OrderItemCustomizations } from "@/mocks/ordersMock";

export type Customizations = OrderItemCustomizations;

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  customizations?: Customizations;
}

export type ClientTab = "menu" | "tracking";

export type ClientModule = "inicio" | "promociones" | "rankin";

const TRACKING_STORAGE_KEY = "ffcore_client_tracking_code";
const ACTIVE_RESTAURANT_KEY = "ffcore_client_active_restaurant";

interface ClienteState {
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  setActiveRestaurantId: (id: string) => void;
  menu: MenuItem[];
  /** Productos disponibles de todos los restaurantes (para búsqueda global). */
  allMenus: MenuItem[];
  promotions: Promotion[];
  isLoadingMenu: boolean;
  bootstrapError: string | null;
  cart: CartItem[];
  cartItemCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  activeClientOrderId: string | null;
  trackedOrder: Order | null;
  isTrackingLoading: boolean;
  clientTab: ClientTab;
  setClientTab: (tab: ClientTab) => void;
  clientModule: ClientModule;
  setClientModule: (module: ClientModule) => void;
  addToCart: (product: MenuItem, customizations?: Customizations) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  confirmCart: (customer: {
    name: string;
    address: string;
    phone: string;
    notes?: string;
  }) => Promise<Order>;
  fetchProductDetail: (productId: string) => Promise<MenuItem>;
  refreshTracking: (code?: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
}

const ClienteContext = createContext<ClienteState | null>(null);

export function ClienteProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [allMenus, setAllMenus] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeClientOrderId, setActiveClientOrderId] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [clientTab, setClientTab] = useState<ClientTab>("menu");
  const [clientModule, setClientModule] = useState<ClientModule>("inicio");
  const trackingSocketRef = useRef<Socket | null>(null);
  const catalogRequestRef = useRef(0);
  const skipNextCartClearRef = useRef(false);

  const loadRestaurantCatalog = useCallback(async (restaurantId: string) => {
    const requestId = ++catalogRequestRef.current;
    setIsLoadingMenu(true);
    setBootstrapError(null);
    try {
      const productsRaw = await productsApi.list({ restaurantId, available: true });

      let promotionsRaw: Awaited<ReturnType<typeof clienteApi.listActivePromotions>> = [];
      try {
        promotionsRaw = await clienteApi.listActivePromotions(restaurantId);
      } catch {
        /* promos opcionales */
      }

      if (requestId !== catalogRequestRef.current) return;

      const mapped = mapApiProducts(productsRaw);
      setMenu(mapped);
      setPromotions(mapApiPromotions(promotionsRaw));
      setAllMenus((current) => {
        const others = current.filter((p) => p.restaurantId !== restaurantId);
        return [...others, ...mapped];
      });
    } catch (err) {
      if (requestId !== catalogRequestRef.current) return;
      const message =
        err instanceof ApiError ? err.message : "No se pudo cargar el menú del restaurante.";
      setBootstrapError(message);
      setMenu([]);
      toast.error(message);
    } finally {
      if (requestId === catalogRequestRef.current) {
        setIsLoadingMenu(false);
      }
    }
  }, []);

  const loadAllMenus = useCallback(async (restaurantIds: string[]) => {
    if (restaurantIds.length === 0) {
      setAllMenus([]);
      return;
    }
    const chunks = await Promise.all(
      restaurantIds.map((id) =>
        productsApi
          .list({ restaurantId: id, available: true })
          .then(mapApiProducts)
          .catch(() => [] as MenuItem[]),
      ),
    );
    setAllMenus(chunks.flat());
  }, []);

  const refreshCatalog = useCallback(async () => {
    const ids = restaurants.map((r) => r.id);
    await Promise.all([
      activeRestaurantId ? loadRestaurantCatalog(activeRestaurantId) : Promise.resolve(),
      loadAllMenus(ids),
    ]);
  }, [activeRestaurantId, loadRestaurantCatalog, loadAllMenus, restaurants]);

  const cartItemCount = useMemo(
    () => cart.reduce((acc, i) => acc + i.quantity, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const pricing = getProductPricing(item.product, promotions);
        const extraPrice = item.customizations?.extraPrice ?? 0;
        return acc + (pricing.salePrice + extraPrice) * item.quantity;
      }, 0),
    [cart, promotions],
  );

  const refreshTracking = useCallback(async (code?: string) => {
    const trackCode = code ?? activeClientOrderId;
    if (!trackCode) return;

    setIsTrackingLoading(true);
    try {
      const raw = await clientOrdersApi.track(trackCode);
      const order = mapApiOrder(raw);
      setTrackedOrder(order);
      setActiveClientOrderId(order.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TRACKING_STORAGE_KEY, order.id);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo consultar el estado del pedido.";
      toast.error(message);
    } finally {
      setIsTrackingLoading(false);
    }
  }, [activeClientOrderId]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoadingMenu(true);
      setBootstrapError(null);
      try {
        const list = await clienteApi.listRestaurants();
        if (cancelled) return;
        const mapped = mapApiRestaurantList(list);
        setRestaurants(mapped);

        const savedRestaurantId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ACTIVE_RESTAURANT_KEY)
            : null;
        const defaultId =
          (savedRestaurantId && mapped.some((r) => r.id === savedRestaurantId)
            ? savedRestaurantId
            : mapped[0]?.id) ?? null;

        setActiveRestaurantId((prev) => {
          if (prev && mapped.some((r) => r.id === prev)) return prev;
          return defaultId;
        });
        if (mapped.length === 0) {
          setMenu([]);
          setAllMenus([]);
          setPromotions([]);
          setIsLoadingMenu(false);
        } else {
          void loadAllMenus(mapped.map((r) => r.id));
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : "No se pudieron cargar los restaurantes.";
        setBootstrapError(message);
        toast.error(message);
        setIsLoadingMenu(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadAllMenus]);

  useEffect(() => {
    if (!activeRestaurantId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_RESTAURANT_KEY, activeRestaurantId);
    }
    if (skipNextCartClearRef.current) {
      skipNextCartClearRef.current = false;
    } else {
      setCart([]);
    }
    void loadRestaurantCatalog(activeRestaurantId);
  }, [activeRestaurantId, loadRestaurantCatalog]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ApiRestaurantProfile>).detail;
      if (!detail?.id) return;
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === detail.id
            ? {
                ...r,
                name: detail.name || r.name,
                tagline: detail.tagline ?? r.tagline,
                city: detail.city || r.city,
                accent: detail.accent || r.accent,
                initials: detail.initials || r.initials,
                logo: resolveLogoUrl(detail.logo),
                rating: detail.rating ?? r.rating,
                deliveryMinutes: detail.delivery_minutes ?? r.deliveryMinutes,
              }
            : r,
        ),
      );
    };
    window.addEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(RESTAURANT_PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (activeRestaurantId) void loadRestaurantCatalog(activeRestaurantId);
      void clienteApi.listRestaurants().then((list) => {
        const mapped = mapApiRestaurantList(list);
        setRestaurants(mapped);
        void loadAllMenus(mapped.map((r) => r.id));
      }).catch(() => {
        /* silencioso: el catálogo ya está en memoria */
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [activeRestaurantId, loadRestaurantCatalog, loadAllMenus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!saved) return;

    setActiveClientOrderId(saved);
    setIsTrackingLoading(true);
    clientOrdersApi
      .track(saved)
      .then((raw) => {
        const order = mapApiOrder(raw);
        setTrackedOrder(order);
      })
      .catch(() => {
        window.localStorage.removeItem(TRACKING_STORAGE_KEY);
        setActiveClientOrderId(null);
      })
      .finally(() => setIsTrackingLoading(false));
  }, []);

  useEffect(() => {
    const code = trackedOrder?.id ?? activeClientOrderId;
    if (!code) return;

    const socket = io(getSocketUrl(), { transports: ["websocket"] });
    trackingSocketRef.current = socket;

    socket.emit("join_order", code);

    socket.on("order_status_changed", (payload: unknown) => {
      try {
        const order = mapApiOrder(payload as Parameters<typeof mapApiOrder>[0]);
        if (order.id === code) {
          setTrackedOrder(order);
        }
      } catch {
        /* payload inesperado */
      }
    });

    return () => {
      socket.disconnect();
      trackingSocketRef.current = null;
    };
  }, [trackedOrder?.id, activeClientOrderId]);

  const addToCart = (product: MenuItem, customizations?: Customizations) => {
    const hash = customizations
      ? `${product.id}-${JSON.stringify({
          additions: customizations.additions?.map((e) => e.productId) ?? [],
          sides: customizations.sides?.map((e) => e.productId) ?? [],
          drinks: customizations.drinks?.map((e) => e.productId) ?? [],
          specialInstructions: customizations.specialInstructions ?? "",
        })}`
      : product.id;

    const nextItem: CartItem = { id: hash, product, quantity: 1, customizations };

    if (product.restaurantId !== activeRestaurantId) {
      skipNextCartClearRef.current = true;
      setActiveRestaurantId(product.restaurantId);
      setCart([nextItem]);
      setCartOpen(true);
      return;
    }

    setCart((c) => {
      const existing = c.find((i) => i.id === hash);
      if (existing) {
        return c.map((i) => (i.id === hash ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, nextItem];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((c) =>
      c
        .map((i) => (i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const fetchProductDetail = useCallback(async (productId: string): Promise<MenuItem> => {
    const raw = await productsApi.get(productId);
    const mapped = mapApiProduct(raw);
    setMenu((current) => {
      const idx = current.findIndex((p) => p.id === productId);
      if (idx < 0) return current;
      const next = [...current];
      next[idx] = mapped;
      return next;
    });
    return mapped;
  }, []);

  const confirmCart: ClienteState["confirmCart"] = async (customer) => {
    if (!activeRestaurantId) {
      throw new Error("Selecciona un restaurante antes de confirmar el pedido.");
    }
    if (cart.length === 0) {
      throw new Error("El carrito está vacío.");
    }

    const notes = customer.notes?.trim();
    const payload = {
      customer_name: customer.name.trim(),
      address: customer.address.trim(),
      phone: customer.phone.trim(),
      ...(notes ? { notes } : {}),
      restaurant_id: activeRestaurantId,
      items: cart.map((c) => ({
        product_id: c.product.id,
        quantity: c.quantity,
        ...(c.customizations
          ? {
              customizations: {
                addition_ids: c.customizations.additions?.map((e) => e.productId) ?? [],
                side_ids: c.customizations.sides?.map((e) => e.productId) ?? [],
                drink_ids: c.customizations.drinks?.map((e) => e.productId) ?? [],
                ...(c.customizations.specialInstructions
                  ? { special_instructions: c.customizations.specialInstructions }
                  : {}),
                extra_price: c.customizations.extraPrice,
              },
            }
          : {}),
      })),
    };

    const raw = await clientOrdersApi.create(payload);
    const order = mapApiOrder(raw);

    setTrackedOrder(order);
    setActiveClientOrderId(order.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TRACKING_STORAGE_KEY, order.id);
    }
    setCart([]);
    setClientTab("tracking");
    toast.success(`Pedido ${order.id} enviado a cocina`);

    return order;
  };

  return (
    <ClienteContext.Provider
      value={{
        restaurants,
        activeRestaurantId,
        setActiveRestaurantId,
        menu,
        allMenus,
        promotions,
        isLoadingMenu,
        bootstrapError,
        cart,
        cartItemCount,
        cartOpen,
        setCartOpen,
        activeClientOrderId,
        trackedOrder,
        isTrackingLoading,
        clientTab,
        setClientTab,
        clientModule,
        setClientModule,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        confirmCart,
        fetchProductDetail,
        refreshTracking,
        refreshCatalog,
      }}
    >
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const ctx = useContext(ClienteContext);
  if (!ctx) throw new Error("useCliente must be used inside ClienteProvider");
  return ctx;
}

export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export { DEFAULT_DELIVERY_FEE_COP };
