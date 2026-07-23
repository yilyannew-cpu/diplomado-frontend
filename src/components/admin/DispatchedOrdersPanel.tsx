import {
  CheckCircle2,
  ChevronDown,
  MapPin,
  Motorbike,
  PackageCheck,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ReadyDispatchColumn } from "@/components/admin/ReadyDispatchColumn";
import { KitchenOrderCard } from "@/components/admin/kitchen/KitchenOrderCard";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/context/AdminContext";
import { formatCOP } from "@/context/OrderContext";
import { getOrderDeliveryFee } from "@/lib/deliveryFees";
import { resolveLogoUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";
import { getOrderZone, groupOrdersByZone } from "@/lib/orderZones";
import type { MenuItem } from "@/types/menu";
import type { Order, OrderStatus } from "@/types/order";

interface DispatchedOrdersPanelProps {
  onDispatchBatch: (orders: Order[]) => void;
}

type ControlStage = "asignado" | "en_camino" | "entregado";

const STAGE_META: Record<
  ControlStage,
  { label: string; hint: string; accent: string; dot: string; icon: LucideIcon }
> = {
  asignado: {
    label: "Asignado",
    hint: "Con repartidor — esperando salida",
    accent: "border-emerald-500/25 bg-emerald-500/[0.04]",
    dot: "bg-emerald-500",
    icon: Motorbike,
  },
  en_camino: {
    label: "En camino",
    hint: "El domiciliario ya salió a entregar",
    accent: "border-primary/20 bg-primary/[0.04]",
    dot: "bg-primary",
    icon: Motorbike,
  },
  entregado: {
    label: "Entregado hoy",
    hint: "Cierre del ciclo — control del día",
    accent: "border-border bg-card",
    dot: "bg-muted-foreground",
    icon: CheckCircle2,
  },
};

function controlStageOf(order: Order): ControlStage {
  if (order.status === "Entregado") return "entregado";
  if (order.status === "En Camino" || order.status === "Recogido") return "en_camino";
  return "asignado";
}

function stageLabel(status: OrderStatus): string {
  if (status === "Entregado") return "Entregado";
  if (status === "En Camino" || status === "Recogido") return "En camino";
  return "Asignado";
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function orderMatchesDispatchSearch(
  order: Order,
  query: string,
  menuById: Map<string, MenuItem>,
): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;

  const haystack: string[] = [
    order.id,
    order.orderId ?? "",
    order.customerName,
    order.courierName ?? "",
    order.phone ?? "",
    order.address ?? "",
  ];

  for (const item of order.items) {
    haystack.push(item.productName ?? "");
    const product = menuById.get(item.productId);
    if (product?.name) haystack.push(product.name);

    const extras = [
      ...(item.customizations?.additions ?? []),
      ...(item.customizations?.sides ?? []),
      ...(item.customizations?.drinks ?? []),
    ];
    for (const extra of extras) {
      haystack.push(extra.name);
    }
  }

  return haystack.some((part) => normalizeSearch(part).includes(q));
}

/**
 * Tablero de control: pedidos con domiciliario, visibles por estado
 * (asignado → en camino → entregado hoy) con ficha completa.
 */
export function DispatchedOrdersPanel({ onDispatchBatch }: DispatchedOrdersPanelProps) {
  const { kitchenOrders, enRouteOrders, menu } = useAdmin();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const menuById = useMemo(
    () => new Map(menu.map((item) => [item.id, item])),
    [menu],
  );

  const assignedReady = useMemo(
    () =>
      kitchenOrders.filter(
        (order) => order.status === "Listo" && Boolean(order.deliveryPersonId),
      ),
    [kitchenOrders],
  );

  const inRoute = useMemo(
    () => enRouteOrders.filter((o) => o.status === "En Camino" || o.status === "Recogido"),
    [enRouteOrders],
  );

  const deliveredToday = useMemo(
    () => enRouteOrders.filter((o) => o.status === "Entregado"),
    [enRouteOrders],
  );

  const filteredAssigned = useMemo(
    () =>
      assignedReady.filter((order) =>
        orderMatchesDispatchSearch(order, deferredSearch, menuById),
      ),
    [assignedReady, deferredSearch, menuById],
  );

  const filteredInRoute = useMemo(
    () =>
      inRoute.filter((order) => orderMatchesDispatchSearch(order, deferredSearch, menuById)),
    [inRoute, deferredSearch, menuById],
  );

  const filteredDelivered = useMemo(
    () =>
      deliveredToday.filter((order) =>
        orderMatchesDispatchSearch(order, deferredSearch, menuById),
      ),
    [deliveredToday, deferredSearch, menuById],
  );

  const stages = useMemo(
    () =>
      [
        { key: "asignado" as const, orders: filteredAssigned },
        { key: "en_camino" as const, orders: filteredInRoute },
        { key: "entregado" as const, orders: filteredDelivered },
      ] as const,
    [filteredAssigned, filteredInRoute, filteredDelivered],
  );

  const totalAll = assignedReady.length + inRoute.length + deliveredToday.length;
  const totalFiltered =
    filteredAssigned.length + filteredInRoute.length + filteredDelivered.length;
  const hasQuery = normalizeSearch(deferredSearch).length > 0;

  if (totalAll === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center sm:p-12">
        <PackageCheck className="mx-auto size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-foreground">Sin pedidos en control</p>
        <p className="mt-2 text-xs text-muted-foreground text-pretty">
          Cuando asignes un domiciliario en comandas, el pedido quedará aquí para seguir su estado:
          asignado, en camino y entregado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-pretty">
          Control operativo de pedidos con repartidor. Observa en qué estado está cada uno hasta
          cerrar la entrega.
        </p>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por domiciliario, cliente o producto…"
            className="h-11 rounded-xl border-border bg-card pl-9 pr-10 text-sm"
            aria-label="Buscar pedidos despachados"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {hasQuery ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {totalFiltered === 0
              ? "Sin coincidencias"
              : `${totalFiltered} resultado${totalFiltered !== 1 ? "s" : ""}`}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {stages.map(({ key, orders }) => {
            const meta = STAGE_META[key];
            const Icon = meta.icon;
            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl border px-2.5 py-2.5 transition-colors sm:px-3",
                  meta.accent,
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
                  <Icon className="size-3.5 text-muted-foreground" />
                  <p className="truncate text-[11px] font-semibold sm:text-xs">{meta.label}</p>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums leading-none sm:text-xl">
                  {orders.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {hasQuery && totalFiltered === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No hay pedidos con ese criterio</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prueba con otro nombre de domiciliario, cliente o producto.
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-4 text-xs font-semibold text-primary hover:text-primary/80"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        stages.map(({ key, orders }) => {
          if (orders.length === 0) return null;
          const meta = STAGE_META[key];
          const Icon = meta.icon;

          return (
            <section key={key} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
                    <Icon className="size-4 text-muted-foreground" />
                    <h2 className="truncate text-sm font-semibold">{meta.label}</h2>
                  </div>
                  <p className="mt-0.5 pl-6 text-[11px] text-muted-foreground">{meta.hint}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium tabular-nums">
                  {orders.length}
                </span>
              </div>

              {key === "asignado" ? (
                <ReadyDispatchColumn
                  orders={orders}
                  onAssignZone={() => {
                    /* Ya tienen repartidor. */
                  }}
                  onDispatchBatch={onDispatchBatch}
                />
              ) : key === "entregado" ? (
                <DeliveredOrdersCompactList orders={orders} />
              ) : (
                <TrackedOrdersByZone orders={orders} />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function TrackedOrdersByZone({ orders }: { orders: Order[] }) {
  const byZone = useMemo(() => groupOrdersByZone(orders), [orders]);

  return (
    <div className="space-y-3">
      {byZone.map(({ zone, orders: zoneOrders }) => (
        <div
          key={zone}
          className="rounded-2xl border border-border/80 bg-card/60 p-2.5 shadow-sm sm:p-3"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                Zona
              </p>
              <h3 className="truncate text-sm font-semibold">{zone}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {zoneOrders.length} pedido{zoneOrders.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {zoneOrders.map((order) => (
              <TrackedOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Entregados: fila compacta (zona + cliente) con detalle expandible. */
function DeliveredOrdersCompactList({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-2">
      {orders.map((order) => (
        <DeliveredOrderCompactRow key={order.id} order={order} />
      ))}
    </div>
  );
}

function DeliveredOrderCompactRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const zone = order.zone?.trim() || getOrderZone(order.address);
  const deliveryFee = getOrderDeliveryFee(order);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40"
        aria-expanded={open}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Zona · {zone}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{order.customerName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Domicilio
          </p>
          <p className="font-mono text-xs font-semibold tabular-nums text-emerald-700">
            {formatCOP(deliveryFee)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Entregado
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border/60 bg-background/40 px-2.5 py-2.5 sm:px-3">
          <TrackedOrderCard order={order} />
        </div>
      ) : null}
    </div>
  );
}

const STAGE_ACTIVE_ANIMATION: Record<ControlStage, string> = {
  asignado: "animate-order-icon-delivery",
  en_camino: "animate-order-icon-delivery",
  entregado: "animate-order-icon-delivered",
};

function DispatchStatusStepper({ order }: { order: Order }) {
  const stage = controlStageOf(order);
  const steps: ControlStage[] = ["asignado", "en_camino", "entregado"];
  const activeIndex = steps.indexOf(stage);

  return (
    <div
      className="w-full"
      role="status"
      aria-live="polite"
      aria-label={`Estado actual: ${stageLabel(order.status)}`}
    >
      <ol className="flex w-full items-start">
        {steps.map((step, index) => {
          const meta = STAGE_META[step];
          const Icon = meta.icon;
          const completed = index < activeIndex;
          const active = index === activeIndex;
          const pending = index > activeIndex;
          const isLast = index === steps.length - 1;

          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    index === 0
                      ? "bg-transparent"
                      : completed || active
                        ? "bg-primary"
                        : "bg-border",
                  )}
                  aria-hidden
                />

                <span
                  className={cn(
                    "relative z-[1] grid size-9 shrink-0 place-items-center rounded-full border-2 transition-all duration-500",
                    active &&
                      "border-amber-brand bg-amber-brand/15 shadow-[0_0_14px_oklch(0.82_0.12_88/0.4)]",
                    completed && "border-primary bg-primary text-primary-foreground",
                    pending && "border-border bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 transition-all duration-500",
                      active && STAGE_ACTIVE_ANIMATION[step],
                      active && "text-amber-brand",
                      completed && "text-primary-foreground",
                      pending && "opacity-40",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                    aria-hidden
                  />
                  {active ? (
                    <span className="absolute inset-0 rounded-full border-2 border-amber-brand/45 animate-ping" />
                  ) : null}
                </span>

                <div
                  className={cn(
                    "relative h-0.5 flex-1 overflow-hidden rounded-full transition-colors duration-500",
                    isLast ? "bg-transparent" : completed ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                >
                  {!isLast && active ? (
                    <span className="absolute inset-0 rounded-full animate-order-line-flow-x" />
                  ) : null}
                </div>
              </div>

              <p
                className={cn(
                  "mt-2 max-w-full truncate px-0.5 text-center text-[9px] font-semibold uppercase tracking-wide transition-all duration-500 sm:text-[10px]",
                  active && "scale-105 text-amber-brand",
                  completed && !active && "text-foreground/70",
                  pending && "text-muted-foreground/50",
                )}
              >
                {meta.label.replace(" hoy", "")}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function OrderDeliveryFeeBreakdown({ order }: { order: Order }) {
  const deliveryFee = getOrderDeliveryFee(order);
  const products = Math.max(0, order.total - deliveryFee);

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
        Valores del envío
      </p>
      <dl className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Productos</dt>
          <dd className="font-mono tabular-nums text-foreground">{formatCOP(products)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium text-emerald-800">Domicilio (repartidor)</dt>
          <dd className="font-mono font-semibold tabular-nums text-emerald-700">
            {formatCOP(deliveryFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-1.5">
          <dt className="font-medium text-foreground">Total factura</dt>
          <dd className="font-mono font-semibold tabular-nums text-foreground">
            {formatCOP(order.total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function TrackedOrderCard({ order }: { order: Order }) {
  const stage = controlStageOf(order);
  const statusText = stageLabel(order.status);
  const ActiveIcon = STAGE_META[stage].icon;
  const deliveryFee = getOrderDeliveryFee(order);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
        <DispatchStatusStepper order={order} />
      </div>

      <KitchenOrderCard order={order} />

      <OrderDeliveryFeeBreakdown order={order} />

      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2">
        <UserAvatar
          name={order.courierName ?? "Domiciliario"}
          src={resolveLogoUrl(order.courierAvatar) ?? order.courierAvatar}
          className="size-8 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Repartidor
          </p>
          <p className="truncate text-sm font-semibold">
            {order.courierName ?? "Domiciliario asignado"}
          </p>
          {order.courierPhone ? (
            <p className="truncate text-[11px] text-muted-foreground">{order.courierPhone}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              stage === "en_camino" && "bg-primary/15 text-primary",
              stage === "entregado" && "bg-secondary text-muted-foreground",
              stage === "asignado" && "bg-emerald-500/15 text-emerald-700",
              stage !== "entregado" && "animate-pulse",
            )}
          >
            <ActiveIcon
              className={cn("size-3", STAGE_ACTIVE_ANIMATION[stage])}
              aria-hidden
            />
            {statusText}
          </span>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Domicilio
          </p>
          <p className="font-mono text-[11px] font-semibold tabular-nums text-emerald-700">
            {formatCOP(deliveryFee)}
          </p>
        </div>
      </div>
    </div>
  );
}
