import { useAuth } from "@/context/AuthContext";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { useOrders } from "@/context/OrderContext";
import { Button } from "@/components/ui/button";

export function JobBoardView() {
  const { user } = useAuth();
  const { restaurants } = useOrders();
  const { applications, applyToRestaurant } = useCourierApplications();

  const myApps = applications.filter(app => app.courierId === user?.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold font-display">Bolsa de Empleo</h2>
        <p className="text-sm text-muted-foreground mt-1">Postúlate a restaurantes para recibir sus pedidos.</p>
      </div>
      <div className="space-y-4">
        {restaurants.map(rest => {
          const existingApp = myApps.find(app => app.restaurantId === rest.id);
          return (
            <div key={rest.id} className="p-4 rounded-2xl bg-cream border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-semibold leading-tight">{rest.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{rest.address}</p>
              </div>
              <div className="shrink-0 ml-3">
                {existingApp ? (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase ${
                    existingApp.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                    existingApp.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {existingApp.status}
                  </span>
                ) : (
                  <Button size="sm" onClick={() => applyToRestaurant(user!.id, rest.id)}>
                    Postularme
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
