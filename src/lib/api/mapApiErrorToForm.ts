import { ApiError } from "./errors";

export interface FormErrorResult {
  formError?: string;
  fieldErrors?: Record<string, string>;
}

export function mapApiErrorToForm(error: unknown): FormErrorResult {
  if (!(error instanceof ApiError)) {
    return { formError: "Error inesperado. Intenta de nuevo." };
  }

  if (error.code === "VALIDATION_ERROR" && error.details?.length) {
    const fieldErrors: Record<string, string> = {};
    for (const detail of error.details) {
      fieldErrors[detail.field] = detail.message;
    }
    return { fieldErrors };
  }

  return { formError: error.message };
}
