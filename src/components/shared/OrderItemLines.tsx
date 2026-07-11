import { formatCOP } from "@/context/OrderContext";
import { formatCustomizationLines, getOrderItemLineKey, getOrderItemUnitPrice } from "@/lib/orderCustomizations";
import type { MenuItem } from "@/mocks/menuMock";
import type { OrderItem } from "@/mocks/ordersMock";
import { cn } from "@/lib/utils";

interface OrderItemLinesProps {
  items: OrderItem[];
  menu: MenuItem[];
  compact?: boolean;
  showPrices?: boolean;
  className?: string;
  itemClassName?: string;
  customizationClassName?: string;
}

export function OrderItemLines({
  items,
  menu,
  compact = false,
  showPrices = false,
  className,
  itemClassName,
  customizationClassName,
}: OrderItemLinesProps) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item, index) => {
        const product = menu.find((m) => m.id === item.productId);
        const productName = item.productName?.trim() || product?.name || item.productId;
        const specialInstructions = item.customizations?.specialInstructions?.trim();
        const customizationLines = formatCustomizationLines({
          ...item.customizations,
          specialInstructions: undefined,
          extraPrice: item.customizations?.extraPrice ?? 0,
        });
        const unitPrice = getOrderItemUnitPrice(product?.price ?? 0, item.customizations);

        return (
          <li key={getOrderItemLineKey(item, index)} className={itemClassName}>
            <div
              className={cn(
                "font-bold leading-snug",
                itemClassName,
                compact ? "text-sm" : "text-sm sm:text-base",
              )}
            >
              <span className="font-mono text-primary">{item.quantity}×</span>{" "}
              {productName}
              {showPrices && (
                <span className="ml-2 font-mono text-xs font-medium text-muted-foreground tabular-nums">
                  {formatCOP(unitPrice * item.quantity)}
                </span>
              )}
            </div>
            {customizationLines.length > 0 && (
              <ul className={cn("mt-1 space-y-0.5", customizationClassName)}>
                {customizationLines.map((line) => (
                  <li
                    key={line}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
                      compact ? "text-amber-700" : "text-amber-800",
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            )}
            {specialInstructions ? (
              <p
                className={cn(
                  "mt-1 border-l-2 border-amber-500/70 pl-2 leading-snug text-amber-900",
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
