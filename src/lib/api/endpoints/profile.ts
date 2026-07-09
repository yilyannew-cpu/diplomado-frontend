import { apiClient } from "@/lib/api/client";
import type {
  ChangePasswordBody,
  ChangePasswordResponse,
  MeResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  UserProfile,
} from "@/lib/api/types/profile";

export const profileApi = {
  getMe(): Promise<UserProfile> {
    return apiClient<MeResponse>("/auth/me", { auth: true }).then((res) => res.user);
  },

  updateProfile(body: UpdateProfileBody): Promise<UserProfile> {
    return apiClient<UpdateProfileResponse>("/auth/me", {
      method: "PATCH",
      auth: true,
      body,
    }).then((res) => res.user);
  },

  changePassword(body: ChangePasswordBody): Promise<ChangePasswordResponse> {
    return apiClient<ChangePasswordResponse>("/auth/me/password", {
      method: "PATCH",
      auth: true,
      body,
    });
  },
};
