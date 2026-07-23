import { formatCOP } from "@/context/OrderContext";
import { resolveMediaUrl, PLACEHOLDER_IMAGE } from "@/lib/mediaUrl";
import { formatCustomizationLines, getOrderItemLineKey, getOrderItemUnitPrice } from "@/lib/orderCustomizations";
import type { MenuItem } from "@/types/menu";
import type { OrderItem } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderItemLinesProps {
  items: OrderItem[];
  menu: MenuItem[];
  compact?: boolean;
  showPrices?: boolean;
  /** Miniaturas del producto (panel domiciliario / detalle). */
  showImages?: boolean;
  className?: string;
  itemClassName?: string;
  customizationClassName?: string;
}

function resolveProductLabel(item: OrderItem, product?: MenuItem) {
  const rawName = item.productName?.trim() || product?.name?.trim() || "";
  const looksLikeId =
    !rawName ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName);
  return looksLikeId ? "Producto" : rawName;
}

function resolveProductImage(item: OrderItem, product?: MenuItem) {
  const src = item.productImage?.trim() || product?.image?.trim() || "";
  if (!src) return PLACEHOLDER_IMAGE;
  return resolveMediaUrl(src) || PLACEHOLDER_IMAGE;
}

export function OrderItemLines({
  items,
  menu,
  compact = false,
  showPrices = false,
  showImages = false,
  className,
  itemClassName,
  customizationClassName,
}: OrderItemLinesProps) {
  return (
    <ul className={cn(showImages ? "space-y-3" : "space-y-1.5", className)}>
      {items.map((item, index) => {
        const product = menu.find((m) => m.id === item.productId);
        const productName = resolveProductLabel(item, product);
        const specialInstructions = item.customizations?.specialInstructions?.trim();
        const customizationLines = formatCustomizationLines({
          ...item.customizations,
          specialInstructions: undefined,
          extraPrice: item.customizations?.extraPrice ?? 0,
        });
        const unitPrice = getOrderItemUnitPrice(
          product?.price ?? 0,
          item.customizations,
        );

        if (showImages) {
          const imageSrc = resolveProductImage(item, product);
          return (
            <li
              key={getOrderItemLineKey(item, index)}
              className={cn("flex gap-3", itemClassName)}
            >
              <img
                src={imageSrc}
                alt={productName}
                className="size-14 shrink-0 rounded-xl border border-border object-cover bg-secondary/40"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-sm font-bold leading-snug text-foreground">
                    <span className="font-mono text-primary">{item.quantity}×</span>{" "}
                    {productName}
                  </p>
                  {showPrices && (
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs font-medium text-muted-foreground tabular-nums">
                      {formatCOP(unitPrice * item.quantity)}
                    </span>
                  )}
                </div>
                {customizationLines.length > 0 && (
                  <ul className={cn("mt-1 space-y-0.5", customizationClassName)}>
                    {customizationLines.map((line) => (
                      <li
                        key={line}
                        className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800"
                      >
                        <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                        <span className="min-w-0 break-words">{line}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {specialInstructions ? (
                  <p className="mt-1 min-w-0 break-words border-l-2 border-amber-500/70 pl-2 text-[11px] leading-snug text-amber-900" role="note">
                    <span className="font-semibold">Instrucción:</span> {specialInstructions}
                  </p>
                ) : null}
              </div>
            </li>
          );
        }

        return (
          <li key={getOrderItemLineKey(item, index)} className={itemClassName}>
            <div
              className={cn(
                "min-w-0 break-words font-bold leading-snug",
                itemClassName,
                compact ? "text-sm" : "text-sm sm:text-base",
              )}
            >
              <span className="font-mono text-primary">{item.quantity}×</span>{" "}
              {productName}
              {showPrices && (
                <span className="ml-2 whitespace-nowrap font-mono text-xs font-medium text-muted-foreground tabular-nums">
                  {formatCOP(unitPrice * item.quantity)}
                </span>
              )}
            </div>
            {customizationLines.length > 0 && (
              <ul className={cn("mt-1 space-y-1.5", customizationClassName)}>
                {customizationLines.map((line) => (
                  <li
                    key={line}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
                      compact ? "text-amber-700" : "text-amber-800",
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span className="min-w-0 break-words">{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {specialInstructions ? (
              <p
                className={cn(
                  "mt-1 min-w-0 break-words border-l-2 border-amber-500/70 pl-2 leading-snug text-amber-900",
                  compact ? "text-[11px]" : "text-xs",
                )}
                role="note"
              >
                <span className="font-semibold">Instrucción:</span> {specialInstructions}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
