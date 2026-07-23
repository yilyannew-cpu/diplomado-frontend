import { getCucutaComunaCodes, type CucutaComuna } from "@/lib/cucutaComunas";
import { getCitySelectOptions } from "@/lib/data/colombiaLocations";

export type ResolvedLocation = {
  address: string;
  comuna: CucutaComuna | null;
  cityName: string | null;
  cityId: string | null;
  lat: number;
  lng: number;
  /** gps = dispositivo; ip = aproximación por red (no es calle exacta). */
  source: "gps" | "ip";
  /** true si hay que completar calle/# a mano. */
  approximate: boolean;
};

type PhotonProps = {
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  suburb?: string;
  neighbourhood?: string;
  locality?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
};

const AREA_TO_COMUNA: Record<string, CucutaComuna> = {
  centro: "Centro",
  "centro oriental": "Centro Oriental",
  "oriental oriental": "Oriental Oriental",
  "oriental occidental": "Oriental Occidental",
  occidental: "Occidental",
  "sur occidental": "Sur Occidental",
  suroccidental: "Sur Occidental",
  "sur oriental": "Sur Oriental",
  suroriental: "Sur Oriental",
  norte: "Norte",
  atalaya: "Atalaya",
  "la libertad": "La Libertad",
  caobos: "Centro Oriental",
  "los caobos": "Centro Oriental",
  "13 de marzo": "Norte",
  "13 demarzo": "Norte",
  "san luis": "Norte",
  "el zulia": "Norte",
  ceiba: "Oriental Oriental",
  guaimaral: "Norte",
  sevilla: "Centro Oriental",
  prados: "Occidental",
  belen: "Sur Oriental",
  trigal: "Sur Occidental",
  "los pinos": "Occidental",
  carora: "Centro",
  "san martin": "Norte",
  "san martín": "Norte",
  lleras: "Occidental",
};

const COMUNA_BY_NUMBER: Record<string, CucutaComuna> = {
  "1": "Centro",
  "2": "Centro Oriental",
  "3": "Oriental Oriental",
  "4": "Oriental Occidental",
  "5": "Occidental",
  "6": "Sur Occidental",
  "7": "Sur Oriental",
  "8": "Norte",
  "9": "Atalaya",
  "10": "La Libertad",
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchComuna(...candidates: Array<string | undefined | null>): CucutaComuna | null {
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const key = normalizeKey(raw);

    const numbered = key.match(/comuna\s*(\d{1,2})/);
    if (numbered?.[1] && COMUNA_BY_NUMBER[numbered[1]]) {
      return COMUNA_BY_NUMBER[numbered[1]]!;
    }

    const fromAlias = AREA_TO_COMUNA[key];
    if (fromAlias) return fromAlias;

    const knownCodes = getCucutaComunaCodes();
    const exact = knownCodes.find((c) => normalizeKey(c) === key);
    if (exact) return exact;

    for (const comuna of knownCodes) {
      const n = normalizeKey(comuna);
      if (key.includes(n) || n.includes(key)) return comuna;
    }
    for (const [alias, comuna] of Object.entries(AREA_TO_COMUNA)) {
      if (key.includes(alias)) return comuna;
    }
  }
  return null;
}

/** Infiera comuna a partir del texto de dirección (barrio, comuna N, etc.). */
export function inferComunaFromAddress(address: string): CucutaComuna | null {
  if (!address.trim()) return null;
  return matchComuna(address);
}

function matchCityId(cityName: string | null | undefined): string | null {
  if (!cityName?.trim()) return null;
  try {
    const key = normalizeKey(cityName);
    const options = getCitySelectOptions();
    const hit = options.find((o) => normalizeKey(o.label) === key);
    if (hit) return hit.value;
    if (key.includes("cucuta")) {
      return options.find((o) => normalizeKey(o.label) === "cucuta")?.value ?? null;
    }
    const soft = options.find(
      (o) => key.includes(normalizeKey(o.label)) || normalizeKey(o.label).includes(key),
    );
    return soft?.value ?? null;
  } catch {
    return null;
  }
}

function buildAddressLabel(
  props: PhotonProps,
  lat: number,
  lng: number,
  options?: { includeStreet?: boolean },
): string {
  const includeStreet = options?.includeStreet !== false;
  const streetParts = includeStreet
    ? [props.housenumber, props.street].filter(Boolean).join(" ").trim()
    : "";
  const area =
    props.locality ||
    props.neighbourhood ||
    props.suburb ||
    props.district ||
    (!includeStreet ? "" : props.name) ||
    "";
  const city = props.city || props.town || props.village || props.county || "Cúcuta";

  if (!includeStreet) {
    const zoneBits = [area, city].filter((part, idx, arr) => {
      if (!part) return false;
      const prev = arr[idx - 1];
      if (!prev) return true;
      return normalizeKey(part) !== normalizeKey(prev);
    });
    if (zoneBits.length > 0) {
      return `Cll/Cra # — , ${zoneBits.join(", ")}`;
    }
    return `Cll/Cra # — , Cúcuta`;
  }

  const chunks = [streetParts || props.name, area, city].filter((part, idx, arr) => {
    if (!part) return false;
    const prev = arr[idx - 1];
    if (!prev) return true;
    return normalizeKey(part) !== normalizeKey(prev);
  });

  if (chunks.length > 0) return chunks.join(", ");
  return `Ubicación aproximada (${lat.toFixed(5)}, ${lng.toFixed(5)}), Cúcuta`;
}

async function reverseGeocodePhoton(lat: number, lng: number): Promise<PhotonProps | null> {
  try {
    // Sin lang=es: Photon responde 400 con idioma no soportado.
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Array<{ properties?: PhotonProps }> };
    return data.features?.[0]?.properties ?? null;
  } catch {
    return null;
  }
}

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<PhotonProps | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}` +
      `&format=json&addressdetails=1&accept-language=es`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    return {
      housenumber: a.house_number,
      street: a.road || a.pedestrian || a.path,
      neighbourhood: a.neighbourhood || a.suburb,
      locality: a.neighbourhood,
      district: a.city_district || a.district || a.borough,
      city: a.city || a.town || a.municipality || a.county,
      county: a.county,
      state: a.state,
      country: a.country,
      postcode: a.postcode,
      name: data.display_name?.split(",")[0],
    };
  } catch {
    return null;
  }
}

function readPosition(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

type LatLngFix = {
  lat: number;
  lng: number;
  source: "gps" | "ip";
  /** metros; solo GPS. */
  accuracyMeters?: number;
};

async function getDeviceLatLng(): Promise<LatLngFix | null> {
  if (typeof window === "undefined" || !navigator.geolocation) return null;
  if (!window.isSecureContext) return null;

  try {
    const pos = await readPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60_000,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      source: "gps",
      accuracyMeters: pos.coords.accuracy,
    };
  } catch {
    /* retry alta precisión */
  }

  try {
    const pos = await readPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      source: "gps",
      accuracyMeters: pos.coords.accuracy,
    };
  } catch {
    return null;
  }
}

/** Respaldo cuando el PC no tiene GPS (muy común en escritorio). */
async function getIpLatLng(): Promise<(LatLngFix & { cityHint?: string }) | null> {
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      latitude?: string;
      longitude?: string;
      city?: string;
      region?: string;
    };
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      source: "ip",
      cityHint: data.city || data.region,
    };
  } catch {
    return null;
  }
}

async function buildResolvedFromCoords(
  lat: number,
  lng: number,
  meta: { source: "gps" | "ip"; accuracyMeters?: number; cityHint?: string },
): Promise<ResolvedLocation> {
  let props: PhotonProps = {};
  try {
    props =
      (await reverseGeocodePhoton(lat, lng)) ??
      (await reverseGeocodeNominatim(lat, lng)) ??
      {};
  } catch {
    props = {};
  }

  if (meta.cityHint && !props.city && !props.town) {
    props = { ...props, city: meta.cityHint };
  }

  const cityName =
    props.city || props.town || props.village || props.county || meta.cityHint || "Cúcuta";
  const comuna = matchComuna(
    props.district,
    props.suburb,
    props.neighbourhood,
    props.locality,
    props.name,
    cityName,
  );

  // IP o GPS con poca precisión (>150 m): no inventar calle; solo zona + plantilla.
  const approximate =
    meta.source === "ip" ||
    (typeof meta.accuracyMeters === "number" && meta.accuracyMeters > 150);

  return {
    address: buildAddressLabel(props, lat, lng, { includeStreet: !approximate }),
    comuna,
    cityName,
    cityId: matchCityId(cityName) ?? matchCityId("Cúcuta"),
    lat,
    lng,
    source: meta.source,
    approximate,
  };
}

/**
 * Obtiene ubicación del dispositivo; si falla (PC sin GPS), usa aproximación por IP.
 * En modo aproximado no rellena una calle inventada: deja plantilla para completar.
 */
export async function resolveCurrentLocation(): Promise<ResolvedLocation> {
  if (typeof window === "undefined") {
    throw new Error("La ubicación solo está disponible en el navegador.");
  }
  if (!window.isSecureContext) {
    throw new Error(
      "La ubicación solo funciona en HTTPS o localhost (no en http://IP de red). Abre la app en un enlace seguro.",
    );
  }

  const device = await getDeviceLatLng();
  if (device) {
    return buildResolvedFromCoords(device.lat, device.lng, {
      source: "gps",
      accuracyMeters: device.accuracyMeters,
    });
  }

  const fromIp = await getIpLatLng();
  if (fromIp) {
    return buildResolvedFromCoords(fromIp.lat, fromIp.lng, {
      source: "ip",
      cityHint: fromIp.cityHint,
    });
  }

  throw new Error(
    "No se pudo detectar tu ubicación. Escribe la dirección a mano (ej. Cll 4 #12-45 San Martín, Cúcuta).",
  );
}
