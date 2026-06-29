import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SalesReportsPanel } from "@/components/admin/SalesReportsPanel";
import { ReportDateRangeSelector } from "@/components/admin/reports/ReportDateRangeSelector";
import type { ReportDateRange } from "@/lib/salesReports";
import { RestaurantDashboard } from "@/components/admin/RestaurantDashboard";
import { ActiveDeliveriesPanel } from "@/components/admin/ActiveDeliveriesPanel";
import { AdminNavMobile, AdminNavSidebar, type AdminTab } from "@/components/admin/AdminNav";
import { AddAdditionModal } from "@/components/admin/AddAdditionModal";
import { AddProductModal } from "@/components/admin/AddProductModal";
import { EditProductModal } from "@/components/admin/EditProductModal";
import { AssignCourierModal } from "@/components/admin/AssignCourierModal";
import { OrderCommandMonitor } from "@/components/admin/kitchen/OrderCommandMonitor";
import { PromotionsPanel } from "@/components/admin/promotions/PromotionsPanel";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { formatCOP, useOrders } from "@/context/OrderContext";
import type { MenuItem } from "@/mocks/menuMock";
import { ADDITION_CATEGORY } from "@/mocks/menuMock";
import type { Order } from "@/mocks/ordersMock";
import { buildActiveDeliveryRows } from "@/lib/activeDeliveries";
import { isPromotionActive } from "@/lib/promotions";

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

function AdminView() {
  const {
    orders,
    menu,
    assignCourierOnlyBatch,
    dispatchOrderBatch,
    toggleAvailability,
    updateMenuItem,
    addMenuItem,
    promotions,
  } = useOrders();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [assigningOrders, setAssigningOrders] = useState<Order[] | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addingAddition, setAddingAddition] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<ReportDateRange>({ preset: "month" });

  const activeDeliveryCount = useMemo(() => buildActiveDeliveryRows(orders).length, [orders]);
  const activePromotionsCount = useMemo(
    () => promotions.filter((promo) => isPromotionActive(promo)).length,
    [promotions],
  );

  const pageTitle =
    tab === "dashboard"
      ? "Dashboard"
      : tab === "reportes"
        ? "Reportes de ventas"
        : tab === "comandas"
          ? "Monitor de comandas"
          : tab === "menu"
            ? "Gestor de menú"
            : tab === "promociones"
              ? "Promociones"
              : "Domicilios activos";

  const navHints: Partial<Record<AdminTab, string>> = {
    dashboard: "Ventas y reseñas",
    reportes: "Ganancias y domicilios",
    comandas: `${orders.length} activas`,
    menu: `${menu.length} productos`,
    promociones: `${activePromotionsCount} activas`,
    domicilios: `${activeDeliveryCount} en ruta`,
  };

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Centro de cocina" subtitle="Monitor de comandas en tiempo real" />

      <div className="page-container flex flex-col gap-6 lg:flex-row lg:gap-8">
        <AdminNavSidebar active={tab} onSelect={setTab} hints={navHints} />

        <main className="flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <AdminNavMobile active={tab} onSelect={setTab} hints={navHints} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
                  Sede El Poblado
                </p>
                <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tab === "reportes" && (
                <ReportDateRangeSelector
                  value={reportDateRange}
                  onChange={setReportDateRange}
                />
              )}
              {tab === "menu" && (
                <>
                  <button
                    onClick={() => setAddingProduct(true)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    + Nuevo producto
                  </button>
                  <button
                    onClick={() => setAddingAddition(true)}
                    className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    + Nueva adición
                  </button>
                </>
              )}
            </div>
          </div>

          {tab === "dashboard" ? (
            <RestaurantDashboard />
          ) : tab === "reportes" ? (
            <SalesReportsPanel
              dateRange={reportDateRange}
              onDateRangeChange={setReportDateRange}
            />
          ) : tab === "comandas" ? (
            <OrderCommandMonitor
              onAssignZone={setAssigningOrders}
              onDispatchBatch={dispatchOrderBatch}
            />
          ) : tab === "menu" ? (
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
                          {p.category === ADDITION_CATEGORY ? `+ ${formatCOP(p.price)}` : formatCOP(p.price)}
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
                  <span className="col-span-2 text-right font-mono text-xs tabular-nums">
                    {p.category === ADDITION_CATEGORY ? `+ ${formatCOP(p.price)}` : formatCOP(p.price)}
                  </span>
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
          ) : tab === "promociones" ? (
            <PromotionsPanel />
          ) : tab === "domicilios" ? (
            <ActiveDeliveriesPanel orders={orders} />
          ) : null}
        </main>
      </div>

      {editing && (
        <EditProductModal
          item={editing}
          open
          onClose={() => setEditing(null)}
          onSave={(data) => {
            updateMenuItem(editing.id, data);
            setEditing(null);
          }}
        />
      )}

      {assigningOrders && assigningOrders.length > 0 && (
        <AssignCourierModal
          orders={assigningOrders}
          allOrders={orders}
          open
          onClose={() => setAssigningOrders(null)}
          onAssign={(courierId) => {
            assignCourierOnlyBatch(
              assigningOrders.map((o) => o.id),
              courierId,
            );
            setAssigningOrders(null);
          }}
        />
      )}

      <AddProductModal
        open={addingProduct}
        onClose={() => setAddingProduct(false)}
        onSave={(data) => {
          addMenuItem(data);
          setAddingProduct(false);
        }}
      />

      <AddAdditionModal
        open={addingAddition}
        onClose={() => setAddingAddition(false)}
        onSave={(data) => {
          addMenuItem({ ...data, category: ADDITION_CATEGORY });
          setAddingAddition(false);
        }}
      />
    </div>
  );
}