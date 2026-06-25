import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const BRAND_SLOGAN = {
  headline: "¿Se te antoja?",
  tagline: "¡Te lo llevamos al toque!",
} as const;

interface BrandLogoProps {
  className?: string;
  linkTo?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  /** Solo muestra el icono B, sin nombre */
  iconOnly?: boolean;
  /** Solo icono en pantallas muy pequeñas (oculta nombre) */
  compact?: boolean;
}

const sizeStyles = {
  sm: {
    icon: "size-9 text-lg rounded-xl",
    name: "text-base",
  },
  md: {
    icon: "size-9 text-lg rounded-xl",
    name: "text-lg",
  },
  lg: {
    icon: "size-11 text-xl rounded-2xl",
    name: "text-2xl",
  },
};

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
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-primary font-display font-semibold text-primary-foreground",
          s.icon,
        )}
      >
        B
      </span>
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          s.name,
          isLight ? "text-cream" : "text-foreground",
          iconOnly && "sr-only",
          !iconOnly && compact && "hidden min-[380px]:inline",
        )}
      >
        BurgerCore
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
