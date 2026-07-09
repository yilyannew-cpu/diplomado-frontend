import { useCallback, useEffect, useState } from "react";
import { operationsApi } from "@/lib/api/endpoints/operations";
import { ApiError } from "@/lib/api/errors";
import type { DashboardMetrics, SystemStatus } from "@/lib/api/types/operations";

export function useSuperadminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, systemRes] = await Promise.all([
        operationsApi.getDashboardMetrics(),
        operationsApi.getSystemStatus(),
      ]);
      setMetrics(dashboardRes);
      setSystem(systemRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { metrics, system, loading, error, refresh };
}
