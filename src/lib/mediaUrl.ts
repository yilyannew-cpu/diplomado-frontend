import { getSocketUrl } from "@/lib/api/client";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

const UPLOAD_HOST_RE = /^https?:\/\/(?:ffcore-api\.onrender\.com|localhost:\d+)(\/uploads\/.+)$/i;
const API_ORIGIN = "https://ffcore-api.onrender.com";

/** Normaliza URLs de imagen para <img src> (proxy en dev, https en prod). */
export function resolveMediaUrl(image: string | null | undefined): string {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith("data:")) return image;

  const absoluteMatch = image.match(UPLOAD_HOST_RE);
  if (absoluteMatch) {
    return toUploadsUrl(absoluteMatch[1]);
  }

  if (image.startsWith("/uploads/")) {
    return toUploadsUrl(image);
  }

  if (image.startsWith("http://")) {
    return `https://${image.slice("http://".length)}`;
  }

  return image;
}

/**
 * URL absoluta válida para enviar al API (nunca data: ni rutas relativas).
 * Las data: deben subirse por multipart antes.
 */
export function toApiImageUrl(image: string | null | undefined): string {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith("data:")) return PLACEHOLDER_IMAGE;

  const absoluteMatch = image.match(UPLOAD_HOST_RE);
  if (absoluteMatch) {
    return `${API_ORIGIN}${absoluteMatch[1]}`;
  }

  if (image.startsWith("/uploads/")) {
    return `${API_ORIGIN}${image}`;
  }

  if (image.startsWith("http://")) {
    return `https://${image.slice("http://".length)}`;
  }

  if (image.startsWith("https://")) return image;

  return PLACEHOLDER_IMAGE;
}

function toUploadsUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const apiOrigin = getSocketUrl();

  if (apiOrigin && typeof window !== "undefined" && apiOrigin === window.location.origin) {
    return path;
  }

  if (apiOrigin.startsWith("http")) {
    return `${apiOrigin}${path}`;
  }

  return path;
}

export { PLACEHOLDER_IMAGE };

export async function compressDataUrl(
  dataUrl: string,
  options: { maxWidth?: number; quality?: number } = {},
): Promise<string> {
  const maxWidth = options.maxWidth ?? 960;
  const quality = options.quality ?? 0.72;

  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
    img.src = dataUrl;
  });
}

/** Convierte data URL a File para multipart (evita JSON gigante que tumba el API). */
export async function dataUrlToFile(dataUrl: string, filename = "product.jpg"): Promise<File> {
  const compressed = await compressDataUrl(dataUrl);
  const response = await fetch(compressed);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const safeName = filename.endsWith(".jpg") || filename.endsWith(".png") || filename.endsWith(".webp")
    ? filename
    : `${filename}.jpg`;
  return new File([blob], safeName, { type });
}
