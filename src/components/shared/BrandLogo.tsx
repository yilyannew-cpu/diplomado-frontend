import { Link } from "@tanstack/react-router";
import { useId } from "react";
import { cn } from "@/lib/utils";

export const BRAND_SLOGAN = {
  headline: "¿Se te antoja?",
  tagline: "¡Te lo llevamos al toque!",
} as const;

/** Azul del círculo + anillo neón de la marca (referencia FFCore). */
export const BRAND_MARK_BLUE = "#2563EB";
export const BRAND_MARK_GLOW = "#FF4D00";

interface BrandLogoProps {
  className?: string;
  linkTo?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  /** Solo muestra el icono FF, sin nombre */
  iconOnly?: boolean;
  /** Solo icono en pantallas muy pequeñas (oculta nombre) */
  compact?: boolean;
}

const sizeStyles = {
  sm: {
    mark: "size-9",
    name: "text-base",
  },
  md: {
    mark: "size-10",
    name: "text-lg",
  },
  lg: {
    mark: "size-12",
    name: "text-2xl",
  },
};

/**
 * Marca gráfica: círculo azul + FF + anillo neón naranja/rojo.
 * Misma composición en UI y favicon.
 */
export function BrandMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const neonId = `ffcore-neon-${uid}`;
  const haloId = `ffcore-halo-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FF"
      className={cn("shrink-0 overflow-visible", className)}
    >
      <defs>
        <filter id={neonId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor={BRAND_MARK_GLOW} stopOpacity="0" />
          <stop offset="78%" stopColor={BRAND_MARK_GLOW} stopOpacity="0.35" />
          <stop offset="100%" stopColor={BRAND_MARK_GLOW} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo exterior suave */}
      <circle cx="32" cy="32" r="31" fill={`url(#${haloId})`} />

      {/* Anillo neón (gap respecto al círculo azul) */}
      <circle
        cx="32"
        cy="32"
        r="27.5"
        fill="none"
        stroke={BRAND_MARK_GLOW}
        strokeWidth="2.25"
        filter={`url(#${neonId})`}
        opacity="0.95"
      />

      {/* Círculo principal */}
      <circle cx="32" cy="32" r="22" fill={BRAND_MARK_BLUE} />

      {/* FF */}
      <text
        x="32"
        y="38.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="-0.04em"
        fill="#FFFFFF"
      >
        FF
      </text>
    </svg>
  );
}

export function BrandLogo({
  className,
  linkTo = "/",
  size = "md",
  variant = "dark",
  iconOnly = false,
  compact = false,
}: BrandLogoProps) {
  const s = sizeStyles[size];
  const isLight = variant === "light";

  const content = (
    <>
      <BrandMark className={s.mark} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          s.name,
          isLight ? "text-cream drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]" : "text-foreground",
          iconOnly && "sr-only",
          !iconOnly && compact && "hidden min-[380px]:inline",
        )}
      >
        FFCore
      </span>
    </>
  );

  const wrapperClass = cn("flex items-center gap-2.5", className);

  if (linkTo) {
    return (
      <Link to={linkTo} className={cn(wrapperClass, "transition-opacity hover:opacity-90")}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
