import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

type Role = "admin" | "sw_employee";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthCtx {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (token: string, user: User, role: Role) => void;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((data) => {
          setUser(data.user);
          setRole(data.role);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token: string, user: User, role: Role) => {
    localStorage.setItem('token', token);
    setUser(user);
    setRole(role);
  };

  async function signOut() {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
  }

  return <Ctx.Provider value={{ user, role, loading, signOut, signIn }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);