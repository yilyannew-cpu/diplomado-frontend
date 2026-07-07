import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dispatchHistoryMock, type DispatchRecord } from "@/mocks/dispatchHistoryMock";
import { type MenuItem } from "@/mocks/menuMock";
import { apiClient } from "@/lib/apiClient";
import { ordersMock, type Order, type OrderStatus } from "@/mocks/ordersMock";
import { promotionsMock, type Promotion } from "@/mocks/promotionsMock";
import { canAssignBatchToCourier } from "@/lib/deliveryLimits";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { orderToDispatchRecord } from "@/lib/orderHistory";
import { getProductPricing } from "@/lib/promotions";

export interface Customizations {
  removedIngredients: string[]; // array of ingredient ids
  addedModifiers: Record<string, string[]>; // groupId -> array of option ids
  extraPrice: number;
}

export interface CartItem {
  id: string; // unique hash to distinguish same product with different customizations
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
}

const OrderContext = createContext<OrderState | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: menu = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data;
    }
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['orders', 'restaurant', 'rest-ffcore'],
    queryFn: async () => {
      const res = await apiClient.get('/orders/restaurant/rest-ffcore');
      return res.data;
    },
    refetchInterval: 5000, // Poll every 5s for now until websockets
  });

  const [dispatchHistory, setDispatchHistory] = useState<DispatchRecord[]>(dispatchHistoryMock);
  const [promotions, setPromotions] = useState<Promotion[]>(promotionsMock);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeClientOrderId, setActiveClientOrderId] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>("menu");
  const [clientModule, setClientModule] = useState<ClientModule>("inicio");

  const cartItemCount = useMemo(
    () => cart.reduce((acc, i) => acc + i.quantity, 0),
    [cart],
  );

  const addToCart = (product: MenuItem, customizations?: Customizations) => {
    const hash = customizations
      ? `${product.id}-${JSON.stringify(customizations.removedIngredients)}-${JSON.stringify(customizations.addedModifiers)}`
      : product.id;

    setCart((c) => {
      const existing = c.find((i) => i.id === hash);
      if (existing) {
        return c.map((i) =>
          i.id === hash ? { ...i, quantity: i.quantity + 1 } : i,
        );
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
        const extraPrice = item.customizations?.extraPrice || 0;
        return acc + (pricing.salePrice + extraPrice) * item.quantity;
      }, 0),
    [cart, promotions],
  );

  const confirmCart: OrderState["confirmCart"] = async (customer) => {
    const deliveryFee = DEFAULT_DELIVERY_FEE_COP;
    const payload = {
      customerName: customer.name,
      address: customer.address,
      phone: customer.phone,
      restaurantId: "rest-ffcore", // Defaulting for now
      items: cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        customizations: c.customizations,
      })),
    };

    const res = await apiClient.post('/orders', payload);
    const order = res.data;

    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    setCart([]);
    setActiveClientOrderId(order.id);
    setClientTab("tracking");
    return order;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await apiClient.patch(`/orders/${id}/status`, { status });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const assignDeliveryPerson = (orderId: string, deliveryPersonId: string) => {
    assignDeliveryPersonBatch([orderId], deliveryPersonId);
  };

  const assignDeliveryPersonBatch = async (orderIds: string[], deliveryPersonId: string) => {
    try {
      await Promise.all(orderIds.map(id => apiClient.patch(`/orders/${id}/assign`, { courierId: deliveryPersonId })));
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      console.error("Failed to assign batch:", e);
    }
  };

  const assignCourierOnlyBatch = (orderIds: string[], deliveryPersonId: string) => {
    // This was mostly used for local state preview, we'll just forward to the assignBatch now
    assignDeliveryPersonBatch(orderIds, deliveryPersonId);
  };

  const dispatchOrderBatch = async (orderIds: string[]) => {
    try {
      // In the backend, dispatching might just mean setting status to "En Camino"
      await Promise.all(orderIds.map(id => apiClient.patch(`/orders/${id}/status`, { status: "En Camino" })));
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      console.error("Failed to dispatch batch:", e);
    }
  };

  const toggleAvailability = (id: string) => {
    // To be implemented as mutation later
  };

  const updateMenuItem = (
    id: string,
    updates: Pick<MenuItem, "price" | "description" | "image" | "available">,
  ) => {
    // To be implemented as mutation later
  };

  const updateProductCustomization = (
    id: string,
    ingredients: MenuItem["ingredients"],
    modifierGroups: MenuItem["modifierGroups"],
  ) => {
    // To be implemented as mutation later
  };

  const addMenuItem = (item: Omit<MenuItem, "id" | "restaurantId">) => {
    // To be implemented as mutation later
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