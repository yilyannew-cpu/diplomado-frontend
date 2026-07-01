import { type MockUser } from "@/mocks/usersMock";

interface ApprovalQueueProps {
  pendingUsers: MockUser[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
}

export function ApprovalQueue({ pendingUsers, approveUser, rejectUser }: ApprovalQueueProps) {
  if (pendingUsers.length === 0) {
    return null; // No mostramos nada si no hay pendientes
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-brand/30 bg-amber-brand/5">
      <div className="border-b border-amber-brand/20 px-4 py-3 sm:px-5">
        <h2 className="font-display text-sm font-semibold text-amber-brand sm:text-base flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-brand"></span>
          </span>
          Cola de Aprobación ({pendingUsers.length})
        </h2>
      </div>

      <div className="divide-y divide-amber-brand/10">
        {pendingUsers.map((u) => (
          <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 hover:bg-amber-brand/10 transition-colors">
            <div className="mb-3 sm:mb-0">
              <p className="font-medium text-sm">{u.name}</p>
              <p className="text-[11px] text-muted-foreground">{u.email} • <span className="font-medium uppercase text-amber-brand/80">{u.role}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => rejectUser(u.id)}
                className="rounded-lg border border-destructive/30 px-3 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => approveUser(u.id)}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm hover:bg-emerald-600 transition-colors"
              >
                Aprobar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
