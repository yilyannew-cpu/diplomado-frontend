import type { ApiErrorDetail } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email o contraseña incorrectos",
  PENDING_APPROVAL: "Cuenta pendiente de aprobación",
  ACCOUNT_SUSPENDED: "Cuenta suspendida",
  REGISTRATION_REJECTED: "Solicitud rechazada",
};

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return LOGIN_ERROR_MESSAGES[error.code] ?? error.message;
  }
  return "No se pudo iniciar sesión. Intenta de nuevo.";
}
