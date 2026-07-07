import { useCallback, useEffect, useMemo, useState } from "react";
import { usersApi } from "@/lib/api/endpoints/users";
import { mapApiErrorToForm } from "@/lib/api/mapApiErrorToForm";
import type { PendingUser, Role } from "@/lib/api/types";

const APPROVAL_ROLES: Role[] = ["admin", "domiciliario"];

function isApprovalCandidate(user: PendingUser): boolean {
  return APPROVAL_ROLES.includes(user.role) && user.status === "Pendiente";
}

export function usePendingApprovals() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.listPending();
      setPending(data.filter(isApprovalCandidate));
    } catch (err) {
      const mapped = mapApiErrorToForm(err);
      setError(mapped.formError ?? "No se pudo cargar la cola de aprobación");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const restaurantPending = useMemo(
    () => pending.filter((user) => user.role === "admin"),
    [pending],
  );

  const courierPending = useMemo(
    () => pending.filter((user) => user.role === "domiciliario"),
    [pending],
  );

  const approve = useCallback(
    async (id: string, userName: string) => {
      setActionId(id);
      setError(null);
      setSuccessMessage(null);
      try {
        await usersApi.approve(id);
        setSuccessMessage(`${userName} fue aprobado. Ya puede iniciar sesión.`);
        await refresh();
      } catch (err) {
        const mapped = mapApiErrorToForm(err);
        setError(mapped.formError ?? "No se pudo aprobar la solicitud");
      } finally {
        setActionId(null);
      }
    },
    [refresh],
  );

  const reject = useCallback(
    async (id: string, userName: string, reason?: string) => {
      setActionId(id);
      setError(null);
      setSuccessMessage(null);
      try {
        await usersApi.reject(id, reason?.trim() || undefined);
        setSuccessMessage(`Solicitud de ${userName} rechazada.`);
        await refresh();
      } catch (err) {
        const mapped = mapApiErrorToForm(err);
        setError(mapped.formError ?? "No se pudo rechazar la solicitud");
      } finally {
        setActionId(null);
      }
    },
    [refresh],
  );

  return {
    pending,
    restaurantPending,
    courierPending,
    pendingCount: pending.length,
    loading,
    error,
    successMessage,
    actionId,
    refresh,
    approve,
    reject,
    clearSuccess: () => setSuccessMessage(null),
  };
}

export type PendingApprovalsState = ReturnType<typeof usePendingApprovals>;
