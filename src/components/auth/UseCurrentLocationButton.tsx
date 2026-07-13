import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import {
  resolveCurrentLocation,
  type ResolvedLocation,
} from "@/lib/geolocationAddress";
import { cn } from "@/lib/utils";

type UseCurrentLocationButtonProps = {
  onResolved: (location: ResolvedLocation) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: "idle" | "loading" | "success" | "error") => void;
  className?: string;
  label?: string;
};

export function UseCurrentLocationButton({
  onResolved,
  onError,
  onStatusChange,
  className,
  label = "Usar mi ubicación",
}: UseCurrentLocationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    onStatusChange?.("loading");
    onError?.("");
    try {
      const location = await resolveCurrentLocation();
      onResolved(location);
      onStatusChange?.("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo obtener la ubicación.";
      onError?.(message);
      onStatusChange?.("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleClick();
      }}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <LocateFixed className="size-3.5" aria-hidden />
      )}
      {loading ? "Detectando…" : label}
    </button>
  );
}
