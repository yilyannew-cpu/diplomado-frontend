const REVIEW_DONE_KEY = "ffcore_delivery_review_done";

export function isDeliveryReviewDone(orderId: string): boolean {
  if (typeof window === "undefined" || !orderId) return false;
  try {
    return window.localStorage.getItem(`${REVIEW_DONE_KEY}:${orderId}`) === "1";
  } catch {
    return false;
  }
}

export function markDeliveryReviewDone(orderId: string): void {
  if (typeof window === "undefined" || !orderId) return;
  try {
    window.localStorage.setItem(`${REVIEW_DONE_KEY}:${orderId}`, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Pedido entregado cuya calificación ya cerró el ciclo de seguimiento. */
export function isTrackingCycleClosed(order: {
  status: string;
  orderId?: string;
  id: string;
}): boolean {
  if (order.status !== "Entregado") return false;
  const apiId = order.orderId ?? order.id;
  const code = order.id;
  return isDeliveryReviewDone(apiId) || (code !== apiId && isDeliveryReviewDone(code));
}
