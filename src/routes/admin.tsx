import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { formatCOP, useOrders } from "@/context/OrderContext";
import type { MenuItem } from "@/mocks/menuMock";
import type { Order, OrderStatus } from "@/mocks/ordersMock";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Restaurante · BurgerCore" },
      { name: "description", content: "Monitor de comandas Kanban y CRUD visual del menú del restaurante." },
    ],
  }),
  component: () => (
    <RoleGuard role="admin">
      <AdminView />
    </RoleGuard>
  ),
});

const COLUMNS: { key: OrderStatus; label: string; next?: OrderStatus; nextLabel?: string; accent: string }[] = [
  { key: "Recibido", label: "Recibidos", next: "En Cocina", nextLabel: "Pasar a cocina", accent: "bg-amber-brand" },
  { key: "En Cocina", label: "En cocina", next: "Listo", nextLabel: "Marcar listo", accent: "bg-primary" },
  { key: "Listo", label: "Listos para despacho", next: "En Camino", nextLabel: "Asignar domiciliario", accent: "bg-emerald-500" },
];

function AdminView() {
  const { orders, menu, updateOrderStatus, toggleAvailability, updatePrice } = useOrders();
  const [tab, setTab] = useState<"comandas" | "menu">("comandas");
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const grouped = useMemo(() => {
    return COLUMNS.map((c) => ({
      ...c,
      orders: orders.filter((o) => o.status === c.key),
    }));
  }, [orders]);

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Centro de cocina" subtitle="Monitor de comandas en tiempo real" />

      <div className="page-container flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            <SidebarItem active={tab === "comandas"} onClick={() => setTab("comandas")} label="Monitor de comandas" hint={`${orders.length} activas`} />
            <SidebarItem active={tab === "menu"} onClick={() => setTab("menu")} label="Gestor de menú" hint={`${menu.length} productos`} />
            <SidebarItem label="Historial" hint="Próximamente" disabled />
            <SidebarItem label="Reportes" hint="Próximamente" disabled />
          </div>
        </nav>

        <main className="flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                Sede El Poblado
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {tab === "comandas" ? "Monitor de comandas" : "Gestor de menú"}
              </h1>
            </div>
            <div className="flex gap-2 lg:hidden">
              <button onClick={() => setTab("comandas")} className={tabBtn(tab === "comandas")}>Comandas</button>
              <button onClick={() => setTab("menu")} className={tabBtn(tab === "menu")}>Menú</button>
            </div>
          </div>

          {tab === "comandas" ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {grouped.map((col) => (
                <section key={col.key}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${col.accent}`} />
                      <h2 className="text-sm font-semibold">{col.label}</h2>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tabular-nums">
                      {col.orders.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {col.orders.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Sin pedidos
                      </div>
                    )}
                    {col.orders.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        actionLabel={col.nextLabel}
                        onAdvance={col.next ? () => updateOrderStatus(o.id, col.next!) : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:grid md:grid-cols-12">
                <span className="col-span-5">Producto</span>
                <span className="col-span-2">Categoría</span>
                <span className="col-span-2 text-right">Precio</span>
                <span className="col-span-2 text-center">Disponibilidad</span>
                <span className="col-span-1 text-right">Editar</span>
              </div>
              {menu.map((p) => (
                <div key={p.id}>
                  {/* Mobile card */}
                  <div className="space-y-3 border-b border-border p-4 last:border-b-0 md:hidden">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="size-14 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{p.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{p.category}</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-primary tabular-nums">
                          {formatCOP(p.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Disponible</span>
                        <button
                          onClick={() => toggleAvailability(p.id)}
                          className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                            p.available ? "bg-primary" : "bg-secondary"
                          }`}
                        >
                          <span className={`size-5 rounded-full bg-white shadow transition-transform ${p.available ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                      <button onClick={() => setEditing(p)} className="text-xs font-medium text-primary hover:underline">
                        Editar
                      </button>
                    </div>
                  </div>
                  {/* Desktop row */}
                  <div className="hidden grid-cols-12 items-center border-b border-border px-5 py-3 text-sm last:border-b-0 md:grid">
                  <div className="col-span-5 flex items-center gap-3">
                    <img src={p.image} alt="" className="size-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                  <span className="col-span-2 text-xs text-muted-foreground">{p.category}</span>
                  <span className="col-span-2 text-right font-mono text-xs tabular-nums">{formatCOP(p.price)}</span>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => toggleAvailability(p.id)}
                      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                        p.available ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <span className={`size-5 rounded-full bg-white shadow transition-transform ${p.available ? "translate-x-5" : ""}`} />
                    </button>
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => setEditing(p)} className="text-xs font-medium text-primary hover:underline">
                      Editar
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(price) => {
            updatePrice(editing.id, price);
            setEditing(null);
          }}
          onToggle={() => toggleAvailability(editing.id)}
        />
      )}
    </div>
  );
}

function SidebarItem({
  label,
  hint,
  active,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
        active
          ? "bg-ink text-cream"
          : disabled
            ? "cursor-not-allowed text-muted-foreground"
            : "text-foreground hover:bg-secondary"
      }`}
    >
      <p className="text-sm font-medium">{label}</p>
      {hint && (
        <p className={`text-[11px] ${active ? "text-cream/60" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </button>
  );
}

function OrderCard({
  order,
  actionLabel,
  onAdvance,
}: {
  order: Order;
  actionLabel?: string;
  onAdvance?: () => void;
}) {
  const { menu } = useOrders();
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-start justify-between">
        <div>
          <p className="font-mono text-xs font-semibold">{order.id}</p>
          <p className="text-[11px] text-muted-foreground">{order.createdAt} · {order.customerName}</p>
        </div>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
          {order.status}
        </span>
      </header>
      <ul className="mb-3 space-y-1 text-xs">
        {order.items.map((i) => {
          const p = menu.find((m) => m.id === i.productId);
          return (
            <li key={i.productId} className="flex justify-between">
              <span>
                <span className="font-mono">{i.quantity}×</span> {p?.name ?? i.productId}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mb-3 truncate text-[11px] text-muted-foreground">{order.address}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-sm font-semibold text-primary tabular-nums sm:text-base">{formatCOP(order.total)}</span>
        {onAdvance && actionLabel && (
          <button
            onClick={onAdvance}
            className="w-full rounded-lg bg-ink px-3 py-2 text-[11px] font-semibold text-cream transition-colors hover:bg-primary sm:w-auto sm:py-1.5"
          >
            {actionLabel} →
          </button>
        )}
      </div>
    </article>
  );
}

function EditModal({
  item,
  onClose,
  onSave,
  onToggle,
}: {
  item: MenuItem;
  onClose: () => void;
  onSave: (price: number) => void;
  onToggle: () => void;
}) {
  const [price, setPrice] = useState(item.price);
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-4">
          <img src={item.image} alt="" className="size-16 rounded-2xl object-cover" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{item.category}</p>
            <h3 className="font-display text-xl font-semibold">{item.name}</h3>
          </div>
        </div>
        <label className="block">
          <span className="text-xs font-medium">Precio (COP)</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">Disponibilidad</p>
            <p className="text-[11px] text-muted-foreground">
              {item.available ? "Visible para clientes" : "Marcado como agotado"}
            </p>
          </div>
          <button
            onClick={onToggle}
            className={`flex h-6 w-11 items-center rounded-full p-0.5 ${item.available ? "bg-primary" : "bg-secondary"}`}
          >
            <span className={`size-5 rounded-full bg-white shadow transition-transform ${item.available ? "translate-x-5" : ""}`} />
          </button>
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary">
            Cancelar
          </button>
          <button onClick={() => onSave(price)} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function tabBtn(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-xs font-medium ${
    active ? "bg-ink text-cream" : "border border-border bg-card"
  }`;
}