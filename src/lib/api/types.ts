export type Role = "cliente" | "admin" | "superadmin" | "domiciliario";

export type UserStatus = "Activo" | "Pendiente" | "Suspendido" | "Rechazado";

export type VehicleType = "Moto" | "Bici" | "Automóvil" | "Otro";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  vehicle?: string | null;
  document_id?: string | null;
  avatar?: string | null;
  status: UserStatus;
  restaurant_id?: string | null;
  created_at?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterClientPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
}

export interface RegisterRestaurantPayload {
  owner_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  restaurant_name: string;
  tagline?: string;
  city: string;
  address: string;
  delivery_minutes?: number;
}

export interface RegisterCourierPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  document_id: string;
  vehicle_type: VehicleType;
  vehicle_plate: string;
  vehicle_description?: string;
}

export interface PendingRegistrationResponse {
  message: string;
  data: {
    user_id: string;
    restaurant_id?: string;
    status: UserStatus;
  };
}

export interface RestaurantSummary {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
}

export interface PendingUser extends User {
  restaurant?: RestaurantSummary | null;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  vehicle?: string;
  restaurant_id?: string;
  status?: UserStatus;
}
