import type { Category, MenuItem } from "@/mocks/menuMock";
import { CATEGORIES } from "@/mocks/menuMock";
import type { Order } from "@/mocks/ordersMock";
import { restaurantReviewsMock } from "@/mocks/restaurantReviewsMock";

const COUNTED_STATUSES = new Set<Order["status"]>([
  "Listo",
  "Recogido",
  "En Camino",
  "Entregado",
]);

/** Meta mensual de ventas para la sede (mock). */
export const MONTHLY_SALES_GOAL_COP = 18_000_000;

/** Ventas base del mes antes de pedidos en vivo (mock histórico). */
const BASE_MONTHLY_SALES_COP = 12_450_000;

export interface CategorySalesRow {
  category: string;
  sales: number;
  fill: string;
}

export interface TopProductRow {
  productId: string;
  name: string;
  category: Category;
  unitsSold: number;
  revenue: number;
  image: string;
}

export interface DashboardStats {
  salesToday: number;
  ordersToday: number;
  monthlySales: number;
  goalProgress: number;
  averageRating: number;
  reviewCount: number;
  salesByCategory: CategorySalesRow[];
  topProducts: TopProductRow[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Entradas: "var(--color-chart-1)",
  "Platos principales": "var(--color-chart-2)",
  Acompañamientos: "var(--color-chart-3)",
  Bebidas: "var(--color-chart-4)",
  Postres: "var(--color-chart-5)",
  Adiciones: "var(--color-primary)",
};

function isTodayOrder(_createdAt: string): boolean {
  return true;
}

export function buildDashboardStats(orders: Order[], menu: MenuItem[]): DashboardStats {
  const countedOrders = orders.filter((o) => COUNTED_STATUSES.has(o.status));
  const todayOrders = countedOrders.filter((o) => isTodayOrder(o.createdAt));

  const salesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const liveMonthly = countedOrders.reduce((sum, o) => sum + o.total, 0);
  const monthlySales = BASE_MONTHLY_SALES_COP + liveMonthly;
  const goalProgress = Math.min(100, Math.round((monthlySales / MONTHLY_SALES_GOAL_COP) * 100));

  const categoryTotals = new Map<string, number>();
  const productTotals = new Map<string, { units: number; revenue: number }>();

  for (const order of countedOrders) {
    for (const item of order.items) {
      const product = menu.find((m) => m.id === item.productId);
      if (!product) continue;
      const revenue = product.price * item.quantity;
      categoryTotals.set(product.category, (categoryTotals.get(product.category) ?? 0) + revenue);
      const current = productTotals.get(product.id) ?? { units: 0, revenue: 0 };
      productTotals.set(product.id, {
        units: current.units + item.quantity,
        revenue: current.revenue + revenue,
      });
    }
  }

  const salesByCategory: CategorySalesRow[] = CATEGORIES.map((category) => ({
    category,
    sales: categoryTotals.get(category) ?? 0,
    fill: CATEGORY_COLORS[category] ?? "hsl(var(--muted-foreground))",
  })).filter((row) => row.sales > 0);

  const topProducts: TopProductRow[] = [...productTotals.entries()]
    .map(([productId, stats]) => {
      const product = menu.find((m) => m.id === productId)!;
      return {
        productId,
        name: product.name,
        category: product.category,
        unitsSold: stats.units,
        revenue: stats.revenue,
        image: product.image,
      };
    })
    .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
    .slice(0, 5);

  const reviews = restaurantReviewsMock;
  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return {
    salesToday,
    ordersToday: todayOrders.length,
    monthlySales,
    goalProgress,
    averageRating,
    reviewCount: reviews.length,
    salesByCategory,
    topProducts,
  };
}

export { restaurantReviewsMock };
