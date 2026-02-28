// ============================================================
// DESIGN: Intelligence Dossier — Layout with persistent sidebar
// Dark charcoal canvas, amber accents, monospaced labels
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Trophy,
  Globe,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  LogOut,
  Lock,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "NETWORK", icon: Users },
  { path: "/rankings", label: "RANKINGS", icon: Trophy },
  { path: "/globe", label: "GLOBE VIEW", icon: Globe },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: whitelistStatus } = trpc.auth.whitelistStatus.useQuery(
    undefined,
    {
      enabled: !!user,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const isAdmin = whitelistStatus?.isAdmin;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ width: collapsed ? "3.5rem" : "14.5rem" }}
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          border-r border-border bg-sidebar transition-all duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative
        `}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center px-3 border-b border-border flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                <Lock size={13} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm text-foreground leading-tight">
                  Strategic
                </div>
                <div className="font-mono-label text-[0.55rem] text-muted-foreground/70 tracking-widest truncate">
                  NETWORK INTEL
                </div>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto">
              <Lock size={13} className="text-primary" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className={`
                    flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-150 border
                    ${
                      isActive
                        ? "bg-primary/10 text-primary border-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-mono-label text-[0.68rem] truncate">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <>
              <div className="h-px bg-border/60 mx-1 my-2" />
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <div
                  className={`
                    flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-150 border
                    ${
                      location === "/admin"
                        ? "bg-primary/10 text-primary border-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent border-transparent"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Shield size={16} strokeWidth={1.5} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-mono-label text-[0.68rem]">ADMIN</span>
                  )}
                </div>
              </Link>
            </>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-border p-2 space-y-1 flex-shrink-0">
          {user && !collapsed && (
            <div className="px-2.5 py-2 rounded-md bg-accent/40">
              <p className="text-xs text-foreground/90 truncate font-medium">
                {user.name || "User"}
              </p>
              <p className="text-[0.6rem] text-muted-foreground/70 truncate mt-0.5">
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut size={15} strokeWidth={1.5} className="flex-shrink-0" />
            {!collapsed && (
              <span className="font-mono-label text-[0.65rem]">SIGN OUT</span>
            )}
          </button>

          {/* Collapse toggle (desktop only) */}
          <div className="hidden lg:block">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center py-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded-md hover:bg-accent/50"
            >
              {collapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronLeft size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile close */}
        <button
          className="lg:hidden absolute top-4 right-3 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-mono-label text-[0.62rem] text-muted-foreground/60">
                STRATEGIC NETWORK INTELLIGENCE
              </span>
              <span className="text-border/60">·</span>
              <span className="font-mono-label text-[0.58rem] text-primary/60">
                35 CONTACTS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-label text-[0.58rem] text-muted-foreground/50 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
              CONFIDENTIAL
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
