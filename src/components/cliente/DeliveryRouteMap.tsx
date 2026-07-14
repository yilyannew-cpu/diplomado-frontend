import { lazy, Suspense, useEffect, useState } from "react";
import { Clock3, MapPinned, Route } from "lucide-react";
import {
  buildRestaurantOriginQuery,
  formatRouteDistance,
  formatRouteEta,
  resolveDeliveryRoute,
  type DeliveryRouteResult,
  type LatLng,
} from "@/lib/deliveryRoute";

const DeliveryRouteMapInner = lazy(() => import("./DeliveryRouteMapInner"));

type RestaurantLike = {
  name: string;
  city: string;
  address?: string | null;
  deliveryMinutes?: number;
};

function MapSkeleton({ message = "Calculando ruta…" }: { message?: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 sm:h-72">
      <Route className="size-8 animate-pulse text-primary/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function DeliveryRouteMap({
  restaurant,
  destinationAddress,
  destinationCoords,
  showEtaBanner = true,
}: {
  restaurant: RestaurantLike | null | undefined;
  destinationAddress: string;
  /** Coords GPS guardadas al registrar / checkout (más precisas que geocodificar texto). */
  destinationCoords?: LatLng | null;
  showEtaBanner?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [route, setRoute] = useState<DeliveryRouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const originKey = restaurant
    ? `${restaurant.name}|${restaurant.city}|${restaurant.address ?? ""}`
    : "";
  const destinationKey = destinationAddress.trim();
  const coordsKey = destinationCoords
    ? `${destinationCoords.lat},${destinationCoords.lng}`
    : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!restaurant || !destinationKey) {
      setLoading(false);
      setError("Falta la dirección del restaurante o de entrega.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void resolveDeliveryRoute({
      originQuery: buildRestaurantOriginQuery(restaurant),
      destinationQuery: destinationKey,
      destinationCoords: destinationCoords ?? null,
    })
      .then((result) => {
        if (cancelled) return;
        setRoute(result);
      })
      .catch(() => {
        if (cancelled) return;
        setError("No se pudo calcular la ruta ahora. Intenta actualizar.");
        setRoute(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originKey, destinationKey, coordsKey, restaurant, destinationCoords]);

  if (!mounted) {
    return <MapSkeleton />;
  }

  if (loading) {
    return <MapSkeleton />;
  }

  if (error || !route || !restaurant) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-6 text-center">
        <MapPinned className="mx-auto mb-2 size-7 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {error ?? "No hay datos suficientes para mostrar el mapa."}
        </p>
        {restaurant?.deliveryMinutes ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Clock3 className="size-3.5" />
            Estimado del restaurante · {restaurant.deliveryMinutes} min
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showEtaBanner ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
          <Clock3 className="size-4 shrink-0 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Llegada aproximada del domiciliario · {formatRouteEta(route.durationSeconds)}
          </p>
          <span className="text-xs text-muted-foreground">
            ({formatRouteDistance(route.distanceMeters)} en moto · ruta estimada, sin GPS en vivo)
          </span>
        </div>
      ) : null}

      <Suspense fallback={<MapSkeleton message="Cargando mapa…" />}>
        <DeliveryRouteMapInner
          route={route}
          restaurantName={restaurant.name}
          destinationLabel={destinationAddress}
        />
      </Suspense>

      <div className="space-y-2.5 rounded-xl border border-border bg-secondary/25 px-3 py-3 sm:px-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            R
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{restaurant.name}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground text-pretty">
              {restaurant.address?.trim()
                ? restaurant.address.trim()
                : restaurant.city}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 border-t border-border/70 pt-2.5">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber-brand text-[10px] font-bold text-ink">
            T
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Tu dirección</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground text-pretty">
              {destinationAddress}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
