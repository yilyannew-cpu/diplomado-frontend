import type { Order } from "@/mocks/ordersMock";

export const SLA_OPTIMAL_MAX = 14;
export const SLA_WARNING_MAX = 24;

export type SlaLevel = "optimal" | "warning" | "critical";

export function parseCreatedAtToTimestamp(createdAt: string, reference = new Date()): number {
  const match = createdAt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return reference.getTime();

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const date = new Date(reference);
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() > reference.getTime()) {
    date.setDate(date.getDate() - 1);
  }
  return date.getTime();
}

export function getOrderReceivedAt(order: Order): number {
  return order.receivedAt ?? parseCreatedAtToTimestamp(order.createdAt);
}

export function getElapsedMinutes(order: Order, now = Date.now()): number {
  return Math.max(0, Math.floor((now - getOrderReceivedAt(order)) / 60_000));
}

export function getSlaLevel(minutes: number): SlaLevel {
  if (minutes >= 25) return "critical";
  if (minutes >= 15) return "warning";
  return "optimal";
}

export function formatElapsedLabel(minutes: number): string {
  return `${minutes} min`;
}

export function slaTimerClass(level: SlaLevel): string {
  switch (level) {
    case "critical":
      return "bg-red-500/15 text-red-600 animate-kitchen-sla-blink";
    case "warning":
      return "bg-amber-brand/20 text-amber-brand";
    default:
      return "bg-emerald-500/15 text-emerald-700";
  }
}

export function slaCardBorderClass(level: SlaLevel): string {
  switch (level) {
    case "critical":
      return "border-red-400/60 shadow-red-500/10";
    case "warning":
      return "border-amber-brand/50";
    default:
      return "border-border";
  }
}
