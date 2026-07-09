import { useCallback, useEffect, useState } from "react";
import { operationsApi } from "@/lib/api/endpoints/operations";
import { ApiError } from "@/lib/api/errors";
import type {
  ActiveCourier,
  OperationsMetrics,
  OrderStatus,
  OrderSummary,
} from "@/lib/api/types/operations";

export type OrderFilter = "activos" | OrderStatus;

export function useOperationsTracking(orderFilter: OrderFilter = "activos") {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [couriers, setCouriers] = useState<ActiveCourier[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = orderFilter === "activos" ? undefined : orderFilter;
      const [ordersRes, couriersRes, metricsRes] = await Promise.all([
        operationsApi.listOrders(status),
        operationsApi.listActiveCouriers(),
        operationsApi.getOperationsMetrics(),
      ]);
      setOrders(ordersRes);
      setCouriers(couriersRes);
      setMetrics(metricsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar seguimiento");
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, couriers, metrics, loading, error, refresh };
}
