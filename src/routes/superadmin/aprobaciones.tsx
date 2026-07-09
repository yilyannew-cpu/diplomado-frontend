import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ApprovalsPanel } from "@/components/superadmin/ApprovalsPanel";
import {
  SuperadminNavMobile,
  SuperadminNavSidebar,
  getSuperadminPageTitle,
  type SuperadminModule,
} from "@/components/superadmin/SuperadminNav";
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
  const navigate = useNavigate();
  const activeModule: SuperadminModule = "approvals";

  const navHints = useMemo(
    () => ({
      approvals:
        approvals.pendingCount > 0
          ? `${approvals.pendingCount} pendiente${approvals.pendingCount === 1 ? "" : "s"}`
          : "Cola vacía",
    }),
    [approvals.pendingCount],
  );

  const handleSelect = (module: SuperadminModule) => {
    if (module === "approvals") return;
    navigate({ to: "/superadmin" });
  };

  return (
    <div className="min-h-screen bg-cream">
      <TopBar title="Gobernanza" subtitle="Control global de la plataforma" />

      <div className="page-container flex flex-col gap-6 lg:flex-row lg:gap-8">
        <SuperadminNavSidebar
          active={activeModule}
          onSelect={handleSelect}
          hints={navHints}
        />

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex min-w-0 items-start gap-3 lg:mb-8">
            <SuperadminNavMobile
              active={activeModule}
              onSelect={handleSelect}
              hints={navHints}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:tracking-[0.25em]">
                BurgerCore
              </p>
              <h1 className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight sm:mt-2 sm:text-2xl lg:text-3xl">
                {getSuperadminPageTitle(activeModule)}
              </h1>
            </div>
          </div>

          <ApprovalsPanel state={approvals} />
        </main>
      </div>
    </div>
  );
}
