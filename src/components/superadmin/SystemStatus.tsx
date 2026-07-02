export function SystemStatus() {
  return (
    <aside className="rounded-2xl bg-ink p-6 text-cream">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-brand">
        Estado del sistema
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold">Todo operando</h3>
      <p className="mt-1 text-xs text-cream/60">Última sincronización hace 24 segundos</p>
      <ul className="mt-5 space-y-3 text-xs">
        <StatusLine label="API de pedidos" status="ok" />
        <StatusLine label="Pasarela de pago" status="ok" />
        <StatusLine label="Notificaciones push" status="warn" />
        <StatusLine label="Mapas y rutas" status="ok" />
      </ul>
    </aside>
  );
}

function StatusLine({ label, status }: { label: string; status: "ok" | "warn" }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-cream/80">{label}</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${status === "ok" ? "bg-emerald-400" : "bg-amber-brand"}`} />
        <span className={status === "ok" ? "text-emerald-300" : "text-amber-brand"}>
          {status === "ok" ? "Operativo" : "Degradado"}
        </span>
      </span>
    </li>
  );
}
