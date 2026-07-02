import { cn } from "@/lib/utils";

interface OrderSpecialInstructionsProps {
  notes: string;
  compact?: boolean;
}

/** Nota de exclusión o preferencia del cliente — visible pero sin saturar la comanda. */
export function OrderSpecialInstructions({ notes, compact = false }: OrderSpecialInstructionsProps) {
  return (
    <p
      className={cn(
        "mb-2 border-l-2 border-red-400/60 pl-2 leading-snug text-red-700",
        compact ? "text-[11px]" : "text-xs",
      )}
      role="note"
    >
      <span className="font-medium text-red-600">Sin incluir:</span> {notes}
    </p>
  );
}
