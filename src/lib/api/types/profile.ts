import type { Role, UserStatus } from "@/lib/api/types";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  status: UserStatus;
  restaurant_id?: string;
  vehicle?: string;
  document_id?: string | null;
  avatar?: string | null;
}

export interface UpdateProfileBody {
  email?: string;
  phone?: string;
}

export interface ChangePasswordBody {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface MeResponse {
  user: UserProfile;
}

export interface UpdateProfileResponse {
  user: UserProfile;
}

export interface ChangePasswordResponse {
  user: UserProfile;
  message: string;
}
