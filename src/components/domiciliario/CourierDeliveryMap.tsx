import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Clock3, MapPinned, Navigation, Route } from "lucide-react";
import { fetchRestaurantsCached } from "@/lib/api/cliente/clientCatalogCache";
import {
  buildRestaurantOriginQuery,
  formatRouteDistance,
  formatRouteEta,
  resolveDeliveryRoute,
  type DeliveryRouteResult,
  type LatLng,
} from "@/lib/deliveryRoute";

const DeliveryRouteMapInner = lazy(() => import("@/components/cliente/DeliveryRouteMapInner"));

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

function useWatchPosition(enabled: boolean) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Tu dispositivo no soporta GPS.");
      return;
    }
    if (!window.isSecureContext) {
      setError("El GPS en vivo requiere HTTPS o localhost.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Revisa permisos de ubicación.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 20_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}

/**
 * Mapa del panel domiciliario: restaurante (R) → entrega (T) + GPS en vivo (Yo).
 */
export function CourierDeliveryMap({
  restaurantId,
  restaurantFallback,
  destinationAddress,
}: {
  restaurantId?: string | null;
  restaurantFallback?: RestaurantLike | null;
  destinationAddress: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantLike | null>(
    restaurantFallback ?? null,
  );
  const [restaurantReady, setRestaurantReady] = useState(
    Boolean(restaurantFallback) || !restaurantId,
  );
  const [route, setRoute] = useState<DeliveryRouteResult | null>(null);
  const [livePath, setLivePath] = useState<[number, number][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { position: livePosition, error: gpsError } = useWatchPosition(true);
  const liveRef = useRef(livePosition);
  liveRef.current = livePosition;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (restaurantFallback) {
      setRestaurant(restaurantFallback);
      setRestaurantReady(true);
      return;
    }
    if (!restaurantId) {
      setRestaurantReady(true);
      return;
    }

    let cancelled = false;
    setRestaurantReady(false);
    void fetchRestaurantsCached()
      .then((list) => {
        if (cancelled) return;
        const found = list.find((r) => r.id === restaurantId);
        if (found) {
          setRestaurant({
            name: found.name,
            city: found.city,
            address: found.address ?? null,
            deliveryMinutes: found.deliveryMinutes,
          });
        }
      })
      .catch(() => {
        /* el mapa aún puede mostrar destino + GPS */
      })
      .finally(() => {
        if (!cancelled) setRestaurantReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, restaurantFallback]);

  const destinationKey = destinationAddress.trim();
  const originKey = restaurant
    ? `${restaurant.name}|${restaurant.city}|${restaurant.address ?? ""}`
    : "";
  const destLat = route?.destination.lat ?? null;
  const destLng = route?.destination.lng ?? null;

  useEffect(() => {
    if (!destinationKey) {
      setLoading(false);
      setError("Falta la dirección de entrega.");
      return;
    }
    if (!restaurantReady) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        if (restaurant) {
          const result = await resolveDeliveryRoute({
            originQuery: buildRestaurantOriginQuery(restaurant),
            destinationQuery: destinationKey,
          });
          if (!cancelled) setRoute(result);
          return;
        }

        const live = liveRef.current;
        const result = await resolveDeliveryRoute({
          originQuery: live ? "courier-live" : destinationKey,
          destinationQuery: destinationKey,
          originCoords: live ?? undefined,
        });
        if (!cancelled) setRoute(result);
      } catch {
        if (!cancelled) {
          setError("No se pudo calcular la ruta ahora.");
          setRoute(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [originKey, destinationKey, restaurantReady, Boolean(restaurant)]);

  useEffect(() => {
    if (destLat == null || destLng == null) {
      setLivePath(null);
      return;
    }

    let cancelled = false;
    const destination: LatLng = { lat: destLat, lng: destLng };
    let lastRouted: LatLng | null = null;

    const loadLiveRoute = (live: LatLng) => {
      // No recalcular OSRM si el GPS apenas se movió (~40 m).
      if (
        lastRouted &&
        Math.abs(lastRouted.lat - live.lat) < 0.0004 &&
        Math.abs(lastRouted.lng - live.lng) < 0.0004
      ) {
        return;
      }
      lastRouted = live;
      void resolveDeliveryRoute({
        originQuery: "courier-live",
        destinationQuery: destinationKey,
        originCoords: live,
        destinationCoords: destination,
      })
        .then((result) => {
          if (!cancelled) setLivePath(result.path);
        })
        .catch(() => {
          if (!cancelled) {
            setLivePath([
              [live.lat, live.lng],
              [destination.lat, destination.lng],
            ]);
          }
        });
    };

    // Debounce: espera GPS estable; evita 2–3 OSRM al montar.
    const initialTimer = window.setTimeout(() => {
      const live = liveRef.current;
      if (live) loadLiveRoute(live);
    }, 1_200);

    const timer = window.setInterval(() => {
      const live = liveRef.current;
      if (live) loadLiveRoute(live);
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [destLat, destLng, destinationKey]);

  const navigation = useMemo(() => {
    const dest = route?.destination;
    if (dest) {
      const destStr = `${dest.lat},${dest.lng}`;
      const originStr = livePosition
        ? `${livePosition.lat},${livePosition.lng}`
        : undefined;
      const google = originStr
        ? `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=driving`;
      const waze = `https://waze.com/ul?ll=${dest.lat}%2C${dest.lng}&navigate=yes`;
      return { google, waze };
    }
    const encoded = encodeURIComponent(destinationAddress);
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`,
      waze: `https://waze.com/ul?q=${encoded}&navigate=yes`,
    };
  }, [route, livePosition, destinationAddress]);

  if (!mounted) return <MapSkeleton />;
  if (loading || !restaurantReady) return <MapSkeleton />;

  if (error || !route) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-6 text-center">
          <MapPinned className="mx-auto mb-2 size-7 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {error ?? "No hay datos suficientes para mostrar el mapa."}
          </p>
        </div>
        <NavButtons google={navigation.google} waze={navigation.waze} />
      </div>
    );
  }

  const restaurantName = restaurant?.name ?? "Restaurante";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
        <Clock3 className="size-4 shrink-0 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Cómo llegar · {formatRouteEta(route.durationSeconds)} ·{" "}
          {formatRouteDistance(route.distanceMeters)}
        </p>
        <span className="text-xs text-muted-foreground">
          {livePosition
            ? "Ruta naranja: desde tu GPS a la entrega"
            : "Activa ubicación para verte en el mapa"}
        </span>
      </div>

      {gpsError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {gpsError}
        </p>
      ) : null}

      <Suspense fallback={<MapSkeleton message="Cargando mapa…" />}>
        <DeliveryRouteMapInner
          route={route}
          restaurantName={restaurantName}
          destinationLabel={destinationAddress}
          livePosition={livePosition}
          livePath={livePath}
          bannerMode="courier"
        />
      </Suspense>

      <div className="space-y-2.5 rounded-xl border border-border bg-secondary/25 px-3 py-3 sm:px-4">
        <LegendRow
          tone="origin"
          title={restaurantName}
          subtitle={restaurant?.address?.trim() || restaurant?.city || "Punto de recogida"}
        />
        <LegendRow tone="dest" title="Entrega" subtitle={destinationAddress} />
        <LegendRow
          tone="live"
          title="Tu ubicación"
          subtitle={livePosition ? "GPS en vivo activo" : "Esperando permiso de ubicación…"}
        />
      </div>

      <NavButtons google={navigation.google} waze={navigation.waze} />
    </div>
  );
}

function LegendRow({
  tone,
  title,
  subtitle,
}: {
  tone: "origin" | "dest" | "live";
  title: string;
  subtitle: string;
}) {
  const badge =
    tone === "origin"
      ? "bg-primary text-primary-foreground"
      : tone === "dest"
        ? "bg-amber-brand text-ink"
        : "bg-orange-500 text-white";
  const label = tone === "origin" ? "R" : tone === "dest" ? "T" : "Yo";

  return (
    <div
      className={`flex items-start gap-2.5 ${tone !== "origin" ? "border-t border-border/70 pt-2.5" : ""}`}
    >
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${badge}`}
      >
        {label}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground text-pretty">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function NavButtons({ google, waze }: { google: string; waze: string }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-cream shadow-sm">
      <a
        href={google}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-r border-border py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary/50"
      >
        <Navigation className="size-4 text-primary" />
        Google Maps
      </a>
      <a
        href={waze}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3.5 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-secondary/50"
      >
        <Navigation className="size-4 text-[#33CCFF]" />
        Waze
      </a>
    </div>
  );
}
