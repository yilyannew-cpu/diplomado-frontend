import { formatCOP } from "@/context/OrderContext";
import type { ProductPricing } from "@/lib/promotions";

interface ProductPriceDisplayProps {
  pricing: ProductPricing;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

export function ProductPriceDisplay({
  pricing,
  size = "md",
  align = "right",
}: ProductPriceDisplayProps) {
  const sizeClass =
    size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-sm";

  if (!pricing.hasPromotion) {
    return (
      <span className={`font-mono font-semibold tabular-nums text-primary ${sizeClass}`}>
        {formatCOP(pricing.originalPrice)}
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <span className="text-[11px] text-muted-foreground line-through">
        {formatCOP(pricing.originalPrice)}
      </span>
      <span className={`font-mono font-bold tabular-nums text-primary ${sizeClass}`}>
        {formatCOP(pricing.salePrice)}
      </span>
    </div>
  );
}

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
      -{percent}%
    </span>
  );
}
