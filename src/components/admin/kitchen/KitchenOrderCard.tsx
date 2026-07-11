import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { OrderItemLines } from "@/components/shared/OrderItemLines";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP, useOrders } from "@/context/OrderContext";
import { useKitchenOrderSla } from "@/hooks/useKitchenOrderSla";
import { slaCardBorderClass } from "@/lib/kitchenSla";
import { cn } from "@/lib/utils";
import type { Order } from "@/mocks/ordersMock";
import { KitchenSlaTimer } from "./KitchenSlaTimer";

interface KitchenOrderCardProps {
  order: Order;
  actionLabel?: string;
  onAdvance?: () => void;
  compact?: boolean;
}

export function KitchenOrderCard({
  order,
  actionLabel,
  onAdvance,
  compact = false,
}: KitchenOrderCardProps) {
  const { menu: adminMenu } = useAdmin();
  const { menu: clientMenu } = useOrders();
  const menu = adminMenu.length > 0 ? adminMenu : clientMenu;
  const { now, level, isDelayed } = useKitchenOrderSla(order);
  const [metaOpen, setMetaOpen] = useState(false);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card shadow-sm transition-all duration-300",
        slaCardBorderClass(level),
        compact ? "p-3" : "p-3 sm:p-4",
      )}
    >
      <header className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
        <div className="flex min-w-0 items-center gap-2">
          <p
            className={cn(
              "font-mono text-[11px] font-semibold",
              isDelayed ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {order.id}
          </p>
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground md:hidden">
            {itemCount} ítem{itemCount !== 1 ? "s" : ""}
          </span>
        </div>
        <KitchenSlaTimer order={order} now={now} />
      </header>

      <OrderItemLines
        items={order.items}
        menu={menu}
        compact={compact}
        className={cn("mb-2 sm:mb-3", compact ? "text-sm" : "text-sm sm:text-base")}
      />

      <button
        type="button"
        onClick={() => setMetaOpen((open) => !open)}
        className="flex min-h-9 w-full items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        aria-expanded={metaOpen}
      >
        <ChevronDown
          className={cn("size-3 transition-transform duration-300", metaOpen && "rotate-180")}
        />
        {metaOpen ? "Ocultar cliente" : "Ver cliente y dirección"}
      </button>

      {metaOpen ? (
        <div className="mt-1.5 space-y-0.5 border-t border-border/50 pt-2 text-[10px] text-muted-foreground sm:mt-2">
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p className="leading-relaxed">{order.address}</p>
          <p>{order.createdAt}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-2 border-t border-border/40 pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:pt-3",
          metaOpen ? "mt-2" : "mt-1",
        )}
      >
        {!compact ? (
          <span className="hidden font-mono text-xs font-medium text-muted-foreground tabular-nums sm:inline">
            {formatCOP(order.total)}
          </span>
        ) : null}
        {onAdvance && actionLabel ? (
          <button
            type="button"
            onClick={onAdvance}
            className="min-h-11 w-full rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-cream transition-all duration-300 active:scale-[0.98] hover:bg-primary sm:min-h-0 sm:w-auto sm:rounded-lg sm:py-1.5 sm:text-[11px]"
          >
            {actionLabel} →
          </button>
        ) : null}
      </div>
    </article>
  );
}
