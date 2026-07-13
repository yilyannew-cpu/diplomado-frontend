import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { DeliveryRouteResult } from "@/lib/deliveryRoute";
import { formatRouteDistance, formatRouteEta } from "@/lib/deliveryRoute";
import "leaflet/dist/leaflet.css";

function makeDivIcon(kind: "origin" | "destination") {
  const isOrigin = kind === "origin";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:9999px;
      display:grid;place-items:center;
      background:${isOrigin ? "oklch(0.52 0.22 277)" : "oklch(0.82 0.12 88)"};
      color:white;font-size:11px;font-weight:700;
      border:2px solid white;
      box-shadow:0 4px 12px rgba(15,23,42,.25);
    ">${isOrigin ? "R" : "T"}</div>`,
  });
}

function FitRoute({ route }: { route: DeliveryRouteResult }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [route.origin.lat, route.origin.lng],
      [route.destination.lat, route.destination.lng],
      ...route.path,
    ];
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, route]);

  return null;
}

export default function DeliveryRouteMapInner({
  route,
  restaurantName,
  destinationLabel,
}: {
  route: DeliveryRouteResult;
  restaurantName: string;
  destinationLabel: string;
}) {
  const originIcon = useMemo(() => makeDivIcon("origin"), []);
  const destIcon = useMemo(() => makeDivIcon("destination"), []);
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
        <FitRoute route={route} />
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
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] flex flex-wrap gap-2 sm:inset-x-4 sm:bottom-4">
        <span className="pointer-events-auto rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur-sm">
          Tiempo estimado de ruta · {formatRouteEta(route.durationSeconds)}
        </span>
        <span className="pointer-events-auto rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
          {formatRouteDistance(route.distanceMeters)} · restaurante → tu dirección
        </span>
      </div>
    </div>
  );
}
