// ============================================================
// DESIGN: Intelligence Dossier — Layout with persistent sidebar
// Dark charcoal canvas, amber accents, monospaced labels
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Trophy, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "NETWORK", icon: Users },
  { path: "/rankings", label: "RANKINGS", icon: Trophy },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          border-r border-border bg-sidebar transition-all duration-200
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative
        `}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">S</span>
              </div>
              <div>
                <div className="font-display text-sm text-foreground leading-tight">Strategic</div>
                <div className="font-mono-label text-[0.6rem] text-muted-foreground tracking-widest">NETWORK INTEL</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center mx-auto">
              <span className="text-primary font-bold text-sm">S</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
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
                    flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {!collapsed && (
                    <span className="font-mono-label text-[0.7rem]">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex border-t border-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
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
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <span className="font-mono-label text-[0.65rem]">STRATEGIC NETWORK INTELLIGENCE</span>
              <span className="text-border">|</span>
              <span className="font-mono-label text-[0.6rem] text-primary/70">35 CONTACTS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono-label text-[0.6rem]">CONFIDENTIAL</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
