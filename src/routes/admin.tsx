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
import { HistoryPanel } from "@/components/admin/history/HistoryPanel";
import { PromotionsPanel } from "@/components/admin/promotions/PromotionsPanel";
import {
  DEFAULT_MENU_FILTERS,
  filterMenuItems,
  MenuFilters,
  type MenuFiltersState,
} from "@/components/admin/MenuFilters";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { formatCOP, useOrders } from "@/context/OrderContext";
import type { MenuItem } from "@/mocks/menuMock";
import { ADDITION_CATEGORY } from "@/mocks/menuMock";
import type { Order } from "@/mocks/ordersMock";
import { buildActiveDeliveryRows } from "@/lib/activeDeliveries";
import { buildDispatchLedger, summarizeDispatchPeriod } from "@/lib/orderHistory";
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
    dispatchHistory,
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
  const [menuFilters, setMenuFilters] = useState<MenuFiltersState>(DEFAULT_MENU_FILTERS);

  const filteredMenu = useMemo(
    () => filterMenuItems(menu, menuFilters),
    [menu, menuFilters],
  );

  const activeDeliveryCount = useMemo(() => buildActiveDeliveryRows(orders).length, [orders]);
  const activePromotionsCount = useMemo(
    () => promotions.filter((promo) => isPromotionActive(promo)).length,
    [promotions],
  );

  const historyMonthCount = useMemo(() => {
    const ledger = buildDispatchLedger(orders, dispatchHistory);
    return summarizeDispatchPeriod(ledger, "month").dispatchedCount;
  }, [orders, dispatchHistory]);

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
              : tab === "historial"
                ? "Historial de despachos"
                : "Domicilios activos";

  const navHints: Partial<Record<AdminTab, string>> = {
    dashboard: "Ventas y reseñas",
    reportes: "Ganancias y domicilios",
    comandas: `${orders.length} activas`,
    menu: `${menu.length} productos`,
    promociones: `${activePromotionsCount} activas`,
    domicilios: `${activeDeliveryCount} en ruta`,
    historial: `${historyMonthCount} despachos este mes`,
  };

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Centro de cocina" subtitle="Monitor de comandas en tiempo real" />

      <div className="page-container flex flex-col gap-6 lg:flex-row lg:gap-8">
        <AdminNavSidebar active={tab} onSelect={setTab} hints={navHints} />

        <main className="min-w-0 flex-1">
          <div className="mb-6 space-y-4 lg:flex lg:flex-wrap lg:items-end lg:justify-between lg:gap-4 lg:space-y-0">
            <div className="flex min-w-0 items-start gap-3 lg:flex-1">
              <AdminNavMobile active={tab} onSelect={setTab} hints={navHints} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:tracking-[0.25em]">
                  Sede El Poblado
                </p>
                <h1 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
                  {pageTitle}
                </h1>
              </div>
            </div>
            {(tab === "reportes" || tab === "menu") && (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto">
                {tab === "reportes" && (
                  <ReportDateRangeSelector
                    value={reportDateRange}
                    onChange={setReportDateRange}
                  />
                )}
                {tab === "menu" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAddingProduct(true)}
                      className="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                    >
                      + Nuevo producto
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingAddition(true)}
                      className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:w-auto"
                    >
                      + Nueva adición
                    </button>
                  </>
                )}
              </div>
            )}
            {tab === "menu" && (
              <div className="mt-1 w-full basis-full sm:mt-2">
                <MenuFilters
                  value={menuFilters}
                  onChange={setMenuFilters}
                  resultCount={filteredMenu.length}
                  totalCount={menu.length}
                />
              </div>
            )}
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
              {filteredMenu.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">No hay productos con estos filtros</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prueba otra categoría o disponibilidad, o limpia los filtros.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMenuFilters(DEFAULT_MENU_FILTERS)}
                    className="mt-4 text-xs font-semibold text-primary hover:text-primary/80"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                filteredMenu.map((p) => (
                <div key={p.id}>
                  {/* Mobile card */}
                  <div className="border-b border-border p-4 last:border-b-0 md:hidden">
                    <div className="flex gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="size-16 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{p.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
                        <p className="mt-1.5 font-mono text-sm font-semibold text-primary tabular-nums">
                          {p.category === ADDITION_CATEGORY ? `+ ${formatCOP(p.price)}` : formatCOP(p.price)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
                      <label className="flex min-h-9 items-center gap-2.5">
                        <span className="text-xs font-medium text-foreground">Disponible</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={p.available}
                          aria-label={`${p.available ? "Desactivar" : "Activar"} ${p.name}`}
                          onClick={() => toggleAvailability(p.id)}
                          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                            p.available ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`size-6 rounded-full bg-white shadow transition-transform ${
                              p.available ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="shrink-0 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 active:scale-[0.98]"
                      >
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
                ))
              )}
            </div>
          ) : tab === "promociones" ? (
            <PromotionsPanel />
          ) : tab === "domicilios" ? (
            <ActiveDeliveriesPanel orders={orders} />
          ) : tab === "historial" ? (
            <HistoryPanel />
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