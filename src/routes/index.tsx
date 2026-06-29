import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getRoleHomePath } from "@/lib/auth/roleRoutes";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      navigate({ to: getRoleHomePath(user.role) });
    } else {
      navigate({ to: "/login/cliente" });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      Redirigiendo…
    </div>
  );
}
