import { ApiError } from "./errors";

export interface FormErrorResult {
  formError?: string;
  fieldErrors?: Record<string, string>;
}

export function mapApiErrorToForm(error: unknown): FormErrorResult {
  if (!(error instanceof ApiError)) {
    return { formError: "Error inesperado. Intenta de nuevo." };
  }

  if (error.code === "PROFILE_UPDATE_FORBIDDEN") {
    return { formError: "Los administradores solo pueden cambiar su contraseña." };
  }

  if (error.details?.length) {
    const fieldErrors: Record<string, string> = {};
    for (const detail of error.details) {
      const isEmailTaken =
        detail.field === "email" &&
        /email ya est[aá] registrado/i.test(detail.message);
      fieldErrors[detail.field] = isEmailTaken
        ? "Este correo ya está en uso. Inicia sesión o usa otro email."
        : detail.message;
    }
    return { fieldErrors };
  }

  // Email ya registrado (409) sin details: mostrar en el campo email.
  if (
    error.code === "CONFLICT" ||
    /email ya est[aá] registrado/i.test(error.message)
  ) {
    return {
      fieldErrors: {
        email: "Este correo ya está en uso. Inicia sesión o usa otro email.",
      },
    };
  }

  return { formError: error.message };
}
