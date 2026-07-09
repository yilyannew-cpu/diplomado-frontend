import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { OrderSpecialInstructions } from "@/components/shared/OrderSpecialInstructions";
import { useAuth } from "@/context/AuthContext";
import { useOrders, formatCOP } from "@/context/OrderContext";
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
  MapPin,
  Navigation,
  ChevronLeft,
  Clock,
} from "lucide-react";

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

/* ─── Flujo de estados logísticos ─── */
const NEXT: Record<OrderStatus, { next?: OrderStatus; label: string }> = {
  Recibido: { next: "Recogido", label: "Marcar como recogido en tienda" },
  "En Cocina": { next: "Recogido", label: "Marcar como recogido en tienda" },
  Listo: { next: "Recogido", label: "Marcar como recogido en tienda" },
  Recogido: { next: "En Camino", label: "Marcar como en camino" },
  "En Camino": { next: "Entregado", label: "Marcar como entregado con éxito" },
  Entregado: { label: "Entrega completada ✓" },
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  Recibido: "bg-blue-100 text-blue-700",
  "En Cocina": "bg-amber-100 text-amber-700",
  Listo: "bg-emerald-100 text-emerald-700",
  Recogido: "bg-violet-100 text-violet-700",
  "En Camino": "bg-primary/15 text-primary",
  Entregado: "bg-green-100 text-green-700",
};

/* ═════════════════════════════════════════════════
   Vista Principal (Hub) — Listas de Pedidos
   ═════════════════════════════════════════════════ */
function HubView({
  onSelectOrder,
}: {
  onSelectOrder: (order: Order) => void;
}) {
  const { orders } = useOrders();
  const { user } = useAuth();

  // Pedidos Actuales: ya están en manos del domiciliario (Recogido / En Camino)
  const actuales = orders.filter((o) =>
    o.deliveryPersonId === user?.id && ["Recogido", "En Camino"].includes(o.status)
  );

  // Pedidos Aceptados: asignados pero aún en cocina/listo/recibido
  const aceptados = orders.filter((o) =>
    o.deliveryPersonId === user?.id && ["Recibido", "En Cocina", "Listo"].includes(o.status)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Pedidos Actuales ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-2.5 rounded-full bg-primary animate-pulse" />
          <h3 className="font-display text-lg font-semibold">
            Pedidos Actuales
          </h3>
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
            {actuales.length}
          </span>
        </div>

        {actuales.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes pedidos en ruta
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Aparecerán aquí cuando recojas un pedido
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {actuales.map((o) => (
              <li key={o.id}>
                <OrderCard order={o} onSelect={onSelectOrder} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Pedidos Aceptados ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="size-2.5 rounded-full bg-amber-400" />
          <h3 className="font-display text-lg font-semibold">
            Pedidos Aceptados
          </h3>
          <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
            {aceptados.length}
          </span>
        </div>

        {aceptados.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Sin pedidos en espera
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {aceptados.map((o) => (
              <li key={o.id}>
                <OrderCard order={o} onSelect={onSelectOrder} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ─── Tarjeta de Pedido (reutilizable) ─── */
function OrderCard({
  order,
  onSelect,
}: {
  order: Order;
  onSelect: (o: Order) => void;
}) {
  return (
    <button
      onClick={() => onSelect(order)}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-cream px-5 py-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            <Clock className="size-3" />
            {order.createdAt}
          </span>
        </div>
        <p className="font-display font-semibold mt-0.5 truncate">
          {order.customerName}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {order.address}
        </p>
      </div>
      <div className="ml-3 shrink-0 flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}
        >
          {order.status}
        </span>
        <span className="font-mono text-xs font-semibold text-primary">
          {formatCOP(order.total)}
        </span>
      </div>
    </button>
  );
}

/* ═════════════════════════════════════════════════
   Vista Detalle — Ficha de Ejecución con Acordeones
   ═════════════════════════════════════════════════ */
function OrderDetailView({
  order,
  onBack,
}: {
  order: Order;
  onBack: () => void;
}) {
  const { menu, updateOrderStatus } = useOrders();
  const [currentStatus, setCurrentStatus] = useState(order.status);

  const advance = () => {
    const next = NEXT[currentStatus].next;
    if (!next) return;
    updateOrderStatus(order.id, next);
    setCurrentStatus(next);
  };

  const encodedAddress = encodeURIComponent(order.address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}`;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Botón volver */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
      >
        <ChevronLeft className="size-5" />
        Volver a mis pedidos
      </button>

      {/* Cabecera */}
      <div className="rounded-2xl border border-border bg-cream p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pedido
            </p>
            <h2 className="font-display text-2xl font-bold mt-0.5">
              {order.id}
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[currentStatus]}`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      {/* ── Mapa Integrado ── */}
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-amber-brand/20 via-cream to-primary/10">
          <svg
            className="absolute inset-0 size-full"
            viewBox="0 0 400 225"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M0 180 L60 160 L100 185 L160 140 L220 160 L280 110 L340 130 L400 90"
              stroke="oklch(0.5 0.02 60)"
              strokeOpacity="0.25"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M0 130 L80 110 L140 130 L200 80 L260 110 L320 60 L400 80"
              stroke="oklch(0.5 0.02 60)"
              strokeOpacity="0.2"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M40 200 Q 140 140 220 160 T 360 60"
              stroke="oklch(0.58 0.22 18)"
              strokeWidth="3"
              strokeDasharray="6 4"
              fill="none"
            />
          </svg>
          <span className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-ink text-[10px] font-bold text-cream shadow-md">
            A
          </span>
          <span className="absolute bottom-5 right-5 grid size-9 place-items-center rounded-full bg-primary text-[11px] font-bold text-cream shadow-lg shadow-primary/40">
            B
          </span>
          <div className="absolute bottom-3 left-3 rounded-full bg-cream/90 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-foreground backdrop-blur-sm">
            <MapPin className="size-3 inline mr-1 -mt-0.5" />
            Ruta estimada · 2.4 km
          </div>
        </div>

        {/* Botones de navegación externa */}
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-cream">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Navigation className="size-4 text-primary" />
            Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Navigation className="size-4 text-[#33CCFF]" />
            Waze
          </a>
        </div>
      </div>

      {/* ── Acordeones (Cerrados por defecto) ── */}
      <div className="rounded-2xl border border-border bg-cream shadow-sm overflow-hidden">
        <Accordion type="multiple" className="w-full">
          {/* Datos del Cliente */}
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
                  <p className="font-display text-base font-semibold mt-0.5">
                    {order.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Dirección
                  </p>
                  <p className="text-sm mt-0.5">{order.address}</p>
                </div>
                {order.notes && (
                  <div className="rounded-xl bg-amber-brand/10 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 mb-1">
                      Nota del cliente
                    </p>
                    <p className="text-sm">{order.notes}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Resumen de Compra */}
          <AccordionItem value="compra" className="border-border px-5">
            <AccordionTrigger className="hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Package className="size-4 text-primary" />
                Resumen de Compra
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded-xl border border-border bg-card p-4">
                <ul className="space-y-2 text-sm">
                  {order.items.map((i) => {
                    const p = menu.find((m) => m.id === i.productId);
                    return (
                      <li key={i.productId} className="flex justify-between">
                        <span>
                          <span className="font-mono text-muted-foreground">
                            {i.quantity}×
                          </span>{" "}
                          {p?.name ?? i.productId}
                        </span>
                        {p && (
                          <span className="font-mono text-muted-foreground">
                            {formatCOP(p.price * i.quantity)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 font-semibold">
                  <span>Total a cobrar</span>
                  <span className="font-mono text-primary">
                    {formatCOP(order.total)}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Datos de Recogida */}
          <AccordionItem
            value="recogida"
            className="border-b-0 border-border px-5"
          >
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
                    Restaurante
                  </p>
                  <p className="text-sm font-medium mt-0.5">
                    BurgerCore — Sede Principal
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Dirección de recogida
                  </p>
                  <p className="text-sm mt-0.5">
                    Cra 48 #10-45, El Poblado, Medellín
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── Acciones rápidas ── */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${order.phone}`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-cream py-4 text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-secondary/50 transition-colors"
        >
          <Phone className="size-4" />
          Llamar
        </a>
        <a
          href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-[#20BD5A] transition-colors"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </div>

      {/* ── CTA Principal ── */}
      <button
        onClick={advance}
        disabled={!NEXT[currentStatus].next}
        className="w-full rounded-2xl bg-primary py-5 text-base font-bold uppercase tracking-wider text-primary-foreground shadow-xl shadow-primary/30 transition-transform active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
      >
        {NEXT[currentStatus].label}
      </button>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   Vista Raíz — Controlador de navegación interna
   ═════════════════════════════════════════════════ */
function DomiciliarioView() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="min-h-screen bg-cream/50 text-foreground">
      <TopBar
        title={selectedOrder ? `Pedido ${selectedOrder.id}` : "Ruta activa"}
        subtitle={selectedOrder ? selectedOrder.customerName : "Buscar y entregar"}
      />
      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        {selectedOrder ? (
          <OrderDetailView
            order={selectedOrder}
            onBack={() => setSelectedOrder(null)}
          />
        ) : (
          <HubView onSelectOrder={setSelectedOrder} />
        )}
      </main>
    </div>
  );
}