import { useAuth } from "@/context/AuthContext";
import { useOrders, formatCOP } from "@/context/OrderContext";

export function OrderHistoryView() {
  const { user } = useAuth();
  const { orders } = useOrders();

  const history = orders.filter(o => o.deliveryPersonId === user?.id && o.status === "Entregado");
  const totalEarned = history.length * 5000; // Mock: 5000 COP por entrega

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold font-display">Historial y Ganancias</h2>
        <p className="text-sm text-muted-foreground mt-1">Tus entregas completadas de hoy.</p>
      </div>
      <div className="p-6 rounded-2xl bg-emerald-600 text-white shadow-lg text-center">
        <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Ganancias estimadas</p>
        <p className="text-4xl font-bold font-display mt-2">{formatCOP(totalEarned)}</p>
        <p className="text-emerald-200 text-xs mt-2">{history.length} entregas realizadas hoy</p>
      </div>
      <div className="space-y-3">
        {history.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Aún no tienes entregas completadas hoy.</p>
        ) : (
          history.map(o => (
            <div key={o.id} className="p-4 rounded-2xl bg-cream border border-border shadow-sm flex justify-between items-center">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                <p className="font-semibold text-sm mt-0.5">{o.customerName}</p>
              </div>
              <span className="font-mono font-bold text-emerald-600">+ {formatCOP(5000)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
