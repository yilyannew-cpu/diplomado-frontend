import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { menuMock, type MenuItem } from "@/mocks/menuMock";
import { ordersMock, type Order, type OrderStatus } from "@/mocks/ordersMock";

export interface CartItem {
  product: MenuItem;
  quantity: number;
}

export type ClientTab = "menu" | "tracking";

export type ClientModule = "inicio" | "promociones" | "rankin";

interface OrderState {
  menu: MenuItem[];
  orders: Order[];
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
  toggleAvailability: (id: string) => void;
  updatePrice: (id: string, price: number) => void;
  findOrder: (code: string) => Order | undefined;
}

const OrderContext = createContext<OrderState | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>(menuMock);
  const [orders, setOrders] = useState<Order[]>(ordersMock);
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
    () => cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
    [cart],
  );

  const confirmCart: OrderState["confirmCart"] = (customer) => {
    const id = `PED-${(orders.length + 101).toString()}`;
    const order: Order = {
      id,
      customerName: customer.name,
      address: customer.address,
      phone: customer.phone,
      items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      total: cartTotal + 5000,
      status: "Recibido",
      createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
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

  const toggleAvailability = (id: string) => {
    setMenu((m) => m.map((p) => (p.id === id ? { ...p, available: !p.available } : p)));
  };

  const updatePrice = (id: string, price: number) => {
    setMenu((m) => m.map((p) => (p.id === id ? { ...p, price } : p)));
  };

  const findOrder = (code: string) =>
    orders.find((o) => o.id.toLowerCase() === code.trim().toLowerCase());

  return (
    <OrderContext.Provider
      value={{
        menu,
        orders,
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
        toggleAvailability,
        updatePrice,
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