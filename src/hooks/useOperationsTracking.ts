import { useCallback, useEffect, useRef, useState } from "react";
import { operationsApi } from "@/lib/api/endpoints/operations";
import { ApiError } from "@/lib/api/errors";
import type {
  ActiveCourier,
  ApiOrderStatus,
  OperationsMetrics,
  OperationsOrderFilter,
  OrderSummary,
} from "@/lib/api/types/operations";

export type OrderFilter = OperationsOrderFilter;

const POLL_MS = 60_000;

function toApiStatus(filter: OrderFilter): ApiOrderStatus | undefined {
  return filter === "activos" ? undefined : filter;
}

export function useOperationsTracking(orderFilter: OrderFilter = "activos") {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [couriers, setCouriers] = useState<ActiveCourier[]>([]);
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef(orderFilter);
  filterRef.current = orderFilter;

  const loadSnapshot = useCallback(async (opts?: { force?: boolean; silent?: boolean }) => {
    const force = opts?.force === true;
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const status = toApiStatus(filterRef.current);
      const [ordersRes, couriersRes, metricsRes] = await Promise.all([
        operationsApi.listOrders(status, { force }),
        operationsApi.listActiveCouriers({ force }),
        operationsApi.getOperationsMetrics({ force }),
      ]);
      setOrders(ordersRes);
      setCouriers(couriersRes);
      setMetrics(metricsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar seguimiento");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadOrdersOnly = useCallback(async (filter: OrderFilter) => {
    setLoading(true);
    setError(null);
    try {
      const ordersRes = await operationsApi.listOrders(toApiStatus(filter), { force: true });
      setOrders(ordersRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + poll suave (métricas/couriers/pedidos del filtro actual).
  useEffect(() => {
    void loadSnapshot();
    const id = window.setInterval(() => void loadSnapshot({ silent: true }), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadSnapshot]);

  // Cambio de filtro: solo pedidos (sin volver a pegarle a /couriers y /metrics).
  const skipFilterFetch = useRef(true);
  useEffect(() => {
    if (skipFilterFetch.current) {
      skipFilterFetch.current = false;
      return;
    }
    void loadOrdersOnly(orderFilter);
  }, [orderFilter, loadOrdersOnly]);

  const refresh = useCallback(() => loadSnapshot({ force: true }), [loadSnapshot]);

  return { orders, couriers, metrics, loading, error, refresh };
}
