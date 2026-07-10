/** Tipos snake_case de la API del panel admin restaurante. */

export interface ApiRestaurantProfile {
  id: string;
  name: string;
  tagline: string;
  city: string;
  address: string;
  delivery_minutes: number;
  monthly_goal: number;
  accent: string;
  initials: string;
  rating: number;
  status: string;
}

export interface ApiDashboard {
  sales_today: number;
  orders_today: number;
  monthly_sales: number;
  monthly_goal: number;
  goal_progress_percent: number;
  sales_by_category: Array<{
    category_id: string;
    category_name: string;
    image: string | null;
    total: number;
  }>;
  top_products: Array<{
    product_id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  active_promotions_count: number;
  average_rating: number;
  review_count: number;
}

export interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  customer_name: string;
  created_at: string;
}

export interface ApiReviewsPage {
  data: ApiReview[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiSalesReport {
  period: { from: string; to: string };
  gross_sales: number;
  courier_payout: number;
  delivered_orders: number;
  net_profit: number;
  app_commissions: number;
  real_net_profit: number;
  margin_percent: number;
}

export interface ApiMonthlySalesPoint {
  month: number;
  label: string;
  gross_sales: number;
  orders: number;
}

export interface ApiMonthlySales {
  year: number;
  data: ApiMonthlySalesPoint[];
}

export interface ApiCourierPayout {
  courier_id: string;
  courier_name: string;
  orders_delivered: number;
  total_payout: number;
}

export interface ApiSelectedExtra {
  product_id: string;
  name: string;
  price: number;
}

export interface ApiOrderItem {
  line_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  customizations: {
    removed_ingredients?: string[];
    added_modifiers?: Record<string, string[]>;
    additions?: ApiSelectedExtra[];
    sides?: ApiSelectedExtra[];
    drinks?: ApiSelectedExtra[];
    special_instructions?: string | null;
    extra_price: number;
  } | null;
}

export interface ApiOrder {
  id: string;
  order_id: string;
  customer_name: string;
  address: string;
  phone: string;
  notes: string | null;
  zone: string | null;
  status: string;
  total: number;
  delivery_fee: number;
  courier_id: string | null;
  items: ApiOrderItem[];
  received_at: string;
  status_entered_at: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  position: number;
  image: string | null;
  restaurant_id: string;
  product_count: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string;
  description: string;
  image: string;
  available: boolean;
  restaurant_id: string;
  ingredients?: Array<{ id: string; name: string; available: boolean }>;
  modifier_groups?: Array<{
    id: string;
    name: string;
    min_selections: number;
    max_selections: number;
    options: Array<{
      id: string;
      name: string;
      price_extra: number;
      available: boolean;
    }>;
  }>;
}

export interface ApiPromotion {
  id: string;
  name: string;
  discount_percent: number;
  product_ids: string[];
  start_date: string;
  end_date: string;
  active: boolean;
  restaurant_id: string;
}

export interface ApiAvailableCourier {
  id: string;
  name: string;
  vehicle: string | null;
  average_rating: number;
  active_orders: number;
  can_take_batch: boolean;
}

export interface ApiActiveDeliveryOrder {
  order_id: string;
  customer_name: string;
  address: string;
  zone: string;
  status: string;
  delivery_fee: number;
}

export interface ApiActiveDeliveryGroup {
  courier_id: string;
  courier_name: string;
  vehicle: string | null;
  average_rating: number;
  orders: ApiActiveDeliveryOrder[];
  total_delivery_pay: number;
  zones: string[];
}

export interface ApiDispatchRecord {
  order_id: string;
  customer_name: string;
  total: number;
  delivery_fee: number;
  courier_id: string;
  courier_name: string;
  dispatched_at: string;
}

export interface ApiDispatchSummary {
  today: number;
  month: number;
  year: number;
}

export interface ApiUploadResult {
  url: string;
  width: number;
  height: number;
}
