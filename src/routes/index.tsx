import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/login/cliente", replace: true });
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      Redirigiendo al inicio de sesión…
    </div>
  );
}
