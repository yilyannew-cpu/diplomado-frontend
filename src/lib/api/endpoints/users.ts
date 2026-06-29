import { apiClient } from "@/lib/api/client";
import type { CreateUserPayload, PendingUser, User } from "@/lib/api/types";

type UsersListResponse = { data: User[] } | User[];
type PendingListResponse = { data: PendingUser[] } | PendingUser[];

function unwrapList(payload: UsersListResponse): User[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

function unwrapPendingList(payload: PendingListResponse): PendingUser[] {
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

export const usersApi = {
  listPending(): Promise<PendingUser[]> {
    return apiClient<PendingListResponse>("/users/pending", { auth: true }).then(unwrapPendingList);
  },

  list(params?: { role?: string; status?: string; q?: string }): Promise<User[]> {
    const search = new URLSearchParams();
    if (params?.role) search.set("role", params.role);
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    const query = search.toString();
    const path = query ? `/users?${query}` : "/users";
    return apiClient<UsersListResponse>(path, { auth: true }).then(unwrapList);
  },

  approve(id: string): Promise<{ message: string; data: { id: string; status: string } }> {
    return apiClient(`/users/${id}/approve`, { method: "PATCH", auth: true });
  },

  reject(id: string, reason?: string): Promise<{ message: string; data: { id: string; status: string } }> {
    return apiClient(`/users/${id}/reject`, {
      method: "PATCH",
      auth: true,
      body: reason ? { reason } : undefined,
    });
  },

  create(payload: CreateUserPayload): Promise<{ data: User } | User> {
    return apiClient("/users", { method: "POST", auth: true, body: payload });
  },
};
