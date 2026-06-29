import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardCheck, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type SuperadminNavProps = {
  pendingCount?: number;
};

const NAV_ITEMS = [
  { to: "/superadmin", label: "Consola", shortLabel: "Consola", icon: LayoutDashboard, exact: true },
  {
    to: "/superadmin/aprobaciones",
    label: "Aprobaciones",
    shortLabel: "Aprobaciones",
    icon: ClipboardCheck,
    exact: false,
  },
] as const;

export function SuperadminNav({ pendingCount = 0 }: SuperadminNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        const showBadge = item.to.includes("aprobaciones") && pendingCount > 0;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.shortLabel}</span>
            {showBadge && (
              <span
                className={cn(
                  "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-brand text-ink",
                )}
              >
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
