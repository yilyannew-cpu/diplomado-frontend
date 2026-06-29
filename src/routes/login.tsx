import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginLayout,
});

function LoginLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isLoginIndex = pathname === "/login" || pathname === "/login/";

  useEffect(() => {
    if (isLoginIndex) {
      navigate({ to: "/login/cliente", replace: true });
    }
  }, [isLoginIndex, navigate]);

  if (isLoginIndex) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Redirigiendo…
      </div>
    );
  }

  return <Outlet />;
}
