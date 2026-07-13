import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { deliveryReviewsApi } from "@/lib/api/endpoints/deliveryReviews";
import { cn } from "@/lib/utils";

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={cn(
                "rounded-lg p-1 transition-transform hover:scale-110",
                active ? "text-amber-brand" : "text-muted-foreground/40",
              )}
            >
              <Star className={cn("size-8", active && "fill-current")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DeliveryReviewModal({
  open,
  orderId,
  orderCode,
  restaurantName,
  courierName,
  customerName,
  hasCourier,
  onDone,
}: {
  open: boolean;
  orderId: string;
  orderCode: string;
  restaurantName: string;
  courierName?: string | null;
  customerName?: string;
  hasCourier: boolean;
  onDone: () => void;
}) {
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [courierRating, setCourierRating] = useState(0);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [courierComment, setCourierComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const canSubmit =
    restaurantRating >= 1 && (!hasCourier || courierRating >= 1) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await deliveryReviewsApi.submit(orderId, {
        restaurant_rating: restaurantRating,
        restaurant_comment: restaurantComment.trim() || undefined,
        courier_rating: hasCourier ? courierRating : undefined,
        courier_comment: hasCourier ? courierComment.trim() || undefined : undefined,
        customer_name: customerName,
      });
      toast.success("¡Gracias por tu calificación!");
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toast.error(
          "El servidor aún no tiene la API de calificaciones. Espera el deploy e intenta de nuevo.",
        );
        return;
      }
      const message =
        err instanceof ApiError ? err.message : "No se pudo enviar la reseña.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-review-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-cream p-5 shadow-2xl sm:p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          Pedido {orderCode}
        </p>
        <h2 id="delivery-review-title" className="mt-1 font-display text-xl font-bold">
          Califica tu experiencia
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu opinión ayuda a mejorar el restaurante y al domiciliario.
        </p>

        <div className="mt-6 space-y-6">
          <StarPicker
            label={`Restaurante · ${restaurantName}`}
            value={restaurantRating}
            onChange={setRestaurantRating}
          />
          <textarea
            value={restaurantComment}
            onChange={(e) => setRestaurantComment(e.target.value)}
            placeholder="Comentario del restaurante (opcional)"
            rows={2}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          />

          {hasCourier ? (
            <>
              <StarPicker
                label={`Domiciliario · ${courierName?.trim() || "Repartidor"}`}
                value={courierRating}
                onChange={setCourierRating}
              />
              <textarea
                value={courierComment}
                onChange={(e) => setCourierComment(e.target.value)}
                placeholder="Comentario del domiciliario (opcional)"
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="mt-6 w-full rounded-2xl bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/25 disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none"
        >
          {busy ? "Enviando…" : "Enviar calificaciones"}
        </button>
      </div>
    </div>
  );
}
