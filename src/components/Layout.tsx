import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Inbox, History, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const adminLinks = [
    { to: "/admin/forms", label: "Forms", icon: LayoutDashboard },
  ];
  const empLinks = [
    { to: "/forms", label: "Forms", icon: Inbox },
    { to: "/history", label: "Lịch sử", icon: History },
  ];
  const links = role === "admin" ? adminLinks : empLinks;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg tracking-tight">FormFlow</span>
            <span className="ml-2 rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {role === "admin" ? "Admin" : "Nhân viên SW"}
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const Icon = l.icon;
              const active = loc.pathname.startsWith(l.to);
              return (
                <Link key={l.to} to={l.to}>
                  <Button variant={active ? "secondary" : "ghost"} size="sm" className="gap-2">
                    <Icon className="h-4 w-4" />
                    {l.label}
                  </Button>
                </Link>
              );
            })}
            <div className="mx-2 h-6 w-px bg-border" />
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                nav("/auth");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className={cn("container py-8")}>{children}</main>
    </div>
  );
}