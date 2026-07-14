import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { OrderItemLines } from "@/components/shared/OrderItemLines";
import { useAuth } from "@/context/AuthContext";
import { useOrders, formatCOP } from "@/context/OrderContext";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { JobBoardView } from "@/components/domiciliario/JobBoardView";
import { CurrentRestaurantsView } from "@/components/domiciliario/CurrentRestaurantsView";
import { OrderHistoryView } from "@/components/domiciliario/OrderHistoryView";
import { CourierMainControls } from "@/components/domiciliario/CourierTopBarControls";
import { getOrderApiId, mapApiOrder, mapApiOrders } from "@/lib/api/admin/mappers";
import { fetchRestaurantProductsCached } from "@/lib/api/cliente/clientCatalogCache";
import { courierOrdersApi } from "@/lib/api/endpoints/courierOrders";
import { ApiError } from "@/lib/api/errors";
import type { MenuItem } from "@/mocks/menuMock";
import type { Order, OrderStatus } from "@/mocks/ordersMock";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  User,
  Package,
  Store,
  Phone,
  MessageCircle,
  ChevronLeft,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CourierDeliveryMap } from "@/components/domiciliario/CourierDeliveryMap";
import { CourierAvatarRequiredModal } from "@/components/domiciliario/CourierAvatarRequiredModal";


export const Route = createFileRoute("/domiciliario")({
  head: () => ({
    meta: [
      { title: "Domiciliario · FFCore" },
      {
        name: "description",
        content:
          "Interfaz mobile-first para entregas: buscador, ficha del cliente y cambio de estado logístico.",
      },
    ],
  }),
  component: () => (
    <RoleGuard role="domiciliario">
      <DomiciliarioView />
    </RoleGuard>
  ),
});

/** Flujo operativo real (API): Listo → En Camino → Entregado */
const NEXT: Partial<Record<OrderStatus, { action: "start" | "complete"; label: string }>> = {
  Listo: { action: "start", label: "Salir a entregar (en camino)" },
  Recogido: { action: "start", label: "Salir a entregar (en camino)" },
  "En Camino": { action: "complete", label: "Marcar como entregado" },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  Recibido: "bg-blue-100 text-blue-700",
  "En Cocina": "bg-amber-100 text-amber-700",
  Listo: "bg-emerald-100 text-emerald-700",
  Recogido: "bg-violet-100 text-violet-700",
  "En Camino": "bg-primary/15 text-primary",
  Entregado: "bg-green-100 text-green-700",
};

const POLL_MS = 60_000;
const ORDERS_TTL_MS = 20_000;

let ordersInflight: Promise<Order[]> | null = null;
let ordersCache: { data: Order[]; fetchedAt: number } | null = null;

async function fetchCourierOrdersCached(options?: { force?: boolean }): Promise<Order[]> {
  const force = options?.force === true;
  if (!force && ordersCache && Date.now() - ordersCache.fetchedAt < ORDERS_TTL_MS) {
    return ordersCache.data;
  }
  if (ordersInflight) return ordersInflight;

  ordersInflight = courierOrdersApi
    .listMine()
    .then((raw) => {
      const mapped = mapApiOrders(Array.isArray(raw) ? raw : []);
      ordersCache = { data: mapped, fetchedAt: Date.now() };
      return mapped;
    })
    .finally(() => {
      ordersInflight = null;
    });
  return ordersInflight;
}

function mergeOrder(list: Order[], updated: Order): Order[] {
  const id = getOrderApiId(updated);
  const next = list.map((o) => (getOrderApiId(o) === id ? updated : o));
  if (!next.some((o) => getOrderApiId(o) === id)) next.unshift(updated);
  return next;
}

/* ═════════════════════════════════════════════════
   Vista Principal (Hub) — Listas de Pedidos
   ═════════════════════════════════════════════════ */
function HubView({
  orders,
  loading,
  error,
  onRefresh,
  onSelectOrder,
}: {
  orders: Order[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectOrder: (order: Order) => void;
}) {
  // Asignados por cocina, pendientes de salir
  const aceptados = orders.filter((o) =>
    ["Recibido", "En Cocina", "Listo", "Recogido"].includes(o.status),
  );

  // Ya en ruta
  const actuales = orders.filter((o) => o.status === "En Camino");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Pedidos que cocina te asignó aparecen aquí automáticamente.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-cream px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Pedidos Actuales ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="size-2.5 animate-pulse rounded-full bg-primary" />
          <h3 className="font-display text-lg font-semibold">Pedidos Actuales</h3>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            {actuales.length}
          </span>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando pedidos…
          </div>
        ) : actuales.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">No tienes pedidos en ruta</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Aparecerán aquí cuando marques “Salir a entregar”
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {actuales.map((o) => (
              <li key={getOrderApiId(o)}>
                <OrderCard order={o} onSelect={onSelectOrder} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Pedidos Aceptados / Asignados ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-amber-400" />
          <h3 className="font-display text-lg font-semibold">Pedidos Asignados</h3>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
            {aceptados.length}
          </span>
        </div>

        {aceptados.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">Sin pedidos en espera</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Cuando el restaurante te asigne un pedido Listo, saldrá aquí
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {aceptados.map((o) => (
              <li key={getOrderApiId(o)}>
                <OrderCard order={o} onSelect={onSelectOrder} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OrderCard({
  order,
  onSelect,
}: {
  order: Order;
  onSelect: (o: Order) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-cream px-5 py-4 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="size-3" />
            {order.createdAt}
          </span>
        </div>
        <p className="mt-0.5 truncate font-display font-semibold">{order.customerName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{order.address}</p>
      </div>
      <div className="ml-3 flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}
        >
          {order.status}
        </span>
        <span className="font-mono text-xs font-semibold text-primary">{formatCOP(order.total)}</span>
      </div>
    </button>
  );
}

function enrichOrderItems(order: Order, menu: MenuItem[]): Order {
  if (!menu.length) return order;
  return {
    ...order,
    items: order.items.map((item) => {
      const product = menu.find((m) => m.id === item.productId);
      if (!product) return item;
      return {
        ...item,
        productName: item.productName?.trim() || product.name,
        productImage: item.productImage || product.image || null,
      };
    }),
  };
}

/* ═════════════════════════════════════════════════
   Vista Detalle
   ═════════════════════════════════════════════════ */
function OrderDetailView({
  order,
  onBack,
  onOrderUpdated,
}: {
  order: Order;
  onBack: () => void;
  onOrderUpdated: (order: Order) => void;
}) {
  const [current, setCurrent] = useState(order);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(order);
  }, [order]);

  useEffect(() => {
    const restaurantId = order.restaurantId;
    if (!restaurantId) {
      setMenu([]);
      return;
    }

    // Si el API ya mandó nombres e imágenes, no hace falta recargar el menú.
    const alreadyDetailed = order.items.every(
      (item) => item.productName?.trim() && item.productImage,
    );
    if (alreadyDetailed) {
      setMenu([]);
      return;
    }

    let cancelled = false;
    void fetchRestaurantProductsCached(restaurantId)
      .then((mapped) => {
        if (cancelled) return;
        setMenu(mapped);
        setCurrent((prev) => enrichOrderItems(prev, mapped));
      })
      .catch(() => {
        if (!cancelled) setMenu([]);
      });

    return () => {
      cancelled = true;
    };
  }, [order.restaurantId, order.orderId, order.id]);

  const step = NEXT[current.status];
  const detailed = enrichOrderItems(current, menu);

  const advance = async () => {
    if (!step || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const apiId = getOrderApiId(current);
      const raw =
        step.action === "start"
          ? await courierOrdersApi.startDelivery(apiId)
          : await courierOrdersApi.complete(apiId);
      const updated = enrichOrderItems(mapApiOrder(raw), menu);
      ordersCache = null;
      setCurrent(updated);
      onOrderUpdated(updated);
      if (updated.status === "Entregado") {
        onBack();
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el pedido. Intenta de nuevo.";
      setActionError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-5 duration-400">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-5" />
        Volver a mis pedidos
      </button>

      <div className="rounded-2xl border border-border bg-cream p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pedido
            </p>
            <h2 className="mt-0.5 font-display text-2xl font-bold">{current.id}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[current.status]}`}
          >
            {current.status}
          </span>
        </div>
      </div>

      <CourierDeliveryMap
        restaurantId={current.restaurantId}
        destinationAddress={current.address}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-cream shadow-sm">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="cliente" className="border-border px-5">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <User className="size-4 text-primary" />
                Datos del Cliente
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pb-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Nombre
                  </p>
                  <p className="mt-0.5 font-display text-base font-semibold">{current.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Dirección
                  </p>
                  <p className="mt-0.5 text-sm">{current.address}</p>
                </div>
                {current.notes && (
                  <div className="rounded-xl bg-amber-brand/10 px-4 py-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                      Nota del cliente
                    </p>
                    <p className="text-sm">{current.notes}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compra" className="border-border px-5">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-primary" />
                Resumen de Compra
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-xl border border-border bg-card p-4">
                <OrderItemLines items={detailed.items} menu={menu} showImages showPrices />
                <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 font-semibold">
                  <span>Total a cobrar</span>
                  <span className="font-mono text-primary">{formatCOP(current.total)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="recogida" className="border-b-0 border-border px-5">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4 text-primary" />
                Datos de Recogida
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Estado en cocina
                  </p>
                  <p className="mt-0.5 text-sm font-medium">
                    {current.status === "Listo"
                      ? "Listo para despacho — pásalo a recoger"
                      : current.status === "En Camino"
                        ? "Ya saliste con el pedido"
                        : current.status}
                  </p>
                </div>
                {current.zone && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Zona
                    </p>
                    <p className="mt-0.5 text-sm">{current.zone}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${current.phone}`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-cream py-4 text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors hover:bg-secondary/50"
        >
          <Phone className="size-4" />
          Llamar
        </a>
        <a
          href={`https://wa.me/${current.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#20BD5A]"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </div>

      {actionError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <button
        type="button"
        onClick={() => void advance()}
        disabled={!step || busy}
        className="w-full rounded-2xl bg-primary py-5 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-xl shadow-primary/30 transition-transform active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            Actualizando…
          </span>
        ) : step ? (
          step.label
        ) : (
          "Entrega completada ✓"
        )}
      </button>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   Vista Raíz
   ═════════════════════════════════════════════════ */
function DomiciliarioView() {
  const { user } = useAuth();
  const needsAvatar = Boolean(user && user.role === "domiciliario" && !user.avatar);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { activeTab } = useCourierApplications();

  let content;
  let topBarProps = { title: "Ruta activa", subtitle: "Buscar y entregar" };

  if (selectedOrder) {
    topBarProps = { title: `Pedido ${selectedOrder.id}`, subtitle: selectedOrder.customerName };
    content = <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} onOrderUpdated={handleOrderUpdated} />;
  } else if (activeTab === "radar") {
    topBarProps = { title: "Ruta activa", subtitle: "Buscar y entregar" };
    content = <HubView orders={orders} loading={loading} error={error} onRefresh={() => void loadOrders({ force: true })} onSelectOrder={setSelectedOrder} />;
  } else if (activeTab === "bolsa") {
    topBarProps = { title: "Bolsa de Empleo", subtitle: "Restaurantes" };
    content = <JobBoardView />;
  } else if (activeTab === "mis-restaurantes") {
    topBarProps = { title: "Mis Restaurantes", subtitle: "Donde estás activo" };
    content = <CurrentRestaurantsView />;
  } else if (activeTab === "historial") {
    topBarProps = { title: "Historial", subtitle: "Tus ganancias" };
    content = <OrderHistoryView />;
  }

  const loadOrders = useCallback(async (opts?: { silent?: boolean; force?: boolean }) => {
    if (needsAvatar) {
      setLoading(false);
      return;
    }
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    try {
      const mapped = await fetchCourierOrdersCached({ force: opts?.force === true });
      // Panel operativo: ocultar entregados del hub
      setOrders(mapped.filter((o) => o.status !== "Entregado"));
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar tus pedidos asignados.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [needsAvatar]);

  // Carga inicial (una sola vez)
  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Poll suave solo en el hub; sin listener de focus (generaba ráfagas de /courier/me).
  useEffect(() => {
    if (needsAvatar || selectedOrder) return;
    const id = window.setInterval(() => void loadOrders({ silent: true }), POLL_MS);
    return () => window.clearInterval(id);
  }, [loadOrders, selectedOrder, needsAvatar]);

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) => {
      if (updated.status === "Entregado") {
        return prev.filter((o) => getOrderApiId(o) !== getOrderApiId(updated));
      }
      return mergeOrder(prev, updated);
    });
    setSelectedOrder((current) =>
      current && getOrderApiId(current) === getOrderApiId(updated) ? updated : current,
    );
  };

  return (
    <div className="min-h-screen bg-cream/50 text-foreground">
      <TopBar {...topBarProps} />
      <CourierAvatarRequiredModal />
      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        {!selectedOrder && <CourierMainControls />}
        {needsAvatar ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-5 py-12 text-center">
            <p className="font-display text-lg font-semibold">Completa tu foto de perfil</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Es obligatorio para que los clientes sepan quién entrega su pedido.
            </p>
          </div>
        ) : content}
      </main>
    </div>
  );
}
