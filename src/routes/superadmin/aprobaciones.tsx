import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsPanel } from "@/components/superadmin/ApprovalsPanel";
import { SuperadminNav } from "@/components/superadmin/SuperadminNav";
import { RoleGuard, TopBar } from "@/components/shared/RoleShell";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";

export const Route = createFileRoute("/superadmin/aprobaciones")({
  head: () => ({
    meta: [{ title: "Superadmin · Aprobaciones · FFCore" }],
  }),
  component: () => (
    <RoleGuard role="superadmin">
      <SuperadminApprovalsPage />
    </RoleGuard>
  ),
});

function SuperadminApprovalsPage() {
  const approvals = usePendingApprovals();

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Aprobaciones" subtitle="Autorización de accesos pendientes" />

      <main className="page-container space-y-6">
        <SuperadminNav pendingCount={approvals.pendingCount} />
        <ApprovalsPanel state={approvals} />
      </main>
    </div>
  );
}
