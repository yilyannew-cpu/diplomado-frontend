import { useState } from "react";
import { cn } from "@/lib/utils";
import { ApprovalQueue } from "@/components/superadmin/ApprovalQueue";
import { ApprovalHistoryPanel } from "@/components/superadmin/ApprovalHistoryPanel";
import type { PendingUser } from "@/lib/api/types";

type ApprovalsTab = "pending" | "history";

interface ApprovalsModuleProps {
  pendingUsers: PendingUser[];
  approveUser: (id: string) => void;
  rejectUser: (id: string) => void;
}

export function ApprovalsModule({ pendingUsers, approveUser, rejectUser }: ApprovalsModuleProps) {
  const [tab, setTab] = useState<ApprovalsTab>("pending");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center gap-4 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={cn(
            "border-b-2 pb-3 px-1 text-sm font-medium transition-colors",
            tab === "pending"
              ? "border-primary font-semibold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Restaurantes & Domiciliarios
          {pendingUsers.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={cn(
            "border-b-2 pb-3 px-1 text-sm font-medium transition-colors",
            tab === "history"
              ? "border-primary font-semibold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Historial de aprobaciones
        </button>
      </div>

      {tab === "pending" ? (
        <ApprovalQueue
          pendingUsers={pendingUsers}
          approveUser={approveUser}
          rejectUser={rejectUser}
        />
      ) : (
        <ApprovalHistoryPanel />
      )}
    </div>
  );
}
