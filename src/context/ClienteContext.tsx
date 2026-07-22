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
  fetchAllProductsCached,
  fetchAllPromotionsCached,
  invalidateClientCatalogCache,
  patchCachedRestaurant,
  peekAllCachedProducts,
  peekAllCachedPromotions,
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
  clearClienteSession,
  type ClientModule as SessionClientModule,
  type ClientTab as SessionClientTab,
} from "@/lib/api/cliente/clientSession";
import { clientOrdersApi, invalidateMyActiveOrderCache } from "@/lib/api/endpoints/clientOrders";
import { productsApi } from "@/lib/api/endpoints/products";
import { mapApiOrder, mapApiProduct } from "@/lib/api/admin/mappers";
import { clearClientCart, readClientCart, writeClientCart } from "@/lib/clientCartStorage";
import { isTrackingCycleClosed } from "@/lib/clientDeliveryReviewStorage";
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

function trackingStorageKey(userId: string): string {
  return `${TRACKING_STORAGE_KEY}:${userId}`;
}

/** Solo lee el código del usuario autenticado (sin fallback global = fuga entre clientes). */
function readSavedTrackingCode(userId?: string | null): string | null {
  if (typeof window === "undefined" || !userId) return null;
  return window.localStorage.getItem(trackingStorageKey(userId));
}

function writeSavedTrackingCode(code: string, userId?: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(trackingStorageKey(userId), code);
  // Limpia la clave legacy global (heredaba pedidos entre logins del mismo browser).
  window.localStorage.removeItem(TRACKING_STORAGE_KEY);
}

function clearSavedTrackingCode(userId?: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TRACKING_STORAGE_KEY);
  if (userId) {
    window.localStorage.removeItem(trackingStorageKey(userId));
  }
}

/** Normaliza teléfono a dígitos (últimos 10) para comparar ownership. */
function normalizePhoneDigits(value?: string | null): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function normalizePersonName(value?: string | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Un cliente solo puede ver sus propios pedidos.
 * Prioridad: teléfono de perfil; si no hay teléfono, nombre completo.
 */
function orderBelongsToClient(
  order: Order,
  user: { id: string; name: string; phone?: string | null } | null | undefined,
): boolean {
  if (!user?.id) return false;

  const userPhone = normalizePhoneDigits(user.phone);
  const orderPhone = normalizePhoneDigits(order.phone);
  if (userPhone && orderPhone) {
    return userPhone === orderPhone;
  }

  const userName = normalizePersonName(user.name);
  const orderName = normalizePersonName(order.customerName);
  if (userName && orderName) {
    return userName === orderName;
  }

  // Sin datos para verificar → no mostrar (privacidad por defecto).
  return false;
}

interface ClienteState {
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  setActiveRestaurantId: (id: string) => void;
  restaurantDetailOpen: boolean;
  openRestaurantDetail: (id: string) => void;
  closeRestaurantDetail: () => void;
  menu: MenuItem[];
  /** Productos disponibles de todos los restaurantes (para búsqueda global). */
  allMenus: MenuItem[];
  /** Promociones activas de todos los restaurantes (módulo Promociones). */
  allPromotions: Promotion[];
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
  /** Cierra el seguimiento tras entregar + calificar (o ciclo ya cerrado). */
  clearTracking: () => void;
  refreshCatalog: () => Promise<void>;
  /** Carga menús de todos los restaurantes (solo al buscar). */
  ensureAllMenus: () => Promise<void>;
  /** Carga menús + promociones de todas las sedes (módulo Promociones). */
  ensureAllPromotionsCatalog: () => Promise<void>;
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
  const [restaurantDetailOpen, setRestaurantDetailOpen] = useState(
    () => Boolean(initial?.restaurantDetailOpen),
  );
  const [menu, setMenu] = useState<MenuItem[]>(() => initial?.menu ?? []);
  const [allMenus, setAllMenus] = useState<MenuItem[]>(() => {
    if (initial?.allMenus?.length) return initial.allMenus;
    const ids = (initial?.restaurants ?? peekCachedRestaurants() ?? []).map((r) => r.id);
    return peekAllCachedProducts(ids) ?? [];
  });
  const [promotions, setPromotions] = useState<Promotion[]>(() => initial?.promotions ?? []);
  const [allPromotions, setAllPromotions] = useState<Promotion[]>(() => {
    const ids = (initial?.restaurants ?? peekCachedRestaurants() ?? []).map((r) => r.id);
    return peekAllCachedPromotions(ids) ?? [];
  });
  const [isLoadingMenu, setIsLoadingMenu] = useState(() => {
    const cached = peekCachedRestaurants();
    return !cached || cached.length === 0;
  });
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => initial?.cart ?? []);
  const [cartOpen, setCartOpen] = useState(false);
  const cartHydratedForUserRef = useRef<string | null>(null);
  const trackingUserRef = useRef<string | null>(null);
  // No restaurar tracking desde sesión en memoria sin ownership (fuga entre logins).
  const [activeClientOrderId, setActiveClientOrderId] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [clientTab, setClientTabState] = useState<ClientTab>(
    () => (initial?.clientTab === "tracking" ? "menu" : (initial?.clientTab ?? "menu")),
  );
  const [clientModule, setClientModuleState] = useState<ClientModule>(
    () => initial?.clientModule ?? "inicio",
  );
  const [isLoadingAllMenus, setIsLoadingAllMenus] = useState(false);
  const trackingSocketRef = useRef<Socket | null>(null);
  const catalogRequestRef = useRef(0);
  const allMenusLoadedRef = useRef(false);
  const allPromotionsLoadedRef = useRef(false);
  const ensureAllMenusInflightRef = useRef<Promise<void> | null>(null);
  const ensureAllPromosInflightRef = useRef<Promise<void> | null>(null);
  const restaurantIdsKey = useMemo(
    () => restaurants.map((r) => r.id).join("|"),
    [restaurants],
  );

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
    const ids = restaurantIdsKey ? restaurantIdsKey.split("|") : [];
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
      if (allMenusLoadedRef.current) return;
      if (ensureAllMenusInflightRef.current) return ensureAllMenusInflightRef.current;
    }

    const run = (async () => {
      setIsLoadingAllMenus(true);
      try {
        const products = await fetchAllProductsCached(ids, { force });
        setAllMenus(products);
        allMenusLoadedRef.current = true;
      } finally {
        setIsLoadingAllMenus(false);
        ensureAllMenusInflightRef.current = null;
      }
    })();

    ensureAllMenusInflightRef.current = run;
    return run;
  }, [restaurantIdsKey]);

  const ensureAllPromotionsCatalog = useCallback(async (force = false) => {
    const ids = restaurantIdsKey ? restaurantIdsKey.split("|") : [];
    if (ids.length === 0) {
      setAllMenus([]);
      setAllPromotions([]);
      return;
    }

    if (!force) {
      const cachedMenus = peekAllCachedProducts(ids);
      const cachedPromos = peekAllCachedPromotions(ids);
      if (cachedMenus && cachedPromos) {
        setAllMenus(cachedMenus);
        setAllPromotions(cachedPromos);
        allMenusLoadedRef.current = true;
        allPromotionsLoadedRef.current = true;
        return;
      }
      if (allMenusLoadedRef.current && allPromotionsLoadedRef.current) {
        return;
      }
      if (ensureAllPromosInflightRef.current) return ensureAllPromosInflightRef.current;
    }

    const run = (async () => {
      setIsLoadingAllMenus(true);
      try {
        const [products, promos] = await Promise.all([
          fetchAllProductsCached(ids, { force }),
          fetchAllPromotionsCached(ids, { force }),
        ]);
        setAllMenus(products);
        setAllPromotions(promos);
        allMenusLoadedRef.current = true;
        allPromotionsLoadedRef.current = true;
      } finally {
        setIsLoadingAllMenus(false);
        ensureAllPromosInflightRef.current = null;
      }
    })();

    ensureAllPromosInflightRef.current = run;
    return run;
  }, [restaurantIdsKey]);

  const refreshCatalog = useCallback(async () => {
    invalidateClientCatalogCache();
    allMenusLoadedRef.current = false;
    allPromotionsLoadedRef.current = false;
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

  const clearTracking = useCallback(() => {
    clearSavedTrackingCode(user?.id);
    setActiveClientOrderId(null);
    setTrackedOrder(null);
    setRestaurantDetailOpen(false);
    setClientTabState("menu");
  }, [user?.id]);

  const applyTrackedOrder = useCallback(
    (order: Order) => {
      if (!orderBelongsToClient(order, user)) {
        clearSavedTrackingCode(user?.id);
        setActiveClientOrderId(null);
        setTrackedOrder(null);
        setClientTabState((tab) => (tab === "tracking" ? "menu" : tab));
        return false;
      }
      if (isTrackingCycleClosed(order)) {
        clearSavedTrackingCode(user?.id);
        setActiveClientOrderId(null);
        setTrackedOrder(null);
        setClientTabState((tab) => (tab === "tracking" ? "menu" : tab));
        return false;
      }
      setTrackedOrder(order);
      setActiveClientOrderId(order.id);
      writeSavedTrackingCode(order.id, user?.id);
      return true;
    },
    [user],
  );

  const refreshTracking = useCallback(async (code?: string) => {
    const trackCode = code ?? activeClientOrderId;
    if (!trackCode) return;

    setIsTrackingLoading(true);
    try {
      const raw = await fetchOrderTrackCached(trackCode, { force: true });
      const order = mapApiOrder(raw);
      if (!orderBelongsToClient(order, user)) {
        clearSavedTrackingCode(user?.id);
        setActiveClientOrderId(null);
        setTrackedOrder(null);
        toast.error("Este pedido no pertenece a tu cuenta.");
        return;
      }
      setTrackedOrderCache(raw);
      applyTrackedOrder(order);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo consultar el estado del pedido.";
      toast.error(message);
    } finally {
      setIsTrackingLoading(false);
    }
  }, [activeClientOrderId, applyTrackedOrder, user]);

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

  // Al cambiar de usuario / logout: limpiar tracking y sesión en memoria.
  useEffect(() => {
    const prev = trackingUserRef.current;
    const next = user?.id ?? null;
    if (prev === next) return;

    if (prev && prev !== next) {
      clearSavedTrackingCode(prev);
      clearSavedTrackingCode(null);
      setTrackedOrder(null);
      setActiveClientOrderId(null);
      setClientTabState((tab) => (tab === "tracking" ? "menu" : tab));
      invalidateMyActiveOrderCache();
      clearClienteSession();
    }

    trackingUserRef.current = next;
  }, [user?.id]);

  // Restaura el código de pedido solo del usuario autenticado (con ownership).
  useEffect(() => {
    if (!user?.id) return;
    if (activeClientOrderId) return;
    const saved = readSavedTrackingCode(user.id);
    if (!saved) return;
    const cached = peekTrackedOrder(saved);
    if (cached) {
      const order = mapApiOrder(cached);
      if (!orderBelongsToClient(order, user) || isTrackingCycleClosed(order)) {
        clearSavedTrackingCode(user.id);
        return;
      }
      setTrackedOrder(order);
      setActiveClientOrderId(order.id);
      return;
    }
    setActiveClientOrderId(saved);
  }, [activeClientOrderId, user]);

  // Catálogo del restaurante activo solo en Inicio / Promociones.
  // El carrito NO se vacía al cambiar de sede: solo se reemplaza si añades
  // un producto de otro restaurante (ver addToCart).
  useEffect(() => {
    if (!activeRestaurantId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_RESTAURANT_KEY, activeRestaurantId);
    }

    if (clientTab === "tracking") return;
    if (clientModule === "rankin" || clientModule === "promociones" || clientModule === "mis-pedidos") {
      setIsLoadingMenu(false);
      return;
    }

    void loadRestaurantCatalog(activeRestaurantId);
  }, [activeRestaurantId, clientModule, clientTab, loadRestaurantCatalog]);

  // Restaura el carrito desde localStorage (sobrevive recargas).
  useEffect(() => {
    if (!user?.id) {
      cartHydratedForUserRef.current = null;
      return;
    }
    if (cartHydratedForUserRef.current === user.id) return;
    const isFirstHydrate = cartHydratedForUserRef.current === null;
    cartHydratedForUserRef.current = user.id;
    const stored = readClientCart(user.id);
    setCart((current) => {
      // Misma sesión SPA: conservar el carrito en memoria si ya había ítems.
      if (isFirstHydrate && current.length > 0) return current;
      return stored;
    });
  }, [user?.id]);

  // Persiste el carrito hasta que el usuario lo vacíe o confirme el pedido.
  useEffect(() => {
    if (!user?.id || cartHydratedForUserRef.current !== user.id) return;
    writeClientCart(user.id, cart);
  }, [cart, user?.id]);

  // Track / recuperación del pedido al entrar a Estado.
  useEffect(() => {
    if (clientTab !== "tracking") return;
    if (!user?.id) {
      setTrackedOrder(null);
      setIsTrackingLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTracking() {
      setIsTrackingLoading(true);
      try {
        // 1) Fuente confiable: pedido activo del JWT (no códigos ajenos en localStorage).
        try {
          const rawActive = await clientOrdersApi.myActive();
          if (cancelled) return;
          if (rawActive && typeof rawActive === "object" && "id" in rawActive && rawActive.id) {
            const activeOrder = mapApiOrder(rawActive);
            if (orderBelongsToClient(activeOrder, user)) {
              setTrackedOrderCache(rawActive);
              applyTrackedOrder(activeOrder);
              return;
            }
          }
        } catch {
          /* endpoint aún no desplegado o sin pedido */
        }

        // 2) Código guardado SOLO de este userId + ownership.
        const code = activeClientOrderId ?? readSavedTrackingCode(user.id);
        if (!code) {
          if (!cancelled) {
            setTrackedOrder(null);
            setActiveClientOrderId(null);
          }
          return;
        }

        const cached = peekTrackedOrder(code);
        if (cached && !cancelled) {
          const cachedOrder = mapApiOrder(cached);
          if (
            !orderBelongsToClient(cachedOrder, user) ||
            isTrackingCycleClosed(cachedOrder)
          ) {
            clearSavedTrackingCode(user.id);
            setActiveClientOrderId(null);
            setTrackedOrder(null);
            setClientTabState("menu");
            return;
          }
          setTrackedOrder(cachedOrder);
        }

        const raw = await fetchOrderTrackCached(code);
        if (cancelled) return;
        const order = mapApiOrder(raw);
        if (!orderBelongsToClient(order, user)) {
          clearSavedTrackingCode(user.id);
          setActiveClientOrderId(null);
          setTrackedOrder(null);
          toast.error("Este pedido no pertenece a tu cuenta.");
          return;
        }
        setTrackedOrderCache(raw);
        applyTrackedOrder(order);
      } catch (err) {
        if (cancelled) return;
        const isNotFound = err instanceof ApiError && err.status === 404;
        if (isNotFound) {
          clearSavedTrackingCode(user.id);
          setActiveClientOrderId(null);
          setTrackedOrder(null);
        }
      } finally {
        if (!cancelled) setIsTrackingLoading(false);
      }
    }

    void loadTracking();
    return () => {
      cancelled = true;
    };
  }, [clientTab, activeClientOrderId, user, applyTrackedOrder]);

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
        coverImage: resolveLogoUrl(detail.cover_image),
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
                coverImage: resolveLogoUrl(detail.cover_image) ?? r.coverImage,
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
      userId: user?.id ?? null,
      restaurants,
      activeRestaurantId,
      restaurantDetailOpen,
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
    user?.id,
    restaurants,
    activeRestaurantId,
    restaurantDetailOpen,
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
          applyTrackedOrder(order);
        }
      } catch {
        /* payload inesperado */
      }
    });

    return () => {
      socket.disconnect();
      trackingSocketRef.current = null;
    };
  }, [clientTab, trackedOrder?.id, activeClientOrderId, applyTrackedOrder]);

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
      toast.message("Carrito actualizado", {
        description: "Solo puedes pedir de un restaurante a la vez.",
      });
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

  const clearCart = () => {
    setCart([]);
    if (user?.id) clearClientCart(user.id);
  };

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
    invalidateMyActiveOrderCache();
    clearCart();

    setTrackedOrder(order);
    setActiveClientOrderId(order.id);
    writeSavedTrackingCode(order.id, user?.id);
    setRestaurantDetailOpen(false);
    setClientTabState("tracking");
    toast.success(`Pedido ${order.id} enviado a cocina`);

    return order;
  };

  const openRestaurantDetail = useCallback(
    (id: string) => {
      setActiveRestaurantId(id);
      setRestaurantDetailOpen(true);
      setClientTabState("menu");
      setClientModuleState("inicio");
    },
    [],
  );

  const closeRestaurantDetail = useCallback(() => {
    setRestaurantDetailOpen(false);
  }, []);

  const setClientTab = useCallback((tab: ClientTab) => {
    setClientTabState(tab);
    if (tab === "tracking") setRestaurantDetailOpen(false);
  }, []);

  const setClientModule = useCallback((module: ClientModule) => {
    setClientModuleState(module);
    setRestaurantDetailOpen(false);
  }, []);

  return (
    <ClienteContext.Provider
      value={{
        restaurants,
        activeRestaurantId,
        setActiveRestaurantId,
        restaurantDetailOpen,
        openRestaurantDetail,
        closeRestaurantDetail,
        menu,
        allMenus,
        allPromotions,
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
        clearTracking,
        refreshCatalog,
        ensureAllMenus,
        ensureAllPromotionsCatalog,
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
