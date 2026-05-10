import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: "admin" | "sw_employee" }) {
  const { user, role: r, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && r !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}