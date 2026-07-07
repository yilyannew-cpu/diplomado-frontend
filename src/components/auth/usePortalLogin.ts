import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { getLoginErrorMessage } from "@/lib/api/errors";
import { getRoleHomePath } from "@/lib/auth/roleRoutes";
import type { Role } from "@/lib/api/types";

export function usePortalLogin(allowedRoles: Role[]) {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    if (allowedRoles.includes(user.role)) {
      navigate({ to: getRoleHomePath(user.role) });
    }
  }, [user, isLoading, navigate, allowedRoles]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const loggedIn = await login(email.trim(), password);
      if (!allowedRoles.includes(loggedIn.role)) {
        setError("Esta cuenta no corresponde a este portal de acceso.");
        return;
      }
      navigate({ to: getRoleHomePath(loggedIn.role) });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    submitting,
    isLoading,
    handleLogin,
  };
}
