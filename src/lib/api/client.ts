import { ApiError } from "./errors";

export const TOKEN_KEY = "ffcore_token";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? "https://ffcore-api.onrender.com/api/v1"
    : "http://localhost:3000/api/v1");

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

type UploadOptions = {
  auth?: boolean;
};

export function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function authHeaders(auth: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

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

/** URL base para Socket.IO (mismo origen en dev con proxy de Vite). */
export function getSocketUrl(): string {
  const api = getApiUrl();
  if (api.startsWith("http://") || api.startsWith("https://")) {
    return api.replace(/\/api\/v1\/?$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://ffcore-api.onrender.com";
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
    cache: "no-store",
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

export async function apiDownload(path: string, options: RequestOptions = {}): Promise<Blob> {
  const { method = "GET", auth = false } = options;
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: authHeaders(auth),
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

  return response.blob();
}

export async function apiUpload<T>(path: string, file: File, options: UploadOptions = {}): Promise<T> {
  const { auth = false } = options;
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(auth),
    body: formData,
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

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
