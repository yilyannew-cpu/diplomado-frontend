import { useCallback, useEffect, useMemo, useState } from "react";
import { usersApi } from "@/lib/api/endpoints/users";
import { ApiError } from "@/lib/api/errors";
import type { PendingUser, User } from "@/lib/api/types";

export type ApprovalHistoryFilter = "todos" | "aprobados" | "rechazados";

const APPROVAL_ROLES = new Set(["admin", "domiciliario"]);

function isApprovalRole(user: User | PendingUser): boolean {
  return APPROVAL_ROLES.has(user.role);
}

function filterByHistoryTab(users: User[], filter: ApprovalHistoryFilter): User[] {
  const approvalUsers = users.filter(isApprovalRole);

  if (filter === "aprobados") {
    return approvalUsers.filter((u) => u.status === "Activo");
  }
  if (filter === "rechazados") {
    return approvalUsers.filter((u) => u.status === "Rechazado");
  }
  return approvalUsers.filter((u) => u.status === "Activo" || u.status === "Rechazado");
}

export function useApprovalHistory(filter: ApprovalHistoryFilter) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (filter === "aprobados") {
        const data = await usersApi.list({ status: "Activo" });
        setUsers(filterByHistoryTab(data, "aprobados"));
        return;
      }
      if (filter === "rechazados") {
        const data = await usersApi.list({ status: "Rechazado" });
        setUsers(filterByHistoryTab(data, "rechazados"));
        return;
      }
      const [activos, rechazados] = await Promise.all([
        usersApi.list({ status: "Activo" }),
        usersApi.list({ status: "Rechazado" }),
      ]);
      const merged = [...activos, ...rechazados];
      const byId = new Map(merged.map((u) => [u.id, u]));
      setUsers(filterByHistoryTab([...byId.values()], "todos"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al cargar el historial");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const counts = useMemo(
    () => ({
      aprobados: users.filter((u) => u.status === "Activo").length,
      rechazados: users.filter((u) => u.status === "Rechazado").length,
    }),
    [users],
  );

  return { users, loading, error, refresh, counts };
}
