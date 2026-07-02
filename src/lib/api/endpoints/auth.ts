import { apiClient } from "@/lib/api/client";
import type {
  LoginResponse,
  PendingRegistrationResponse,
  RegisterClientPayload,
  RegisterCourierPayload,
  RegisterRestaurantPayload,
  User,
} from "@/lib/api/types";

function unwrapUser(payload: { user?: User } | User): User {
  if ("user" in payload && payload.user) return payload.user;
  return payload as User;
}

export const authApi = {
  health(): Promise<{ status?: string }> {
    return apiClient("/health");
  },

  login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    return apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },

  me(): Promise<User> {
    return apiClient<{ user: User } | User>("/auth/me", { auth: true }).then(unwrapUser);
  },

  logout(): Promise<void> {
    return apiClient<void>("/auth/logout", { method: "POST", auth: true });
  },

  registerClient(payload: RegisterClientPayload): Promise<LoginResponse> {
    return apiClient<LoginResponse>("/auth/register/client", {
      method: "POST",
      body: payload,
    });
  },

  registerRestaurant(payload: RegisterRestaurantPayload): Promise<PendingRegistrationResponse> {
    return apiClient<PendingRegistrationResponse>("/auth/register/restaurant", {
      method: "POST",
      body: payload,
    });
  },

  registerCourier(payload: RegisterCourierPayload): Promise<PendingRegistrationResponse> {
    return apiClient<PendingRegistrationResponse>("/auth/register/courier", {
      method: "POST",
      body: payload,
    });
  },
};
