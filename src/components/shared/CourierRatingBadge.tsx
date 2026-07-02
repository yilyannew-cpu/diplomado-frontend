import { Star } from "lucide-react";
import type { CourierRatingSummary } from "@/lib/courierRatings";

interface CourierRatingBadgeProps extends CourierRatingSummary {
  className?: string;
}

export function CourierRatingBadge({
  averageRating,
  reviewCount,
  className = "",
}: CourierRatingBadgeProps) {
  if (reviewCount === 0) {
    return (
      <span className={`text-[10px] text-muted-foreground ${className}`.trim()}>
        Sin reseñas
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`.trim()}
      title={`${reviewCount} reseña${reviewCount !== 1 ? "s" : ""} de clientes`}
      aria-label={`Calificación ${averageRating} de 5 basada en ${reviewCount} reseñas`}
    >
      <Star className="size-3 fill-amber-brand text-amber-brand" aria-hidden />
      <span className="text-xs font-semibold tabular-nums text-amber-brand">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-[10px] text-muted-foreground">
        ({reviewCount} reseña{reviewCount !== 1 ? "s" : ""})
      </span>
    </span>
  );
}
