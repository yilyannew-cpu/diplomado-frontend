import { useEffect, useState } from "react";

/** Refresca cada 30 s para actualizar cronómetros de cocina. */
export function useKitchenTick(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
