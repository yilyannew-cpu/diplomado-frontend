import type { Order } from "@/mocks/ordersMock";

/**
 * Tarifas de domicilio FFCore (COP) — distancia por ruta de mapa.
 * Sin GPS en vivo del domiciliario: el costo se cierra antes del pago.
 *
 * Reglas:
 * 1. ≤ 2.0 km → tarifa base $4.500
 * 2. > 2.0 km → base $4.500 + cada km extra (o fracción) × $1.200
 * 3. Si tiempo_mapa > (distancia_km × 3) + 10 min → recargo tráfico $2.000
 * 4. total redondeado a la centena más cercana
 */

/** Primeros 2 km incluidos en la base. */
export const DELIVERY_INCLUDED_KM = 2;

/** Tarifa fija por los primeros 2 km (o menos). */
export const DELIVERY_BASE_FEE_COP = 4_500;

/** Cobro por cada km adicional o fracción. */
export const DELIVERY_EXTRA_KM_FEE_COP = 1_200;

/** Minutos teóricos por km en condiciones normales. */
export const DELIVERY_MINUTES_PER_KM = 3;

/** Holgura sobre el tiempo base antes de aplicar recargo. */
export const DELIVERY_TRAFFIC_SLACK_MIN = 10;

/** Recargo fijo por alta demanda / tráfico. */
export const DELIVERY_TRAFFIC_SURCHARGE_COP = 2_000;

/**
 * Fallback si aún no hay ruta (sin dirección / error de mapa).
 * Coincide con la tarifa mínima (≤ 2 km, sin tráfico).
 */
export const DEFAULT_DELIVERY_FEE_COP = DELIVERY_BASE_FEE_COP;

/** @deprecated Usar DELIVERY_BASE_FEE_COP — alias de compatibilidad. */
export const DELIVERY_FEE_SHORT_COP = DELIVERY_BASE_FEE_COP;

/** @deprecated Alias legacy; ya no hay tarifa fija por ETA. */
export const DELIVERY_FEE_LONG_COP = DELIVERY_BASE_FEE_COP + DELIVERY_TRAFFIC_SURCHARGE_COP;

/** @deprecated El umbral ahora es por km, no por minutos fijos. */
export const DELIVERY_ETA_THRESHOLD_MIN = DELIVERY_INCLUDED_KM * DELIVERY_MINUTES_PER_KM;

export type DeliveryFeeBreakdown = {
  /** Distancia de ruta en km (2 decimales). */
  distancia_km: number;
  /** ETA de la ruta en minutos (entero). */
  tiempo_estimado_minutos: number;
  /** Tiempo teórico normal: distancia_km × 3. */
  tiempo_base_minutos: number;
  /** Siempre $4.500 si hay distancia válida. */
  tarifa_base: number;
  /** Suma de km extras (fracción redondeada hacia arriba × $1.200). */
  valor_km_adicionales: number;
  /** $2.000 o $0 según umbral de tráfico. */
  recargo_trafico: number;
  /** Total a cobrar, redondeado a centena. */
  total_domicilio: number;
};

export type DeliveryRouteMetrics = {
  /** Metros de la polilínea OSRM / mapa. */
  distanceMeters: number;
  /** Segundos de duración estimada de la ruta. */
  durationSeconds: number;
};

/** Redondeo comercial a la centena más cercana (COP). Ej: 6740 → 6700, 6750 → 6800. */
export function roundToNearestHundred(cop: number): number {
  if (!Number.isFinite(cop) || cop <= 0) return 0;
  return Math.round(cop / 100) * 100;
}

/**
 * Km adicionales facturables: cada km o fracción encima de 2.0.
 * Ej: 2.1 → 1 · 2.01 → 1 · 3.0 → 1 · 3.01 → 2
 */
export function countBillableExtraKm(distanciaKm: number): number {
  const extra = distanciaKm - DELIVERY_INCLUDED_KM;
  if (extra <= 0) return 0;
  return Math.ceil(extra);
}

function normalizeDistanceKm(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return 0;
  return Math.round((distanceMeters / 1000) * 100) / 100;
}

function normalizeDurationMinutes(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) return 0;
  return Math.max(1, Math.round(durationSeconds / 60));
}

/**
 * Calcula el desglose de domicilio a partir de la ruta del mapa.
 * El total queda cerrado para mostrarlo antes del pago.
 */
export function calculateDeliveryFeeFromRoute(
  metrics: DeliveryRouteMetrics,
): DeliveryFeeBreakdown {
  const distancia_km = normalizeDistanceKm(metrics.distanceMeters);
  const tiempo_estimado_minutos = normalizeDurationMinutes(metrics.durationSeconds);
  const tiempo_base_minutos = Math.round(distancia_km * DELIVERY_MINUTES_PER_KM * 100) / 100;

  const tarifa_base = DELIVERY_BASE_FEE_COP;
  const extraKm = countBillableExtraKm(distancia_km);
  const valor_km_adicionales = extraKm * DELIVERY_EXTRA_KM_FEE_COP;

  const trafficThreshold = tiempo_base_minutos + DELIVERY_TRAFFIC_SLACK_MIN;
  const recargo_trafico =
    tiempo_estimado_minutos > trafficThreshold ? DELIVERY_TRAFFIC_SURCHARGE_COP : 0;

  const rawTotal = tarifa_base + valor_km_adicionales + recargo_trafico;
  const total_domicilio = roundToNearestHundred(rawTotal);

  return {
    distancia_km,
    tiempo_estimado_minutos,
    tiempo_base_minutos,
    tarifa_base,
    valor_km_adicionales,
    recargo_trafico,
    total_domicilio,
  };
}

/** Serialización lista para UI / payload (nombres de negocio). */
export function deliveryFeeBreakdownToJson(breakdown: DeliveryFeeBreakdown) {
  return {
    distancia_km: breakdown.distancia_km,
    tiempo_estimado_minutos: breakdown.tiempo_estimado_minutos,
    tiempo_base_minutos: breakdown.tiempo_base_minutos,
    tarifa_base: breakdown.tarifa_base,
    valor_km_adicionales: breakdown.valor_km_adicionales,
    recargo_trafico: breakdown.recargo_trafico,
    total_domicilio: breakdown.total_domicilio,
  };
}

/** @deprecated Preferir calculateDeliveryFeeFromRoute (usa km + tráfico). */
export function getDeliveryFeeFromDurationSeconds(durationSeconds: number): number {
  // Estimación gruesa sin distancia real: asume ~22 km/h → km ≈ min / 3
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const distancia_km = minutes / DELIVERY_MINUTES_PER_KM;
  return calculateDeliveryFeeFromRoute({
    distanceMeters: distancia_km * 1000,
    durationSeconds,
  }).total_domicilio;
}

export function isValidDeliveryFee(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= DELIVERY_BASE_FEE_COP &&
    value <= 200_000 &&
    value % 100 === 0
  );
}

/** @deprecated Usar isValidDeliveryFee. */
export type AllowedDeliveryFee = number;

/** @deprecated Usar isValidDeliveryFee. */
export function isAllowedDeliveryFee(value: number): boolean {
  return isValidDeliveryFee(value);
}

export function getOrderDeliveryFee(order: Order): number {
  return order.deliveryFee ?? DEFAULT_DELIVERY_FEE_COP;
}

/** Ventas del restaurante (productos), sin el domicilio del repartidor. */
export function getOrderProductSales(order: Order): number {
  return Math.max(0, order.total - getOrderDeliveryFee(order));
}

/** Suma los costos de domicilio facturados al cliente por cada pedido en ruta. */
export function sumDeliveryFees(orders: Order[]): number {
  return orders.reduce((sum, order) => sum + getOrderDeliveryFee(order), 0);
}
