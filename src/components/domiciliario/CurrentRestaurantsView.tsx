import { useAuth } from "@/context/AuthContext";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { useOrders } from "@/context/OrderContext";

export function CurrentRestaurantsView() {
  const { user } = useAuth();
  const { restaurants } = useOrders();
  const { applications } = useCourierApplications();

  const acceptedRestIds = applications
    .filter(app => app.courierId === user?.id && app.status === "ACCEPTED")
    .map(app => app.restaurantId);
  
  const myRests = restaurants.filter(r => acceptedRestIds.includes(r.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold font-display">Mis Restaurantes</h2>
        <p className="text-sm text-muted-foreground mt-1">Estás activo y contratado en estos restaurantes.</p>
      </div>
      {myRests.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
          No estás contratado en ningún restaurante aún.
        </div>
      ) : (
        <div className="space-y-4">
          {myRests.map(rest => (
            <div key={rest.id} className="p-4 rounded-2xl bg-cream border border-border shadow-sm">
              <h3 className="font-semibold">{rest.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{rest.address} • {rest.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
