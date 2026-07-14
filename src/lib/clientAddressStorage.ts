const CLIENT_ADDRESS_KEY = "ffcore_client_address";

type StoredAddress = {
  userId: string;
  address: string;
  lat?: number;
  lng?: number;
};

export function persistClientAddress(
  userId: string,
  address: string,
  coords?: { lat: number; lng: number },
): void {
  if (typeof window === "undefined" || !userId || !address.trim()) return;
  const payload: StoredAddress = {
    userId,
    address: address.trim(),
    lat: coords?.lat,
    lng: coords?.lng,
  };
  window.localStorage.setItem(CLIENT_ADDRESS_KEY, JSON.stringify(payload));
}

export function readClientAddress(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(CLIENT_ADDRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAddress;
    if (parsed.userId !== userId || !parsed.address?.trim()) return null;
    return parsed.address.trim();
  } catch {
    return null;
  }
}

export function readClientAddressCoords(
  userId: string,
): { lat: number; lng: number } | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(CLIENT_ADDRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAddress;
    if (parsed.userId !== userId) return null;
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}
