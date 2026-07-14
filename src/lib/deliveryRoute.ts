export type LatLng = { lat: number; lng: number };

export type DeliveryRouteResult = {
  origin: LatLng;
  destination: LatLng;
  /** Coordenadas [lat, lng] para Leaflet */
  path: [number, number][];
  durationSeconds: number;
  distanceMeters: number;
};

/** Aproximaciones por zona/comuna de Cúcuta (fallback si falla el geocoder). */
const CUCUTA_AREA_COORDS: Record<string, LatLng> = {
  centro: { lat: 7.8939, lng: -72.5078 },
  "centro oriental": { lat: 7.888, lng: -72.492 },
  "oriental oriental": { lat: 7.882, lng: -72.48 },
  "oriental occidental": { lat: 7.895, lng: -72.52 },
  occidental: { lat: 7.9, lng: -72.53 },
  "sur occidental": { lat: 7.87, lng: -72.53 },
  "sur oriental": { lat: 7.87, lng: -72.48 },
  norte: { lat: 7.92, lng: -72.5 },
  atalaya: { lat: 7.868, lng: -72.525 },
  "la libertad": { lat: 7.91, lng: -72.515 },
  caobos: { lat: 7.8895, lng: -72.495 },
  "los caobos": { lat: 7.8895, lng: -72.495 },
  "13 de marzo": { lat: 7.91, lng: -72.498 },
  "san luis": { lat: 7.905, lng: -72.478 },
  "san martin": { lat: 7.918, lng: -72.505 },
  "el zulia": { lat: 7.935, lng: -72.6 },
  sevilla: { lat: 7.886, lng: -72.488 },
  guaimaral: { lat: 7.925, lng: -72.49 },
  cucuta: { lat: 7.889, lng: -72.503 },
};

/** Bounding box aproximado de Cúcuta para descartar matches lejanos. */
const CUCUTA_BBOX = {
  minLat: 7.8,
  maxLat: 8.05,
  minLng: -72.65,
  maxLng: -72.4,
};

const geocodeCache = new Map<string, LatLng>();
const routeCache = new Map<string, DeliveryRouteResult>();
const geocodeInflight = new Map<string, Promise<LatLng>>();
const routeInflight = new Map<string, Promise<DeliveryRouteResult>>();

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** ~11 m de precisión: evita cache miss en cada tick GPS. */
function roundCoord(value: number, decimals = 4): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function coordsCacheKey(coords: LatLng): string {
  return `coords:${roundCoord(coords.lat)},${roundCoord(coords.lng)}`;
}

type PhotonProps = {
  osm_key?: string;
  osm_value?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  suburb?: string;
  neighbourhood?: string;
  locality?: string;
  city?: string;
  county?: string;
  state?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProps;
};

/** Abreviaciones viales sin tocar el `#` (en Colombia es nomenclatura, no "número"). */
function expandStreetAbbreviations(query: string): string {
  return query
    .replace(/\bCll\.?\b/gi, "Calle")
    .replace(/\bCl\.?\b/gi, "Calle")
    .replace(/\bCra\.?\b/gi, "Carrera")
    .replace(/\bCr\.?\b/gi, "Carrera")
    .replace(/\bAvda\.?\b/gi, "Avenida")
    .replace(/\bAv\.?\b/gi, "Avenida")
    .replace(/\bDg\.?\b/gi, "Diagonal")
    .replace(/\bTv\.?\b/gi, "Transversal")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quita Local/Apto/Torre que confunden al geocoder. */
function stripUnitNoise(query: string): string {
  return query
    .replace(
      /\b(local|apto|apartamento|oficina|piso|torre|interno|int\.?|casa)\s*[\w./-]*/gi,
      " ",
    )
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

function withCucuta(query: string): string {
  const cleaned = query.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Cúcuta, Colombia";
  if (/cúcuta|cucuta/i.test(cleaned) && /colombia/i.test(cleaned)) return cleaned;
  if (/cúcuta|cucuta/i.test(cleaned)) return `${cleaned}, Colombia`;
  return `${cleaned}, Cúcuta, Colombia`;
}

/**
 * Genera variantes limpias de una dirección colombiana.
 * Evita `#` → "No" (rompe "Av. 1 Este #17-25" y formas mezcladas).
 */
function buildGeocodeCandidates(rawQuery: string): {
  queries: string[];
  barrioHint: string | null;
  streetHints: string[];
} {
  const stripped = stripUnitNoise(expandStreetAbbreviations(rawQuery));
  const barrioHint = extractAreaHint(stripped);
  const streetHints: string[] = [];
  const queries: string[] = [];

  const push = (q: string) => {
    const v = withCucuta(q);
    if (v && !queries.includes(v)) queries.push(v);
  };

  // "Avenida 1 Este #Calle 17 - 25" → cruce de vías (forma mezclada frecuente).
  const mixedHash = stripped.match(
    /^(.+?)\s*#\s*((?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[A-Za-z])?)\s*[-–]?\s*(\d+)?/i,
  );
  if (mixedHash) {
    const viaA = mixedHash[1]!.trim();
    const viaB = mixedHash[2]!.trim();
    const num = mixedHash[3]?.trim();
    streetHints.push(viaA, viaB);
    push([viaA, viaB, barrioHint, "Cúcuta"].filter(Boolean).join(", "));
    if (num) {
      push([`${viaB} ${num}`, viaA, barrioHint].filter(Boolean).join(", "));
    }
  }

  // Estándar CO: "Calle 4 #12-45" → "Calle 4 12-45"
  const standardHash = stripped.replace(
    /#\s*(\d[\w.-]*)(?:\s*[-–]\s*(\d[\w.-]*))?/g,
    (_m, a: string, b?: string) => (b ? ` ${a}-${b}` : ` ${a}`),
  );
  if (standardHash !== stripped || !mixedHash) {
    push(standardHash);
  }

  // Sin ruido de barrio al final: solo vías + barrio + ciudad
  const withoutCity = stripped
    .replace(/,?\s*norte de santander/gi, "")
    .replace(/,?\s*colombia/gi, "")
    .replace(/,?\s*cúcuta|,?\s*cucuta/gi, "")
    .trim();
  const hashless = withoutCity.replace(/#/g, " ").replace(/\s+/g, " ").trim();
  push([hashless, barrioHint].filter(Boolean).join(", "));

  // Si hay barrio conocido, consulta corta centrada en zona (mejor que un POI lejano).
  if (barrioHint) {
    push(`${barrioHint}, Cúcuta`);
  }

  push(stripped);

  // Tokens viales para puntuar resultados Photon.
  const viaMatches = stripped.matchAll(
    /\b(?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[Ee]ste|\s+[Oo]este|\s+[Nn]orte|\s+[Ss]ur|\s+[A-Za-z])?/gi,
  );
  for (const m of viaMatches) {
    const t = m[0]!.trim();
    if (!streetHints.some((s) => normalizeKey(s) === normalizeKey(t))) {
      streetHints.push(t);
    }
  }

  return { queries, barrioHint, streetHints };
}

function ensureCucutaContext(query: string): string {
  return buildGeocodeCandidates(query).queries[0] ?? withCucuta(query);
}

function isInCucutaArea(point: LatLng): boolean {
  return (
    point.lat >= CUCUTA_BBOX.minLat &&
    point.lat <= CUCUTA_BBOX.maxLat &&
    point.lng >= CUCUTA_BBOX.minLng &&
    point.lng <= CUCUTA_BBOX.maxLng
  );
}

function extractAreaHint(text: string): string | null {
  const afterDot = text.split("·").map((p) => p.trim()).filter(Boolean);
  if (afterDot.length >= 2) return afterDot[afterDot.length - 1] ?? null;

  const lower = normalizeKey(text);
  // Preferir claves más largas primero (p.ej. "san martin" antes que "norte").
  const keys = Object.keys(CUCUTA_AREA_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (key === "cucuta") continue;
    if (lower.includes(key)) return key;
  }
  return null;
}

function coordsFromAreaHint(text: string): LatLng {
  const hint = extractAreaHint(text);
  if (!hint) return CUCUTA_AREA_COORDS.cucuta!;
  const key = normalizeKey(hint);
  return CUCUTA_AREA_COORDS[key] ?? CUCUTA_AREA_COORDS.cucuta!;
}

function featurePoint(feature: PhotonFeature): LatLng | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function featureText(props: PhotonProps | undefined): string {
  if (!props) return "";
  return normalizeKey(
    [
      props.name,
      props.street,
      props.housenumber,
      props.district,
      props.suburb,
      props.neighbourhood,
      props.locality,
      props.city,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * Puntúa un resultado Photon: prioriza calles/edificios y barrio;
 * penaliza parques, hoteles y POIs genéricos (causan el "R" en Club de Cazadores).
 */
function scorePhotonFeature(
  feature: PhotonFeature,
  ctx: { barrioHint: string | null; streetHints: string[] },
): number {
  const point = featurePoint(feature);
  if (!point || !isInCucutaArea(point)) return -1000;

  const props = feature.properties ?? {};
  const key = props.osm_key ?? "";
  const value = props.osm_value ?? "";
  const text = featureText(props);
  let score = 10;

  if (key === "highway") score += 45;
  else if (key === "building" || (key === "place" && value === "house")) score += 40;
  else if (key === "place") score += 15;
  else if (key === "amenity" || key === "tourism" || key === "leisure" || key === "shop") {
    score -= 35;
  }

  if (ctx.barrioHint) {
    const barrio = normalizeKey(ctx.barrioHint);
    if (text.includes(barrio) || text.includes(normalizeKey(`los ${barrio}`))) {
      score += 55;
    }
    // Comuna 2 ≈ Caobos / Centro Oriental
    if (barrio.includes("caobos") && /comuna\s*2|centro oriental/.test(text)) {
      score += 25;
    }
  }

  for (const hint of ctx.streetHints) {
    const n = normalizeKey(hint);
    if (n.length >= 4 && text.includes(n)) score += 28;
    // "avenida 1 este" vs name "avenida 1e"
    const compact = n.replace(/\s+/g, "");
    const textCompact = text.replace(/\s+/g, "");
    if (compact.length >= 5 && textCompact.includes(compact)) score += 18;
    if (/\b1\s*e\b|\b1e\b/.test(n.replace("avenida", "").trim()) && /\b1e\b/.test(text)) {
      score += 20;
    }
  }

  return score;
}

async function fetchPhotonFeatures(query: string): Promise<PhotonFeature[]> {
  // Photon solo acepta lang: default | de | en | fr (NO "es").
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

async function geocodeWithPhotonScored(
  queries: string[],
  ctx: { barrioHint: string | null; streetHints: string[] },
): Promise<LatLng | null> {
  let best: { point: LatLng; score: number } | null = null;

  for (const query of queries.slice(0, 4)) {
    const features = await fetchPhotonFeatures(query);
    for (const feature of features) {
      const point = featurePoint(feature);
      if (!point) continue;
      const score = scorePhotonFeature(feature, ctx);
      if (!best || score > best.score) best = { point, score };
    }
    // Buen match de calle/barrio: no hace falta seguir consultando.
    if (best && best.score >= 70) break;
  }

  // Exigir puntuación mínima para no clavar un parque/POI aleatorio.
  if (best && best.score >= 20) return best.point;
  return null;
}

async function geocodeWithNominatim(query: string): Promise<LatLng | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=co&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    type?: string;
    class?: string;
    display_name?: string;
  }>;

  let best: { point: LatLng; score: number } | null = null;
  for (const hit of data) {
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const point = { lat, lng };
    if (!isInCucutaArea(point)) continue;

    let score = 10;
    const cls = hit.class ?? "";
    const typ = hit.type ?? "";
    if (cls === "highway" || typ === "residential") score += 40;
    if (cls === "building" || typ === "house") score += 35;
    if (cls === "leisure" || cls === "tourism") score -= 30;
    if (!best || score > best.score) best = { point, score };
  }

  return best && best.score >= 20 ? best.point : null;
}

export async function geocodeAddress(query: string): Promise<LatLng> {
  const key = normalizeKey(query);
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const pending = geocodeInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const { queries, barrioHint, streetHints } = buildGeocodeCandidates(query);
    const ctx = { barrioHint, streetHints };

    try {
      const photonHit = await geocodeWithPhotonScored(queries, ctx);
      if (photonHit) {
        geocodeCache.set(key, photonHit);
        return photonHit;
      }

      for (const q of queries.slice(0, 3)) {
        const nominatimHit = await geocodeWithNominatim(q);
        if (nominatimHit) {
          geocodeCache.set(key, nominatimHit);
          return nominatimHit;
        }
      }
    } catch {
      /* fallback por zona */
    }

    // Último recurso: centroide del barrio (mejor que un POI incorrecto).
    return coordsFromAreaHint(query);
  })().finally(() => {
    geocodeInflight.delete(key);
  });

  geocodeInflight.set(key, request);
  return request;
}

export async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<Omit<DeliveryRouteResult, "origin" | "destination"> | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: Array<{
      duration: number;
      distance: number;
      geometry?: { coordinates?: [number, number][] };
    }>;
  };
  const route = data.routes?.[0];
  if (!route) return null;

  const path: [number, number][] = (route.geometry?.coordinates ?? []).map(
    ([lng, lat]) => [lat, lng],
  );

  if (path.length < 2) {
    path.push([origin.lat, origin.lng], [destination.lat, destination.lng]);
  }

  return {
    path,
    durationSeconds: Math.round(route.duration),
    distanceMeters: Math.round(route.distance),
  };
}

export async function resolveDeliveryRoute(input: {
  originQuery: string;
  destinationQuery: string;
  /** Si el usuario guardó GPS al registrarse / checkout, úsalo directo. */
  originCoords?: LatLng | null;
  destinationCoords?: LatLng | null;
}): Promise<DeliveryRouteResult> {
  const originKey = input.originCoords
    ? coordsCacheKey(input.originCoords)
    : normalizeKey(input.originQuery);
  const destKey = input.destinationCoords
    ? coordsCacheKey(input.destinationCoords)
    : normalizeKey(input.destinationQuery);
  const cacheKey = `${originKey}→${destKey}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const pending = routeInflight.get(cacheKey);
  if (pending) return pending;

  const request = (async () => {
    const [origin, destination] = await Promise.all([
      input.originCoords
        ? Promise.resolve(input.originCoords)
        : geocodeAddress(input.originQuery),
      input.destinationCoords
        ? Promise.resolve(input.destinationCoords)
        : geocodeAddress(input.destinationQuery),
    ]);

    const routed = await fetchDrivingRoute(origin, destination).catch(() => null);

    const result: DeliveryRouteResult =
      routed != null
        ? { origin, destination, ...routed }
        : {
            origin,
            destination,
            path: [
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ],
            durationSeconds: estimateStraightDuration(origin, destination),
            distanceMeters: haversineMeters(origin, destination),
          };

    routeCache.set(cacheKey, result);
    return result;
  })().finally(() => {
    routeInflight.delete(cacheKey);
  });

  routeInflight.set(cacheKey, request);
  return request;
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** ~22 km/h promedio urbano moto + factor de calle. */
function estimateStraightDuration(a: LatLng, b: LatLng): number {
  const meters = haversineMeters(a, b) * 1.35;
  return Math.round((meters / 1000 / 22) * 3600);
}

export function formatRouteEta(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes < 60) return `≈ ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `≈ ${h} h ${m} min` : `≈ ${h} h`;
}

export function formatRouteDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function buildRestaurantOriginQuery(restaurant: {
  name: string;
  city: string;
  address?: string | null;
}): string {
  if (restaurant.address?.trim()) {
    return ensureCucutaContext(restaurant.address.trim());
  }
  return ensureCucutaContext(`${restaurant.name}, ${restaurant.city}`);
}
