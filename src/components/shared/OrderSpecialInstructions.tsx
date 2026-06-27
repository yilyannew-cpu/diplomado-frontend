import { Ban } from "lucide-react";

interface OrderSpecialInstructionsProps {
  notes: string;
  compact?: boolean;
}

/** Alerta visible para exclusiones o preferencias del cliente en cocina y despacho. */
export function OrderSpecialInstructions({ notes, compact = false }: OrderSpecialInstructionsProps) {
  return (
    <div
      className={`mb-2 flex gap-2.5 rounded-xl border-2 border-red-500/50 bg-red-50 shadow-sm ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg bg-red-500/15 ${
          compact ? "size-7" : "size-8"
        }`}
      >
        <Ban className={`text-red-600 ${compact ? "size-3.5" : "size-4"}`} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`font-bold uppercase tracking-wider text-red-700 ${
            compact ? "text-[9px]" : "text-[10px]"
          }`}
        >
          Sin incluir en la comida
        </p>
        <p
          className={`mt-0.5 font-semibold leading-snug text-red-900 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {notes}
        </p>
      </div>
    </div>
  );
}
