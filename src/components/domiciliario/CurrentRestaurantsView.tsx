import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import {
  restaurantsApi,
  type ApiRestaurantSummary,
} from "@/lib/api/endpoints/restaurants";
import { Loader2 } from "lucide-react";

export function CurrentRestaurantsView() {
  const { user } = useAuth();
  const { applications } = useCourierApplications();
  const [restaurants, setRestaurants] = useState<ApiRestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void restaurantsApi
      .listAll()
      .then((data) => {
        if (!cancelled) setRestaurants(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("[CurrentRestaurants] Error loading restaurants:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const myRests = useMemo(() => {
    const acceptedRestIds = new Set(
      applications
        .filter((app) => app.courierId === user?.id && app.status === "ACCEPTED")
        .map((app) => app.restaurantId),
    );
    return restaurants.filter((r) => acceptedRestIds.has(r.id));
  }, [applications, restaurants, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Cargando restaurantes…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-xl font-bold font-display">Mis Restaurantes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Estás activo y contratado en estos restaurantes.
        </p>
      </div>
      {myRests.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
          No estás contratado en ningún restaurante aún.
        </div>
      ) : (
        <div className="space-y-4">
          {myRests.map((rest) => (
            <div key={rest.id} className="p-4 rounded-2xl bg-cream border border-border shadow-sm">
              <h3 className="font-semibold">{rest.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {rest.address} • {rest.city}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
