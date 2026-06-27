import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { menuMock, type MenuItem } from "@/mocks/menuMock";
import { ordersMock, type Order, type OrderStatus } from "@/mocks/ordersMock";
import { promotionsMock, type Promotion } from "@/mocks/promotionsMock";
import { canAssignBatchToCourier } from "@/lib/deliveryLimits";
import { DEFAULT_DELIVERY_FEE_COP } from "@/lib/deliveryFees";
import { getProductPricing } from "@/lib/promotions";

export interface CartItem {
  product: MenuItem;
  quantity: number;
}

export type ClientTab = "menu" | "tracking";

export type ClientModule = "inicio" | "promociones" | "rankin";

interface OrderState {
  menu: MenuItem[];
  orders: Order[];
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
  addToCart: (product: MenuItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  confirmCart: (customer: { name: string; address: string; phone: string }) => Order;
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
  const [menu, setMenu] = useState<MenuItem[]>(menuMock);
  const [orders, setOrders] = useState<Order[]>(ordersMock);
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

  const addToCart = (product: MenuItem) => {
    setCart((c) => {
      const existing = c.find((i) => i.product.id === product.id);
      if (existing) {
        return c.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...c, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((c) =>
      c
        .map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(
    () =>
      cart.reduce((acc, item) => {
        const pricing = getProductPricing(item.product, promotions);
        return acc + pricing.salePrice * item.quantity;
      }, 0),
    [cart, promotions],
  );

  const confirmCart: OrderState["confirmCart"] = (customer) => {
    const id = `PED-${(orders.length + 101).toString()}`;
    const deliveryFee = DEFAULT_DELIVERY_FEE_COP;
    const order: Order = {
      id,
      customerName: customer.name,
      address: customer.address,
      phone: customer.phone,
      items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      total: cartTotal + deliveryFee,
      deliveryFee,
      status: "Recibido",
      createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      receivedAt: Date.now(),
    };
    setOrders((o) => [order, ...o]);
    setCart([]);
    setActiveClientOrderId(order.id);
    setClientTab("tracking");
    return order;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((o) => o.map((or) => (or.id === id ? { ...or, status } : or)));
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
    setOrders((o) =>
      o.map((or) =>
        idSet.has(or.id) && or.status === "Listo"
          ? { ...or, status: "En Camino" as OrderStatus }
          : or,
      ),
    );
  };

  const toggleAvailability = (id: string) => {
    setMenu((m) => m.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const updateMenuItem = (
    id: string,
    updates: Pick<MenuItem, "price" | "description" | "image" | "available">,
  ) => {
    setMenu((m) => m.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const addMenuItem = (item: Omit<MenuItem, "id" | "restaurantId">) => {
    setMenu((m) => {
      const maxNum = m.reduce((max, p) => {
        const n = Number.parseInt(p.id.replace("prod-", ""), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newItem: MenuItem = {
        ...item,
        id: `prod-${String(maxNum + 1).padStart(2, "0")}`,
        restaurantId: "rest-burgercore",
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
        orders,
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