import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCourierApplications } from "@/context/CourierApplicationsContext";
import { restaurantsApi, type ApiRestaurantSummary } from "@/lib/api/endpoints/restaurants";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Loader2 } from "lucide-react";

export function JobBoardView() {
  const { user } = useAuth();
  const { applications, applyToRestaurant } = useCourierApplications();

  const [restaurants, setRestaurants] = useState<ApiRestaurantSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await restaurantsApi.listAll();
        // Solo mostrar restaurantes activos
        if (!cancelled) setRestaurants(data.filter(r => r.status === "Activo"));
      } catch (err) {
        console.error("[JobBoard] Error loading restaurants:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const myApps = applications.filter(app => app.courierId === user?.id);

  const handleApply = useCallback(async (restaurantId: string) => {
    if (!user) return;
    setApplyingTo(restaurantId);
    try {
      await applyToRestaurant(user.id, restaurantId);
    } catch {
      // El error ya se logea en el contexto
    } finally {
      setApplyingTo(null);
    }
  }, [user, applyToRestaurant]);

  if (isLoading) {
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
        <h2 className="text-xl font-bold font-display">Bolsa de Empleo</h2>
        <p className="text-sm text-muted-foreground mt-1">Postúlate a restaurantes para recibir sus pedidos.</p>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No hay restaurantes disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map(rest => {
            const existingApp = myApps.find(app => app.restaurantId === rest.id);
            const isSending = applyingTo === rest.id;
            return (
              <div key={rest.id} className="relative overflow-hidden p-5 rounded-2xl bg-cream border border-border shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
                {/* decorative circle */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-6 -mt-6 opacity-20 pointer-events-none" style={{ backgroundColor: rest.accent || "#000" }} />
                
                <div className="flex items-start gap-4">
                  <div 
                    className="flex items-center justify-center size-12 shrink-0 rounded-xl font-display font-bold text-white shadow-sm"
                    style={{ backgroundColor: rest.accent || "#000" }}
                  >
                    {rest.initials || rest.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{rest.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rest.tagline || rest.address}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-foreground/80">
                      <span className="flex items-center gap-0.5"><Star className="size-3 text-amber-500 fill-amber-500" /> {rest.rating || 4.5}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="flex items-center gap-0.5"><MapPin className="size-3" /> {rest.city}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Despachos: <span className="font-semibold text-foreground">~{rest.deliveryMinutes || 30} min</span>
                  </div>
                  
                  {existingApp ? (
                    <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider uppercase shadow-sm ${
                      existingApp.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                      existingApp.status === "REJECTED" ? "bg-red-100 text-red-700 border border-red-200" :
                      "bg-amber-100 text-amber-700 border border-amber-200"
                    }`}>
                      {existingApp.status}
                    </span>
                  ) : (
                    <Button 
                      size="sm" 
                      disabled={isSending}
                      onClick={() => void handleApply(rest.id)} 
                      className="rounded-xl shadow-md transition-transform active:scale-95 text-white" 
                      style={{ backgroundColor: rest.accent || "#000" }}
                    >
                      {isSending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                      {isSending ? "Enviando…" : "Enviar Solicitud"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
