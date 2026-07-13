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
import {
  fetchPromotionsCached,
  fetchRestaurantProductsCached,
  fetchRestaurantsCached,
  invalidateClientCatalogCache,
  patchCachedRestaurant,
  peekAllCachedProducts,
  peekCachedPromotions,
  peekCachedRestaurants,
} from "@/lib/api/cliente/clientCatalogCache";
import {
  fetchOrderTrackCached,
  peekTrackedOrder,
  setTrackedOrderCache,
} from "@/lib/api/cliente/orderTrackCache";
import {
  readClienteSession,
  writeClienteSession,
  type ClientModule as SessionClientModule,
  type ClientTab as SessionClientTab,
} from "@/lib/api/cliente/clientSession";
import { clientOrdersApi } from "@/lib/api/endpoints/clientOrders";
import { productsApi } from "@/lib/api/endpoints/products";
import { mapApiOrder, mapApiProduct } from "@/lib/api/admin/mappers";
import { getSocketUrl } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiRestaurantProfile } from "@/lib/api/types/admin";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { getProductPricing } from "@/lib/promotions";
import { resolveClientComuna } from "@/lib/clientComunaStorage";
import { sortRestaurantsByProximity } from "@/lib/restaurantProximity";
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

export type ClientTab = SessionClientTab;

export type ClientModule = SessionClientModule;

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
    deliveryFee?: number;
  }) => Promise<Order>;
  fetchProductDetail: (productId: string) => Promise<MenuItem>;
  refreshTracking: (code?: string) => Promise<void>;
  refreshCatalog: () => Promise<void>;
  /** Carga menús de todos los restaurantes (solo al buscar). */
  ensureAllMenus: () => Promise<void>;
  isLoadingAllMenus: boolean;
}

const ClienteContext = createContext<ClienteState | null>(null);

function getInitialSession() {
  return readClienteSession();
}

export function ClienteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const clientComuna = resolveClientComuna(user);
  const initial = getInitialSession();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(
    () => initial?.restaurants ?? peekCachedRestaurants() ?? [],
  );
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(
    () => initial?.activeRestaurantId ?? null,
  );
  const [menu, setMenu] = useState<MenuItem[]>(() => initial?.menu ?? []);
  const [allMenus, setAllMenus] = useState<MenuItem[]>(() => {
    if (initial?.allMenus?.length) return initial.allMenus;
    const ids = (initial?.restaurants ?? peekCachedRestaurants() ?? []).map((r) => r.id);
    return peekAllCachedProducts(ids) ?? [];
  });
  const [promotions, setPromotions] = useState<Promotion[]>(() => initial?.promotions ?? []);
  const [isLoadingMenu, setIsLoadingMenu] = useState(() => {
    const cached = peekCachedRestaurants();
    return !cached || cached.length === 0;
  });
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => initial?.cart ?? []);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeClientOrderId, setActiveClientOrderId] = useState<string | null>(
    () => initial?.activeClientOrderId ?? null,
  );
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(() => initial?.trackedOrder ?? null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [clientTab, setClientTab] = useState<ClientTab>(() => initial?.clientTab ?? "menu");
  const [clientModule, setClientModule] = useState<ClientModule>(
    () => initial?.clientModule ?? "inicio",
  );
  const [isLoadingAllMenus, setIsLoadingAllMenus] = useState(false);
  const trackingSocketRef = useRef<Socket | null>(null);
  const catalogRequestRef = useRef(0);
  const allMenusLoadedRef = useRef(false);

  const loadRestaurantCatalog = useCallback(async (restaurantId: string, force = false) => {
    const requestId = ++catalogRequestRef.current;
    if (!force) {
      const cachedMenu = peekAllCachedProducts([restaurantId]);
      const cachedPromos = peekCachedPromotions(restaurantId);
      if (cachedMenu && cachedPromos !== null) {
        setMenu(cachedMenu);
        setPromotions(cachedPromos);
        setIsLoadingMenu(false);
        return;
      }
    } else {
      setIsLoadingMenu(true);
    }
    setBootstrapError(null);
    try {
      const [mapped, promos] = await Promise.all([
        fetchRestaurantProductsCached(restaurantId, { force }),
        fetchPromotionsCached(restaurantId, { force }),
      ]);

      if (requestId !== catalogRequestRef.current) return;

      setMenu(mapped);
      setPromotions(promos);
    } catch (err) {
      if (requestId !== catalogRequestRef.current) return;
      const message =
        err instanceof ApiError ? err.message : "No se pudo cargar el menú del restaurante.";
      setBootstrapError(message);
      setMenu([]);
      toast.error(message);
    } finally {
      if (requestId !== catalogRequestRef.current) return;
      setIsLoadingMenu(false);
    }
  }, []);

  const ensureAllMenus = useCallback(async (force = false) => {
    const ids = restaurants.map((r) => r.id);
    if (ids.length === 0) {
      setAllMenus([]);
      return;
    }
    if (!force) {
      const cached = peekAllCachedProducts(ids);
      if (cached) {
        setAllMenus(cached);
        allMenusLoadedRef.current = true;
        return;
      }
      if (allMenusLoadedRef.current && allMenus.length > 0) return;
    }

    setIsLoadingAllMenus(true);
    try {
      const products = await fetchAllProductsCached(ids, { force });
      setAllMenus(products);
      allMenusLoadedRef.current = true;
    } finally {
      setIsLoadingAllMenus(false);
    }
  }, [restaurants, allMenus.length]);

  const refreshCatalog = useCallback(async () => {
    invalidateClientCatalogCache();
    allMenusLoadedRef.current = false;
    setIsLoadingMenu(true);
    try {
      const mapped = await fetchRestaurantsCached({ force: true });
      setRestaurants(mapped);
      if (activeRestaurantId) {
        await loadRestaurantCatalog(activeRestaurantId, true);
      }
    } finally {
      setIsLoadingMenu(false);
    }
  }, [activeRestaurantId, loadRestaurantCatalog]);

  const refreshTracking = useCallback(async (code?: string) => {
    const trackCode = code ?? activeClientOrderId;
    if (!trackCode) return;

    setIsTrackingLoading(true);
    try {
      const raw = await fetchOrderTrackCached(trackCode, { force: true });
      const order = mapApiOrder(raw);
      setTrackedOrderCache(raw);
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

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootstrapError(null);
      try {
        const mapped = await fetchRestaurantsCached();
        if (cancelled) return;
        setRestaurants(mapped);

        const savedRestaurantId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ACTIVE_RESTAURANT_KEY)
            : null;
        const preferred = sortRestaurantsByProximity(mapped, clientComuna);
        const defaultId =
          (activeRestaurantId && mapped.some((r) => r.id === activeRestaurantId)
            ? activeRestaurantId
            : savedRestaurantId && mapped.some((r) => r.id === savedRestaurantId)
              ? savedRestaurantId
              : preferred[0]?.id) ?? null;

        if (!activeRestaurantId && defaultId) {
          setActiveRestaurantId(defaultId);
        }

        if (mapped.length === 0) {
          setMenu([]);
          setPromotions([]);
          setIsLoadingMenu(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restaura el código de pedido sin llamar al API (el track se hace al abrir Estado).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeClientOrderId) return;
    const saved = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!saved) return;
    setActiveClientOrderId(saved);
    const cached = peekTrackedOrder(saved);
    if (cached) setTrackedOrder(mapApiOrder(cached));
  }, [activeClientOrderId]);

  // Catálogo del restaurante activo solo en Inicio / Promociones.
  useEffect(() => {
    if (!activeRestaurantId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_RESTAURANT_KEY, activeRestaurantId);
    }
    setCart((current) => {
      if (current.length === 0) return current;
      if (current.every((item) => item.product.restaurantId === activeRestaurantId)) {
        return current;
      }
      return [];
    });

    if (clientTab === "tracking") return;
    if (clientModule === "rankin") {
      setIsLoadingMenu(false);
      return;
    }

    void loadRestaurantCatalog(activeRestaurantId);
  }, [activeRestaurantId, clientModule, clientTab, loadRestaurantCatalog]);

  // Track del pedido solo al entrar a la pestaña Estado (con dedupe/caché).
  useEffect(() => {
    if (clientTab !== "tracking") return;
    const code = activeClientOrderId;
    if (!code) return;

    let cancelled = false;
    const cached = peekTrackedOrder(code);
    if (cached) {
      setTrackedOrder(mapApiOrder(cached));
    }

    setIsTrackingLoading(true);
    void fetchOrderTrackCached(code)
      .then((raw) => {
        if (cancelled) return;
        setTrackedOrderCache(raw);
        setTrackedOrder(mapApiOrder(raw));
      })
      .catch(() => {
        if (cancelled) return;
        window.localStorage.removeItem(TRACKING_STORAGE_KEY);
        setActiveClientOrderId(null);
        setTrackedOrder(null);
      })
      .finally(() => {
        if (!cancelled) setIsTrackingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clientTab, activeClientOrderId]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ApiRestaurantProfile>).detail;
      if (!detail?.id) return;
      const patched = patchCachedRestaurant(detail.id, {
        name: detail.name,
        tagline: detail.tagline,
        city: detail.city,
        accent: detail.accent,
        initials: detail.initials,
        logo: resolveLogoUrl(detail.logo),
        rating: detail.rating,
        deliveryMinutes: detail.delivery_minutes,
      });
      if (patched) {
        setRestaurants(patched);
        return;
      }
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
    writeClienteSession({
      restaurants,
      activeRestaurantId,
      menu,
      allMenus,
      promotions,
      cart,
      clientTab,
      clientModule,
      activeClientOrderId,
      trackedOrder,
    });
  }, [
    restaurants,
    activeRestaurantId,
    menu,
    allMenus,
    promotions,
    cart,
    clientTab,
    clientModule,
    activeClientOrderId,
    trackedOrder,
  ]);

  // Socket solo mientras se mira el seguimiento (evita tráfico innecesario).
  useEffect(() => {
    if (clientTab !== "tracking") return;
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
  }, [clientTab, trackedOrder?.id, activeClientOrderId]);

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
      ...(customer.deliveryFee ? { delivery_fee: customer.deliveryFee } : {}),
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
    setTrackedOrderCache(raw);

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
        ensureAllMenus,
        isLoadingAllMenus,
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
