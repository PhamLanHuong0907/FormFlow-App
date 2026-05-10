import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { role, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Đang tải...</div>;
  return <Navigate to={role === "admin" ? "/admin/forms" : "/forms"} replace />;
};

export default Index;
