export type LatLng = { lat: number; lng: number };

export type DeliveryRouteResult = {
  origin: LatLng;
  destination: LatLng;
  /** Coordenadas [lat, lng] para Leaflet */
  path: [number, number][];
  durationSeconds: number;
  distanceMeters: number;
};

/** Aproximaciones por barrio/zona de Cúcuta (ancla de geocoding + fallback). */
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
  caobos: { lat: 7.88296, lng: -72.49514 },
  "los caobos": { lat: 7.88296, lng: -72.49514 },
  "barrio blanco": { lat: 7.8811, lng: -72.4955 },
  "13 de marzo": { lat: 7.9041, lng: -72.4677 },
  "san luis": { lat: 7.905, lng: -72.478 },
  "san martin": { lat: 7.9063, lng: -72.4737 },
  "el zulia": { lat: 7.935, lng: -72.6 },
  sevilla: { lat: 7.886, lng: -72.488 },
  guaimaral: { lat: 7.925, lng: -72.49 },
  ceiba: { lat: 7.875, lng: -72.475 },
  prados: { lat: 7.9116, lng: -72.4726 },
  "prados del este": { lat: 7.9116, lng: -72.4726 },
  belen: { lat: 7.86, lng: -72.49 },
  trigal: { lat: 7.865, lng: -72.535 },
  "los pinos": { lat: 7.895, lng: -72.535 },
  carora: { lat: 7.89, lng: -72.505 },
  lleras: { lat: 7.9, lng: -72.52 },
  "barrio popular": { lat: 7.892, lng: -72.497 },
  "quinto bosch": { lat: 7.898, lng: -72.499 },
  "quinta bosch": { lat: 7.898, lng: -72.499 },
  "las almeidas": { lat: 7.9066, lng: -72.4855 },
  "minuto de dios": { lat: 7.89, lng: -72.543 },
  "la coralina": { lat: 7.893, lng: -72.543 },
  higueron: { lat: 7.908, lng: -72.468 },
  cucuta: { lat: 7.889, lng: -72.503 },
};

/** Barrios/zonas demasiado genéricas para anclar (coinciden con cardinales de calle). */
const AMBIGUOUS_AREA_KEYS = new Set([
  "norte",
  "occidental",
  "centro",
  "oriental oriental",
  "oriental occidental",
  "sur occidental",
  "sur oriental",
  "cucuta",
]);

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

type NominatimRawHit = {
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
  display_name?: string;
};

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

/** Caché HTTP de Nominatim/Photon/OSRM (evita ráfagas al abrir el mapa). */
const nominatimCache = new Map<string, NominatimRawHit[]>();
const nominatimInflight = new Map<string, Promise<NominatimRawHit[]>>();
const photonCache = new Map<string, PhotonFeature[]>();
const photonInflight = new Map<string, Promise<PhotonFeature[]>>();
const osrmCache = new Map<string, Omit<DeliveryRouteResult, "origin" | "destination">>();
const osrmInflight = new Map<
  string,
  Promise<Omit<DeliveryRouteResult, "origin" | "destination"> | null>
>();

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

/**
 * En OSM/Cúcuta las avenidas suelen ir como "Avenida 1E", no "Avenida 1 Este".
 * Sin esto Photon confunde "1 Este" con "Avenida 17E" y acorta la ruta (~3.5 km).
 */
function normalizeCucutaRoadNames(query: string): string {
  return query
    .replace(/\b(Avenida|Av\.?|Avda\.?)\s+(\d+)\s*Este\b/gi, "Avenida $2E")
    .replace(/\b(Avenida|Av\.?|Avda\.?)\s+(\d+)\s*Oeste\b/gi, "Avenida $2O")
    .replace(/\b(Calle|Carrera)\s+(\d+)\s*([A-Za-z])\s+Norte\b/gi, "$1 $2$3 Norte")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrae número de vía: "avenida 1e" → 1, "avenida 17e" → 17. */
function extractRoadNumber(text: string): number | null {
  const m = normalizeKey(text).match(
    /\b(?:avenida|calle|carrera|diagonal|transversal)\s+(\d+)/,
  );
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Token vial compacto: "Avenida 1E" → "1e", "Calle 4 A Norte" → "4anorte". */
function extractRoadToken(text: string): string | null {
  const n = normalizeKey(normalizeCucutaRoadNames(text));
  const m = n.match(
    /\b(?:avenida|calle|carrera|diagonal|transversal)\s+(\d+[a-z]?(?:\s*(?:norte|sur|este|oeste))?)/,
  );
  if (!m) return null;
  return m[1]!.replace(/\s+/g, "");
}

function resolveBarrioCenter(barrioHint: string | null): LatLng | null {
  if (!barrioHint) return null;
  const key = normalizeKey(barrioHint);
  return (
    CUCUTA_AREA_COORDS[key] ??
    CUCUTA_AREA_COORDS[`los ${key}`] ??
    CUCUTA_AREA_COORDS[key.replace(/^los\s+/, "")] ??
    null
  );
}

/** ¿El texto del geocoder menciona este barrio (o "los X")? */
function textMentionsBarrio(text: string, barrioHint: string): boolean {
  const t = normalizeKey(text);
  const b = normalizeKey(barrioHint);
  if (!b) return false;
  if (t.includes(b)) return true;
  if (t.includes(`los ${b}`)) return true;
  const withoutLos = b.replace(/^los\s+/, "");
  return withoutLos !== b && t.includes(withoutLos);
}

/**
 * Puntos por cercanía al barrio indicado (cualquier barrio de Cúcuta).
 * Evita clavar una misma avenida en otro tramo de la ciudad.
 */
function scoreBarrioProximity(
  point: LatLng,
  resultText: string,
  barrioHint: string | null,
): number {
  if (!barrioHint) return 0;
  let score = 0;
  if (textMentionsBarrio(resultText, barrioHint)) score += 90;

  const center = resolveBarrioCenter(barrioHint);
  if (center) {
    const meters = haversineMeters(point, center);
    if (meters <= 700) score += 70;
    else if (meters <= 1200) score += 25;
    else if (meters > 2200) score -= 90;
  }

  // Si el resultado nombra OTRO barrio conocido distinto, penalizar.
  const otherBarrios = Object.keys(CUCUTA_AREA_COORDS)
    .filter((k) => !AMBIGUOUS_AREA_KEYS.has(k) && k !== "cucuta")
    .sort((a, b) => b.length - a.length);
  const hintKey = normalizeKey(barrioHint);
  for (const other of otherBarrios) {
    if (other === hintKey || hintKey.includes(other) || other.includes(hintKey)) continue;
    if (other === `los ${hintKey}` || hintKey === `los ${other}`) continue;
    if (textMentionsBarrio(resultText, other) && !textMentionsBarrio(resultText, barrioHint)) {
      score -= 55;
      break;
    }
  }
  return score;
}

/** Penaliza "Avenida 17E" cuando se pedía "Avenida 1E" (cualquier vía). */
function scoreRoadTokenMatch(queryOrHint: string, resultText: string): number {
  const want = extractRoadToken(queryOrHint);
  const got = extractRoadToken(resultText);
  if (!want || !got) {
    const wantNum = extractRoadNumber(queryOrHint);
    const gotNum = extractRoadNumber(resultText);
    if (wantNum != null && gotNum != null) {
      return wantNum === gotNum ? 40 : -70;
    }
    return 0;
  }
  if (want === got) return 50;
  // Mismo dígito inicial pero sufijo distinto (1e vs 17e) o número distinto.
  return -90;
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
  /** Cruce colombiano: vía A # vía B (p. ej. Av 1E # Calle 17). */
  crossStreets: { viaA: string; viaB: string } | null;
} {
  const full = normalizeCucutaRoadNames(
    stripUnitNoise(expandStreetAbbreviations(rawQuery)),
  );
  // Si viene "Platano Verde, Avenida 1E # Calle 17…", aislar el tramo vial.
  const roadOnlyMatch = full.match(
    /\b((?:Calle|Carrera|Avenida|Diagonal|Transversal)\b[\s\S]*)$/i,
  );
  const poiName =
    roadOnlyMatch && roadOnlyMatch.index && roadOnlyMatch.index > 0
      ? full.slice(0, roadOnlyMatch.index).replace(/[,\s]+$/g, "").trim()
      : null;
  const stripped = roadOnlyMatch?.[1]?.trim() || full;

  const barrioHint = extractAreaHint(full) ?? extractAreaHint(stripped);
  const streetHints: string[] = [];
  const queries: string[] = [];
  let crossStreets: { viaA: string; viaB: string } | null = null;

  const push = (q: string) => {
    const v = withCucuta(q);
    if (v && !queries.includes(v)) queries.push(v);
  };

  // Primero vías (+ barrio). El nombre del local va al final (puede geocodificar mal).

  // "Avenida 1E #Calle 17 - 25" → cruce de vías (forma mezclada frecuente en Cúcuta).
  const mixedHash = stripped.match(
    /^(.+?)\s*#\s*((?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[A-Za-z])?)\s*[-–]?\s*(\d+)?/i,
  );
  if (mixedHash) {
    const viaA = normalizeCucutaRoadNames(mixedHash[1]!.trim());
    const viaB = mixedHash[2]!.trim();
    const num = mixedHash[3]?.trim();
    streetHints.push(viaA, viaB);
    crossStreets = { viaA, viaB };

    // Orden crítico: con barrio primero. Sin barrio, la misma vía puede
    // geocodificarse en otro tramo de la ciudad (p. ej. Av 1E → Barrio Popular).
    if (barrioHint) {
      push([viaA, barrioHint].join(", "));
      push([viaB, barrioHint].join(", "));
      push([viaA, viaB, barrioHint].join(", "));
      if (num) {
        push([`${viaB} ${num}`, viaA, barrioHint].join(", "));
      }
    }
    push([viaA, viaB].filter(Boolean).join(", "));
    push(`${viaA} con ${viaB}`);
    if (num) {
      push([`${viaB} ${num}`, viaA].filter(Boolean).join(", "));
    }
  }

  // "Avenida 1E, Calle 17" / "Avenida 1E con Calle 17" (sin #, tras normalizar).
  if (!crossStreets) {
    const commaCross = stripped.match(
      /^((?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[A-Za-z])?(?:\s+(?:Norte|Sur|Este|Oeste))?)\s*(?:,|\s+con\s+)\s*((?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[A-Za-z])?)/i,
    );
    if (commaCross) {
      const viaA = normalizeCucutaRoadNames(commaCross[1]!.trim());
      const viaB = commaCross[2]!.trim();
      streetHints.push(viaA, viaB);
      crossStreets = { viaA, viaB };
      if (barrioHint) {
        push([viaA, viaB, barrioHint].join(", "));
        push([viaA, barrioHint].join(", "));
      }
      push([viaA, viaB].join(", "));
      push(`${viaA} con ${viaB}`);
    }
  }

  // Estándar CO: "Calle 4 #12-45" / "Calle 4 A Norte #12-45" → sin #
  const standardHash = stripped.replace(
    /#\s*(\d[\w.-]*)(?:\s*[-–]\s*(\d[\w.-]*))?/g,
    (_m, a: string, b?: string) => (b ? ` ${a}-${b}` : ` ${a}`),
  );

  const streetWithNumber = standardHash.match(
    /^((?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[A-Za-z])?(?:\s+(?:Norte|Sur|Este|Oeste))?)\s+(\d[\w.-]*(?:-\d[\w.-]*)?)/i,
  );
  if (streetWithNumber) {
    const via = streetWithNumber[1]!.trim();
    const num = streetWithNumber[2]!.trim();
    streetHints.push(via);
    if (barrioHint) {
      push([via, num, barrioHint].join(", "));
      push([via, barrioHint].join(", "));
    }
    push([via, num].join(", "));
    push(`${via} ${num}`);
  }

  if (barrioHint) {
    push([standardHash, barrioHint].filter(Boolean).join(", "));
  }
  if (standardHash !== stripped || !mixedHash) {
    push(standardHash);
  }

  const withoutCity = stripped
    .replace(/,?\s*norte de santander/gi, "")
    .replace(/,?\s*colombia/gi, "")
    .replace(/,?\s*cúcuta|,?\s*cucuta/gi, "")
    .trim();
  const hashless = withoutCity.replace(/#/g, " ").replace(/\s+/g, " ").trim();
  if (barrioHint) {
    push([hashless, barrioHint].join(", "));
    push(`${barrioHint}, Cúcuta`);
  }
  push(hashless);

  push(stripped);

  // Nombre del local al final (útil si OSM tiene el POI; no debe ganar a la vía).
  if (poiName && poiName.length >= 3) {
    if (barrioHint) push(`${poiName}, ${barrioHint}, Cúcuta`);
    push(`${poiName}, Cúcuta`);
  }

  const viaMatches = stripped.matchAll(
    /\b(?:Calle|Carrera|Avenida|Diagonal|Transversal)\s+[\w]+(?:\s+[Ee]ste|\s+[Oo]este|\s+[Nn]orte|\s+[Ss]ur|\s+[A-Za-z])?/gi,
  );
  for (const m of viaMatches) {
    const t = normalizeCucutaRoadNames(m[0]!.trim());
    if (!streetHints.some((s) => normalizeKey(s) === normalizeKey(t))) {
      streetHints.push(t);
    }
  }

  return { queries, barrioHint, streetHints, crossStreets };
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

/**
 * Direcciones viales con cardinal (Calle 4 A Norte, Av. 1 Este) NO son barrios.
 * Antes "norte"/"este" activaban el centroide de comuna y acortaban la ruta (~3.5 km vs ~6 km).
 */
function stripStreetCardinals(text: string): string {
  return text
    .replace(
      /\b(?:Calle|Carrera|Avenida|Diagonal|Transversal|Cl\.?|Cll\.?|Cra\.?|Cr\.?|Av\.?|Avda\.?)\s+[\w]+(?:\s+[A-Za-z])?\s+(?:Norte|Sur|Este|Oeste|Oriental|Occidental)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function extractAreaHint(text: string): string | null {
  // "Calle X, 13 de Marzo, Cúcuta" → tomar partes separadas por coma / ·
  const parts = text
    .split(/[·,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]!;
    const key = normalizeKey(part);
    if (!key || /cúcuta|cucuta|colombia|norte de santander/.test(key)) continue;
    if (AMBIGUOUS_AREA_KEYS.has(key)) continue;
    if (CUCUTA_AREA_COORDS[key] || CUCUTA_AREA_COORDS[`los ${key}`]) {
      return CUCUTA_AREA_COORDS[key] ? key : `los ${key}`;
    }
    // "Barrio Caobos" / "Los Caobos"
    const barrioWord = key.replace(/^barrio\s+/, "").replace(/^los\s+/, "");
    if (barrioWord !== key) {
      if (CUCUTA_AREA_COORDS[barrioWord]) return barrioWord;
      if (CUCUTA_AREA_COORDS[`los ${barrioWord}`]) return `los ${barrioWord}`;
    }
  }

  // Buscar barrio solo fuera del tramo "Calle/Carrera … Norte/Sur/Este".
  const lower = normalizeKey(stripStreetCardinals(text));
  const keys = Object.keys(CUCUTA_AREA_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (AMBIGUOUS_AREA_KEYS.has(key)) continue;
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
 * penaliza parques, hoteles y POIs genéricos.
 * Penaliza fuerte mismatch de vía (p. ej. "1E" vs "17E") en cualquier dirección.
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

  score += scoreBarrioProximity(point, text, ctx.barrioHint);
  score += scoreAllStreetHints(text, ctx.streetHints);

  return score;
}

/** Suma match de todas las vías del cruce; exige ambas cuando hay 2+. */
function scoreAllStreetHints(resultText: string, streetHints: string[]): number {
  if (streetHints.length === 0) return 0;
  let score = 0;
  let positive = 0;
  for (const hint of streetHints) {
    const n = normalizeKey(normalizeCucutaRoadNames(hint));
    if (n.length >= 4 && normalizeKey(resultText).includes(n)) score += 20;
    const tokenScore = scoreRoadTokenMatch(hint, resultText);
    score += tokenScore;
    if (tokenScore > 0) positive += 1;
  }
  if (streetHints.length >= 2 && positive === 0) score -= 40;
  if (streetHints.length >= 2 && positive >= 2) score += 60;
  return score;
}

async function fetchPhotonFeatures(query: string): Promise<PhotonFeature[]> {
  const key = normalizeKey(query);
  const cached = photonCache.get(key);
  if (cached) return cached;
  const pending = photonInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    // Photon solo acepta lang: default | de | en | fr (NO "es").
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const features = data.features ?? [];
    photonCache.set(key, features);
    return features;
  })().finally(() => {
    photonInflight.delete(key);
  });

  photonInflight.set(key, request);
  return request;
}

async function geocodeWithPhotonScored(
  queries: string[],
  ctx: { barrioHint: string | null; streetHints: string[] },
): Promise<{ point: LatLng; score: number } | null> {
  let best: { point: LatLng; score: number } | null = null;

  // Máx. 2 consultas Photon (antes 4) — el resto suele ser ruido.
  for (const query of queries.slice(0, 2)) {
    const features = await fetchPhotonFeatures(query);
    for (const feature of features) {
      const point = featurePoint(feature);
      if (!point) continue;
      const score = scorePhotonFeature(feature, ctx);
      if (!best || score > best.score) best = { point, score };
    }
    if (best && best.score >= 90) break;
  }

  if (best && best.score >= 35) return best;
  return null;
}

type ScoredPoint = { point: LatLng; score: number; name: string };

function isStreetLikeNominatim(hit: NominatimRawHit): boolean {
  const cls = hit.class ?? "";
  const typ = hit.type ?? "";
  if (cls === "highway") return true;
  if (cls === "building") return true;
  if (typ === "house" || typ === "residential" || typ === "living_street") return true;
  // Evitar centroides de barrio (causan falso "cruce" en Barrio Popular).
  if (cls === "boundary" || cls === "place" || typ === "administrative") return false;
  if (typ === "suburb" || typ === "neighbourhood" || typ === "quarter") return false;
  return false;
}

async function fetchNominatimHits(query: string): Promise<NominatimRawHit[]> {
  const key = normalizeKey(query);
  const cached = nominatimCache.get(key);
  if (cached) return cached;
  const pending = nominatimInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const viewbox = `${CUCUTA_BBOX.minLng},${CUCUTA_BBOX.maxLat},${CUCUTA_BBOX.maxLng},${CUCUTA_BBOX.minLat}`;
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=json&limit=8&countrycodes=co` +
      `&addressdetails=1&viewbox=${viewbox}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CerebiiaDelivery/1.0 (delivery-route; contact@local)",
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimRawHit[];
    nominatimCache.set(key, data);
    return data;
  })().finally(() => {
    nominatimInflight.delete(key);
  });

  nominatimInflight.set(key, request);
  return request;
}

function scoreNominatimHit(
  hit: NominatimRawHit,
  ctx: { barrioHint: string | null; streetHints: string[]; query: string },
): ScoredPoint | null {
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const point = { lat, lng };
  if (!isInCucutaArea(point)) return null;

  let score = 10;
  const cls = hit.class ?? "";
  const typ = hit.type ?? "";
  const name = normalizeKey(hit.display_name ?? "");
  if (cls === "highway" || typ === "residential") score += 40;
  if (cls === "building" || typ === "house") score += 35;
  if (cls === "place" && (typ === "house" || typ === "yes" || typ === "neighbourhood")) {
    score += 15;
  }
  if (cls === "leisure" || cls === "tourism" || cls === "boundary") score -= 40;
  if (/\b(calle|carrera|avenida)\b/.test(name)) score += 15;

  score += scoreRoadTokenMatch(ctx.query, name);
  score += scoreAllStreetHints(name, ctx.streetHints);
  score += scoreBarrioProximity(point, name, ctx.barrioHint);

  return { point, score, name };
}

async function geocodeWithNominatimScored(
  query: string,
  ctx: { barrioHint: string | null; streetHints: string[] },
): Promise<ScoredPoint | null> {
  const data = await fetchNominatimHits(query);
  let best: ScoredPoint | null = null;
  for (const hit of data) {
    const scored = scoreNominatimHit(hit, { ...ctx, query });
    if (!scored) continue;
    if (!best || scored.score > best.score) best = scored;
  }
  return best && best.score >= 35 ? best : null;
}

function parseStreetHits(
  raw: NominatimRawHit[],
  via: string,
): Array<{ point: LatLng; name: string; barrio: string | null }> {
  const out: Array<{ point: LatLng; name: string; barrio: string | null }> = [];
  for (const hit of raw) {
    if (!isStreetLikeNominatim(hit)) continue;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const point = { lat, lng };
    if (!isInCucutaArea(point)) continue;
    const name = hit.display_name ?? "";
    if (scoreRoadTokenMatch(via, name) < 0) continue;
    out.push({ point, name, barrio: extractAreaHint(name) });
  }
  return out;
}

/**
 * Geocodifica un cruce "Vía A # Vía B" con pocas consultas Nominatim.
 * Estrategia: 1 query vía A → barrios candidatos → 1 query vía B por barrio (máx. 3).
 */
async function geocodeStreetIntersection(
  viaA: string,
  viaB: string,
  barrioHint: string | null,
): Promise<LatLng | null> {
  // Atajo: si ya viene barrio, 2 consultas bastan.
  if (barrioHint) {
    const [rawA, rawB] = await Promise.all([
      fetchNominatimHits(withCucuta(`${viaA}, ${barrioHint}`)),
      fetchNominatimHits(withCucuta(`${viaB}, ${barrioHint}`)),
    ]);
    const hitsA = parseStreetHits(rawA, viaA);
    const hitsB = parseStreetHits(rawB, viaB);
    let best: { point: LatLng; dist: number } | null = null;
    for (const a of hitsA.slice(0, 3)) {
      for (const b of hitsB.slice(0, 3)) {
        const dist = haversineMeters(a.point, b.point);
        if (dist > 700) continue;
        if (!best || dist < best.dist) {
          best = {
            dist,
            point: {
              lat: (a.point.lat + b.point.lat) / 2,
              lng: (a.point.lng + b.point.lng) / 2,
            },
          };
        }
      }
    }
    if (best) return best.point;
  }

  // Sin barrio: un solo listado de vía A (trae segmentos en distintos barrios).
  const rawA = await fetchNominatimHits(withCucuta(viaA));
  const hitsA = parseStreetHits(rawA, viaA);
  const uniqueA: typeof hitsA = [];
  for (const a of hitsA) {
    if (uniqueA.some((u) => haversineMeters(u.point, a.point) < 80)) continue;
    uniqueA.push(a);
  }

  // Barrios únicos detectados en los hits (máx. 3) — evita fan-out.
  const barrios: string[] = [];
  for (const a of uniqueA) {
    if (!a.barrio) continue;
    const key = normalizeKey(a.barrio);
    if (AMBIGUOUS_AREA_KEYS.has(key)) continue;
    if (!barrios.some((b) => normalizeKey(b) === key)) barrios.push(a.barrio);
    if (barrios.length >= 3) break;
  }

  let best: { point: LatLng; dist: number } | null = null;

  for (const barrio of barrios) {
    const rawB = await fetchNominatimHits(withCucuta(`${viaB}, ${barrio}`));
    const hitsB = parseStreetHits(rawB, viaB);
    for (const a of uniqueA.slice(0, 4)) {
      for (const b of hitsB.slice(0, 3)) {
        const dist = haversineMeters(a.point, b.point);
        if (dist > 700) continue;
        if (!best || dist < best.dist) {
          best = {
            dist,
            point: {
              lat: (a.point.lat + b.point.lat) / 2,
              lng: (a.point.lng + b.point.lng) / 2,
            },
          };
        }
      }
    }
    if (best && best.dist <= 220) break;
  }

  return best?.point ?? null;
}

export async function geocodeAddress(query: string): Promise<LatLng> {
  const key = `v9:${normalizeKey(query)}`;
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const pending = geocodeInflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const { queries, barrioHint, streetHints, crossStreets } =
      buildGeocodeCandidates(query);
    const ctx = { barrioHint, streetHints };
    const looksLikeStreet = /\b(calle|carrera|avenida|diagonal|transversal)\b/i.test(
      query,
    );

    try {
      // 1) Cruce vial (pocas queries Nominatim).
      if (crossStreets) {
        const cross = await geocodeStreetIntersection(
          crossStreets.viaA,
          crossStreets.viaB,
          barrioHint,
        );
        if (cross) {
          geocodeCache.set(key, cross);
          return cross;
        }
      }

      // 2) Nominatim: máx. 2 variantes (antes hasta 6).
      let best: ScoredPoint | null = null;
      if (looksLikeStreet) {
        for (const q of queries.slice(0, 2)) {
          const hit = await geocodeWithNominatimScored(q, ctx);
          if (hit && (!best || hit.score > best.score)) best = hit;
          if (best && best.score >= 90) break;
        }
      }

      // 3) Photon solo si Nominatim no dio un match decente.
      if (!best || best.score < 70) {
        const photonHit = await geocodeWithPhotonScored(queries, ctx);
        if (photonHit && (!best || photonHit.score > best.score)) {
          best = { ...photonHit, name: "" };
        }
      }

      if (!looksLikeStreet && (!best || best.score < 70)) {
        for (const q of queries.slice(0, 2)) {
          const hit = await geocodeWithNominatimScored(q, ctx);
          if (hit && (!best || hit.score > best.score)) best = hit;
          if (best && best.score >= 90) break;
        }
      }

      if (best) {
        geocodeCache.set(key, best.point);
        return best.point;
      }
    } catch {
      /* fallback por zona */
    }

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
  const osrmKey = `${coordsCacheKey(origin)}→${coordsCacheKey(destination)}`;
  const cached = osrmCache.get(osrmKey);
  if (cached) return cached;
  const pending = osrmInflight.get(osrmKey);
  if (pending) return pending;

  const request = (async () => {
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

    const distanceMeters = Math.round(route.distance);
    const result = {
      path,
      distanceMeters,
      durationSeconds: adjustUrbanDeliveryDuration(
        distanceMeters,
        Math.round(route.duration),
      ),
    };
    osrmCache.set(osrmKey, result);
    return result;
  })().finally(() => {
    osrmInflight.delete(osrmKey);
  });

  osrmInflight.set(osrmKey, request);
  return request;
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
  const cacheKey = `v9:${originKey}→${destKey}`;
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
            ...estimateRoadFallback(origin, destination),
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

/** Factor línea recta → calles urbanas (Cúcuta). */
const ROAD_DISTANCE_FACTOR = 1.4;

/**
 * OSRM no incluye tráfico. Factor para ETA de entrega moto en ciudad.
 * Piso: ~2 min/km (alineado con Google urbano típico).
 */
const URBAN_TRAFFIC_FACTOR = 1.85;
const MOTO_MIN_SECONDS_PER_KM = 2 * 60;

function adjustUrbanDeliveryDuration(
  distanceMeters: number,
  osrmDurationSeconds: number,
): number {
  const km = Math.max(0, distanceMeters) / 1000;
  const fromOsrm = osrmDurationSeconds * URBAN_TRAFFIC_FACTOR;
  const fromDistance = km * MOTO_MIN_SECONDS_PER_KM;
  return Math.max(60, Math.round(Math.max(fromOsrm, fromDistance)));
}

/** Fallback sin OSRM: distancia de calle estimada + ETA urbano. */
function estimateRoadFallback(
  a: LatLng,
  b: LatLng,
): Pick<DeliveryRouteResult, "durationSeconds" | "distanceMeters"> {
  const distanceMeters = Math.round(haversineMeters(a, b) * ROAD_DISTANCE_FACTOR);
  return {
    distanceMeters,
    durationSeconds: adjustUrbanDeliveryDuration(distanceMeters, distanceMeters / 1000 / 30 * 3600),
  };
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
    let address = normalizeCucutaRoadNames(
      stripUnitNoise(expandStreetAbbreviations(restaurant.address.trim())),
    );
    // Conservar nomenclatura con "#" para detectar el cruce.
    // (ensureCucutaContext la convertía a "Av 1E, Calle 17" y perdía el cruce).
    const barrio = extractAreaHint(address);
    if (barrio && !normalizeKey(address).includes(normalizeKey(barrio))) {
      address = `${address}, ${barrio}`;
    }
    address = withCucuta(address);
    if (restaurant.name?.trim()) {
      return `${restaurant.name.trim()}, ${address}`;
    }
    return address;
  }
  return withCucuta(`${restaurant.name}, ${restaurant.city}`);
}
