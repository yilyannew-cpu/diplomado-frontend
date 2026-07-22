import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ── Tipos (aún desde mocks hasta Fase 3 de centralización) ──────────
import type { DispatchRecord } from "@/mocks/dispatchHistoryMock";
import type { MenuItem } from "@/mocks/menuMock";
import type { Order, OrderItemCustomizations, OrderStatus } from "@/mocks/ordersMock";
import type { Promotion } from "@/mocks/promotionsMock";
import type { Restaurant } from "@/mocks/restaurantsMock";

// ── Clientes API reales ─────────────────────────────────────────────
import { restaurantsApi, type ApiRestaurantSummary } from "@/lib/api/endpoints/restaurants";
import { productsApi } from "@/lib/api/endpoints/products";
import { clienteApi } from "@/lib/api/endpoints/cliente";
import { clientOrdersApi, type CreateOrderPayload } from "@/lib/api/endpoints/clientOrders";
import { mapApiProducts, mapApiPromotions, mapApiOrder } from "@/lib/api/admin/mappers";
import { useAuth } from "@/context/AuthContext";

// ── Helpers que se mantienen ────────────────────────────────────────
import { canAssignBatchToCourier } from "@/lib/deliveryLimits";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { orderToDispatchRecord } from "@/lib/orderHistory";
import { getProductPricing } from "@/lib/promotions";

export type Customizations = OrderItemCustomizations;

export interface CartItem {
  id: string;
  product: MenuItem;
  quantity: number;
  customizations?: Customizations;
}

export type ClientTab = "menu" | "tracking";

export type ClientModule = "inicio" | "promociones" | "rankin";

interface OrderState {
  menu: MenuItem[];
  isLoadingMenu: boolean;
  orders: Order[];
  dispatchHistory: DispatchRecord[];
  promotions: Promotion[];
  cart: CartItem[];
  cartItemCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  activeClientOrderId: string | null;
  clientTab: ClientTab;
  setClientTab: (tab: ClientTab) => void;
  clientModule: ClientModule;
  setClientModule: (module: ClientModule) => void;
  addToCart: (product: MenuItem, customizations?: Customizations) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  confirmCart: (customer: { name: string; address: string; phone: string }) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  takeOrder: (orderId: string, deliveryPersonId: string) => void;
  assignDeliveryPerson: (orderId: string, deliveryPersonId: string) => void;
  assignDeliveryPersonBatch: (orderIds: string[], deliveryPersonId: string) => void;
  assignCourierOnlyBatch: (orderIds: string[], deliveryPersonId: string) => void;
  dispatchOrderBatch: (orderIds: string[]) => void;
  toggleAvailability: (id: string) => void;
  updateMenuItem: (
    id: string,
    updates: Pick<MenuItem, "price" | "description" | "image" | "available">,
  ) => void;
  updateProductCustomization: (
    id: string,
    ingredients: MenuItem["ingredients"],
    modifierGroups: MenuItem["modifierGroups"],
  ) => void;
  addMenuItem: (item: Omit<MenuItem, "id" | "restaurantId">) => void;
  addPromotion: (promotion: Omit<Promotion, "id" | "createdAt">) => void;
  updatePromotion: (
    id: string,
    updates: Omit<Promotion, "id" | "createdAt">,
  ) => void;
  findOrder: (code: string) => Order | undefined;
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  setActiveRestaurantId: (id: string) => void;
}

const OrderContext = createContext<OrderState | null>(null);

// ── Mapper: convierte ApiRestaurantSummary a Restaurant (frontend) ───
function mapApiRestaurant(api: ApiRestaurantSummary): Restaurant {
  return {
    id: api.id,
    name: api.name,
    tagline: api.tagline ?? "",
    city: api.city,
    address: api.address,
    rating: api.rating,
    deliveryMinutes: api.deliveryMinutes,
    accent: api.accent,
    initials: api.initials,
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  // Catálogo (restaurantes/menú/promos) solo para paneles que lo consumen.
  // En domiciliario/gobernanza no debe disparar /restaurants + /products + /active.
  const needsCatalog =
    !authLoading && (user?.role === "cliente" || user?.role === "admin");

  // ── Estado: ahora inicia vacío en lugar de con mocks ──────────────
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allMenu, setAllMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchRecord[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [activeClientOrderId, setActiveClientOrderId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>("menu");
  const [clientModule, setClientModule] = useState<ClientModule>("inicio");
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  // ── Cargar restaurantes desde la base de datos (solo cliente/admin) ─
  useEffect(() => {
    if (!needsCatalog) {
      setRestaurants([]);
      setActiveRestaurantId(null);
      setIsLoadingMenu(false);
      return;
    }

    let cancelled = false;
    restaurantsApi
      .listAll()
      .then((data) => {
        if (cancelled) return;
        const mapped = data.map(mapApiRestaurant);
        setRestaurants(mapped);
        if (mapped.length > 0) {
          setActiveRestaurantId((prev) => prev ?? mapped[0]!.id);
        }
      })
      .catch((err) => {
        console.error("[OrderContext] Error cargando restaurantes:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [needsCatalog]);

  // ── Cargar menú y promociones cuando cambia el restaurante activo ─
  useEffect(() => {
    if (!needsCatalog || !activeRestaurantId) {
      setAllMenu([]);
      setPromotions([]);
      setIsLoadingMenu(false);
      return;
    }

    let cancelled = false;
    setIsLoadingMenu(true);

    // Endpoint público: el listado admin exige rol de restaurante (FORBIDDEN en panel cliente).
    Promise.all([
      productsApi.list({ restaurantId: activeRestaurantId }),
      clienteApi.listActivePromotions(activeRestaurantId).catch(() => []),
    ])
      .then(([apiProducts, apiPromotions]) => {
        if (cancelled) return;
        setAllMenu(mapApiProducts(apiProducts));
        setPromotions(mapApiPromotions(apiPromotions));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[OrderContext] Error cargando menú/promos:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMenu(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsCatalog, activeRestaurantId]);

  const menu = useMemo(
    () =>
      activeRestaurantId
        ? allMenu.filter((item) => item.restaurantId === activeRestaurantId)
        : allMenu,
    [allMenu, activeRestaurantId],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((acc, i) => acc + i.quantity, 0),
    [cart],
  );

  const addToCart = (product: MenuItem, customizations?: Customizations) => {
    const hash = customizations
      ? `${product.id}-${JSON.stringify({
          additions: customizations.additions?.map((e) => e.productId) ?? [],
          sides: customizations.sides?.map((e) => e.productId) ?? [],
          drinks: customizations.drinks?.map((e) => e.productId) ?? [],
          specialInstructions: customizations.specialInstructions ?? "",
        })}`
      : product.id;

    setCart((c) => {
      const existing = c.find((i) => i.id === hash);
      if (existing) {
        return c.map((i) => (i.id === hash ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { id: hash, product, quantity: 1, customizations }];
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

  const cartTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const pricing = getProductPricing(item.product, promotions);
        const extraPrice = item.customizations?.extraPrice ?? 0;
        return acc + (pricing.salePrice + extraPrice) * item.quantity;
      }, 0),
    [cart, promotions],
  );

  // ── confirmCart: ahora envía el pedido al backend real ─────────────
  const confirmCart: OrderState["confirmCart"] = useCallback(
    async (customer) => {
      if (!activeRestaurantId) {
        throw new Error("No hay restaurante seleccionado");
      }

      const deliveryFee = DEFAULT_DELIVERY_FEE_COP;

      // Empaquetar el pedido en el formato que espera el backend
      const payload: CreateOrderPayload = {
        customer_name: customer.name,
        address: customer.address,
        phone: customer.phone,
        restaurant_id: activeRestaurantId,
        delivery_fee: deliveryFee,
        items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          customizations: c.customizations
            ? {
                addition_ids: c.customizations.additions?.map((a) => a.productId),
                side_ids: c.customizations.sides?.map((s) => s.productId),
                drink_ids: c.customizations.drinks?.map((d) => d.productId),
                special_instructions: c.customizations.specialInstructions,
                extra_price: c.customizations.extraPrice,
              }
            : undefined,
        })),
      };

      // Enviar al backend real → POST /api/v1/orders
      const apiOrder = await clientOrdersApi.create(payload);

      // Mapear la respuesta del API al formato que entiende el frontend
      const newOrder = mapApiOrder(apiOrder);

      setOrders((prev) => [newOrder, ...prev]);
      setCart([]);
      setActiveClientOrderId(newOrder.id);
      setClientTab("tracking");
      return newOrder;
    },
    [activeRestaurantId, cart],
  );

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((o) =>
      o.map((or) => (or.id === id ? { ...or, status, statusEnteredAt: Date.now() } : or)),
    );
  };

  const takeOrder = (orderId: string, deliveryPersonId: string) => {
    setOrders((o) => {
      const existing = o.find(or => or.id === orderId);
      if (!existing || existing.deliveryPersonId || existing.status !== "Listo") {
        return o; // Ya no está disponible
      }
      return o.map(or => or.id === orderId ? { 
        ...or, 
        deliveryPersonId, 
        status: "En Camino", 
        statusEnteredAt: Date.now() 
      } : or);
    });
  };

  const assignDeliveryPerson = (orderId: string, deliveryPersonId: string) => {
    assignDeliveryPersonBatch([orderId], deliveryPersonId);
  };

  const assignDeliveryPersonBatch = (orderIds: string[], deliveryPersonId: string) => {
    assignCourierOnlyBatch(orderIds, deliveryPersonId);
    dispatchOrderBatch(orderIds);
  };

  const assignCourierOnlyBatch = (orderIds: string[], deliveryPersonId: string) => {
    if (!canAssignBatchToCourier(orders, deliveryPersonId, orderIds)) {
      return;
    }
    const idSet = new Set(orderIds);
    setOrders((o) =>
      o.map((or) => (idSet.has(or.id) ? { ...or, deliveryPersonId } : or)),
    );
  };

  const dispatchOrderBatch = (orderIds: string[]) => {
    const idSet = new Set(orderIds);
    const now = Date.now();

    const toDispatch = orders.filter(
      (o) => idSet.has(o.id) && o.status === "Listo" && o.deliveryPersonId,
    );

    if (toDispatch.length > 0) {
      setDispatchHistory((history) => [
        ...toDispatch.map((o) => orderToDispatchRecord(o, now)),
        ...history,
      ]);
    }

    setOrders((o) =>
      o.map((or) =>
        idSet.has(or.id) && or.status === "Listo"
          ? {
              ...or,
              status: "En Camino" as OrderStatus,
              dispatchedAt: now,
              statusEnteredAt: now,
            }
          : or,
      ),
    );
  };

  const toggleAvailability = (id: string) => {
    setAllMenu((m) => m.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const updateMenuItem = (
    id: string,
    updates: Pick<MenuItem, "price" | "description" | "image" | "available">,
  ) => {
    setAllMenu((m) => m.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const updateProductCustomization = (
    id: string,
    ingredients: MenuItem["ingredients"],
    modifierGroups: MenuItem["modifierGroups"],
  ) => {
    setAllMenu((m) =>
      m.map((p) => (p.id === id ? { ...p, ingredients, modifierGroups } : p)),
    );
  };

  const addMenuItem = (item: Omit<MenuItem, "id" | "restaurantId">) => {
    setAllMenu((m) => {
      const maxNum = m.reduce((max, p) => {
        const n = Number.parseInt(p.id.replace("prod-", ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newItem: MenuItem = {
        ...item,
        id: `prod-${String(maxNum + 1).padStart(2, "0")}`,
        restaurantId: activeRestaurantId ?? "rest-ffcore",
      };
      return [...m, newItem];
    });
  };

  const addPromotion = (promotion: Omit<Promotion, "id" | "createdAt">) => {
    const newPromotion: Promotion = {
      ...promotion,
      id: `PROM-${Date.now()}`,
      createdAt: Date.now(),
    };
    setPromotions((current) => [newPromotion, ...current]);
  };

  const updatePromotion = (
    id: string,
    updates: Omit<Promotion, "id" | "createdAt">,
  ) => {
    setPromotions((current) =>
      current.map((promo) => (promo.id === id ? { ...promo, ...updates } : promo)),
    );
  };

  const findOrder = (code: string) =>
    orders.find((o) => o.id.toLowerCase() === code.trim().toLowerCase());

  return (
    <OrderContext.Provider
      value={{
        menu,
        isLoadingMenu,
        orders,
        dispatchHistory,
        promotions,
        cart,
        cartItemCount,
        cartOpen,
        setCartOpen,
        activeClientOrderId,
        clientTab,
        setClientTab,
        clientModule,
        setClientModule,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        confirmCart,
        updateOrderStatus,
        takeOrder,
        assignDeliveryPerson,
        assignDeliveryPersonBatch,
        assignCourierOnlyBatch,
        dispatchOrderBatch,
        toggleAvailability,
        updateMenuItem,
        updateProductCustomization,
        addMenuItem,
        addPromotion,
        updatePromotion,
        findOrder,
        restaurants,
        activeRestaurantId,
        setActiveRestaurantId,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used inside OrderProvider");
  return ctx;
}

export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
