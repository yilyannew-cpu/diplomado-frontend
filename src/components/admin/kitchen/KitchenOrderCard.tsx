import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { OrderSpecialInstructions } from "@/components/shared/OrderSpecialInstructions";
import { formatCOP, useOrders } from "@/context/OrderContext";
import { useKitchenTick } from "@/hooks/useKitchenTick";
import {
  getElapsedMinutes,
  getSlaLevel,
  slaCardBorderClass,
} from "@/lib/kitchenSla";
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
  const { menu } = useOrders();
  const now = useKitchenTick();
  const [metaOpen, setMetaOpen] = useState(false);
  const minutes = getElapsedMinutes(order, now);
  const slaLevel = getSlaLevel(minutes);

  return (
    <article
      className={`rounded-2xl border bg-card shadow-sm transition-all duration-300 ${slaCardBorderClass(slaLevel)} ${compact ? "p-3" : "p-4"}`}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <p className="font-mono text-[11px] font-semibold text-muted-foreground">{order.id}</p>
        <KitchenSlaTimer order={order} now={now} />
      </header>

      <ul className={`mb-3 space-y-1.5 ${compact ? "text-sm" : "text-base"}`}>
        {order.items.map((item) => {
          const product = menu.find((m) => m.id === item.productId);
          return (
            <li key={item.productId} className="font-bold leading-snug text-foreground">
              <span className="font-mono text-primary">{item.quantity}×</span>{" "}
              {product?.name ?? item.productId}
            </li>
          );
        })}
      </ul>

      {order.notes ? <OrderSpecialInstructions notes={order.notes} compact={compact} /> : null}

      <button
        type="button"
        onClick={() => setMetaOpen((open) => !open)}
        className="flex w-full items-center gap-1 text-[10px] text-gray-400 transition-colors hover:text-muted-foreground"
        aria-expanded={metaOpen}
      >
        <ChevronDown
          className={`size-3 transition-transform duration-300 ${metaOpen ? "rotate-180" : ""}`}
        />
        {metaOpen ? "Ocultar datos del cliente" : "Ver datos del cliente"}
      </button>

      {metaOpen ? (
        <div className="mt-2 space-y-0.5 border-t border-border/50 pt-2 text-[10px] text-gray-400">
          <p>{order.customerName}</p>
          <p className="leading-relaxed">{order.address}</p>
          <p>{order.createdAt}</p>
        </div>
      ) : null}

      <div
        className={`flex flex-col gap-2 ${metaOpen ? "mt-3" : "mt-2"} sm:flex-row sm:items-center sm:justify-between`}
      >
        {!compact ? (
          <span className="font-mono text-xs font-medium text-gray-400 tabular-nums">
            {formatCOP(order.total)}
          </span>
        ) : null}
        {onAdvance && actionLabel ? (
          <button
            type="button"
            onClick={onAdvance}
            className="w-full rounded-lg bg-ink px-3 py-2 text-[11px] font-semibold text-cream transition-all duration-300 hover:bg-primary sm:w-auto sm:py-1.5"
          >
            {actionLabel} →
          </button>
        ) : null}
      </div>
    </article>
  );
}
