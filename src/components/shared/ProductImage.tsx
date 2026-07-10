import { useState } from "react";
import { PLACEHOLDER_IMAGE, resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
};

/** Imagen de producto con fallback si el archivo ya no existe en Render. */
export function ProductImage({ src, alt, className, loading = "lazy" }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? PLACEHOLDER_IMAGE : resolveMediaUrl(src);

  return (
    <img
      src={resolved}
      alt={alt}
      className={cn(className)}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
