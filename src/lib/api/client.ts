import { ApiError } from "./errors";

export const TOKEN_KEY = "ffcore_token";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

type ApiErrorBody = {
  error?: string;
  message?: string;
  details?: Array<{ field: string; message: string }>;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getApiUrl(): string {
  return API_URL;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let payload: ApiErrorBody = {};
    try {
      payload = (await response.json()) as ApiErrorBody;
    } catch {
      /* respuesta no JSON */
    }

    throw new ApiError(
      response.status,
      payload.error ?? "UNKNOWN_ERROR",
      payload.message ?? response.statusText,
      payload.details,
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}
