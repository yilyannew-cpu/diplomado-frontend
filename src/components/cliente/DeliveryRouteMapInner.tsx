import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { DeliveryRouteResult, LatLng } from "@/lib/deliveryRoute";
import { formatRouteDistance, formatRouteEta } from "@/lib/deliveryRoute";
import "leaflet/dist/leaflet.css";

function makeDivIcon(kind: "origin" | "destination" | "courier") {
  const styles: Record<typeof kind, { bg: string; label: string }> = {
    origin: { bg: "oklch(0.52 0.22 277)", label: "R" },
    destination: { bg: "oklch(0.82 0.12 88)", label: "T" },
    courier: { bg: "oklch(0.55 0.2 25)", label: "Yo" },
  };
  const { bg, label } = styles[kind];
  return L.divIcon({
    className: "",
    iconSize: kind === "courier" ? [34, 34] : [28, 28],
    iconAnchor: kind === "courier" ? [17, 17] : [14, 14],
    html: `<div style="
      width:${kind === "courier" ? 34 : 28}px;height:${kind === "courier" ? 34 : 28}px;border-radius:9999px;
      display:grid;place-items:center;
      background:${bg};
      color:white;font-size:${kind === "courier" ? 10 : 11}px;font-weight:700;
      border:2px solid white;
      box-shadow:0 4px 12px rgba(15,23,42,.25);
    ">${label}</div>`,
  });
}

function FitRoute({
  route,
  livePosition,
}: {
  route: DeliveryRouteResult;
  livePosition?: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [route.origin.lat, route.origin.lng],
      [route.destination.lat, route.destination.lng],
      ...route.path,
    ];
    if (livePosition) {
      points.push([livePosition.lat, livePosition.lng]);
    }
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 });
  }, [map, route, livePosition]);

  return null;
}

export default function DeliveryRouteMapInner({
  route,
  restaurantName,
  destinationLabel,
  livePosition = null,
  livePath = null,
  bannerMode = "client",
}: {
  route: DeliveryRouteResult;
  restaurantName: string;
  destinationLabel: string;
  /** GPS en vivo del domiciliario. */
  livePosition?: LatLng | null;
  /** Ruta opcional desde el GPS hacia la entrega. */
  livePath?: [number, number][] | null;
  bannerMode?: "client" | "courier";
}) {
  const originIcon = useMemo(() => makeDivIcon("origin"), []);
  const destIcon = useMemo(() => makeDivIcon("destination"), []);
  const courierIcon = useMemo(() => makeDivIcon("courier"), []);
  const center: [number, number] = [
    (route.origin.lat + route.destination.lat) / 2,
    (route.origin.lng + route.destination.lng) / 2,
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="z-0 h-56 w-full sm:h-72"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute route={route} livePosition={livePosition} />
        <Polyline
          positions={route.path}
          pathOptions={{
            color: "#4f46e5",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        {livePath && livePath.length >= 2 ? (
          <Polyline
            positions={livePath}
            pathOptions={{
              color: "#ea580c",
              weight: 4,
              opacity: 0.9,
              dashArray: "8 6",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : null}
        <Marker position={[route.origin.lat, route.origin.lng]} icon={originIcon}>
          <Popup>
            <strong>Restaurante</strong>
            <br />
            {restaurantName}
          </Popup>
        </Marker>
        <Marker
          position={[route.destination.lat, route.destination.lng]}
          icon={destIcon}
        >
          <Popup>
            <strong>Entrega</strong>
            <br />
            {destinationLabel}
          </Popup>
        </Marker>
        {livePosition ? (
          <>
            <CircleMarker
              center={[livePosition.lat, livePosition.lng]}
              radius={18}
              pathOptions={{
                color: "#ea580c",
                fillColor: "#fb923c",
                fillOpacity: 0.2,
                weight: 1,
              }}
            />
            <Marker
              position={[livePosition.lat, livePosition.lng]}
              icon={courierIcon}
            >
              <Popup>
                <strong>Tu ubicación</strong>
                <br />
                GPS en vivo
              </Popup>
            </Marker>
          </>
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap gap-2 sm:inset-x-4 sm:bottom-4">
        <span className="pointer-events-auto rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
          {bannerMode === "courier"
            ? `Ruta restaurante → entrega · ${formatRouteEta(route.durationSeconds)}`
            : `Tiempo de ruta (restaurante → casa) · ${formatRouteEta(route.durationSeconds)}`}
        </span>
        <span className="pointer-events-auto rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
          {formatRouteDistance(route.distanceMeters)}
          {bannerMode === "courier"
            ? livePosition
              ? " · punto naranja = tú"
              : " · activa GPS para verte en el mapa"
            : " · no incluye llegada del domi al restaurante"}
        </span>
      </div>
    </div>
  );
}
