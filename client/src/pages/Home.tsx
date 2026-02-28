import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import GlobeWidget from "@/components/GlobeWidget";
import type { Contact as GlobeContact } from "@/components/GlobeWidget";
import { extractCountry } from "@shared/utils";
import { Link } from "wouter";
import { Shield, LogOut, Search } from "lucide-react";
import { useState, useCallback } from "react";

export default function Home() {
  const { user, logout } = useAuth();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();
  const { data: access } = trpc.auth.checkAccess.useQuery(undefined, { enabled: !!user });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const globeContacts: GlobeContact[] = useMemo(() => {
    if (!contacts) return [];
    return contacts.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role ?? undefined,
      organization: c.organization ?? undefined,
      country: extractCountry(c.location),
      group: c.group ?? undefined,
      tier: c.tier ?? undefined,
    }));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return globeContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.organization?.toLowerCase().includes(q)) ||
        (c.country?.toLowerCase().includes(q)) ||
        (c.role?.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [globeContacts, searchQuery]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
    }
  }, []);

  // Register keyboard shortcut
  useMemo(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c18", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #151f38",
          background: "rgba(6,9,20,0.9)",
          backdropFilter: "blur(12px)",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          position: "relative",
          zIndex: 100,
        }}
      >
        <div style={{ width: 3, height: 20, background: "#d4a843", borderRadius: 2, boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
        <span style={{
          color: "#d4a843", fontSize: 11, fontWeight: 800, letterSpacing: "0.22em",
          textTransform: "uppercase", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          Strategic Network Intelligence
        </span>
        <div style={{ flex: 1 }} />

        {/* Quick Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded transition-all"
          style={{ background: "rgba(74,96,128,0.08)", border: "1px solid rgba(74,96,128,0.2)" }}
          title="Quick Search (Ctrl+K)"
        >
          <Search size={12} style={{ color: "#4a6080" }} />
          <span style={{ color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
            Search
          </span>
          <kbd style={{
            color: "#2a3a54", fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
            background: "#151f38", padding: "1px 4px", borderRadius: 3, border: "1px solid #1a3a6a",
          }}>
            ⌘K
          </kbd>
        </button>

        {/* Status */}
        <span style={{ color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
          {isLoading ? "LOADING..." : `${globeContacts.length} CONTACTS INDEXED`}
        </span>

        {/* Admin link */}
        {access?.isAdmin && (
          <Link href="/admin" className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded transition-all"
            style={{ background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.2)" }}>
            <Shield size={12} style={{ color: "#d4a843" }} />
            <span style={{ color: "#d4a843", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
              Admin
            </span>
          </Link>
        )}

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3 ml-2">
            <span style={{ color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}>
              {user.name || user.email}
            </span>
            <button onClick={logout} className="text-[#4a6080] hover:text-[#f87171] transition-colors" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          style={{
            position: "fixed", top: 56, left: 0, right: 0, zIndex: 200,
            display: "flex", justifyContent: "center", padding: "16px 24px",
          }}
        >
          <div style={{
            width: "100%", maxWidth: 560, background: "#0d1020", border: "1px solid #1a3a6a",
            borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #151f38" }}>
              <Search size={14} style={{ color: "#d4a843", flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts by name, org, country, role..."
                autoFocus
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#c8d8f0", fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                }}
              />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                style={{ color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", background: "#151f38", padding: "2px 6px", borderRadius: 3 }}>
                ESC
              </button>
            </div>
            {searchQuery.trim() && (
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "#2a3a54", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    No contacts found
                  </div>
                ) : (
                  filteredContacts.map((c) => (
                    <a
                      key={c.id}
                      href={`/profile/${c.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
                        borderBottom: "1px solid #0a0c18", textDecoration: "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#151f38")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, background: "#151f38", border: "1px solid #1a3a6a",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#d4a843", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                      }}>
                        {c.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#c8d8f0", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>
                          {c.name}
                        </div>
                        <div style={{ color: "#4a6080", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {[c.role, c.organization, c.country].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Globe */}
      <main style={{ flex: 1, padding: "16px 16px 24px" }}>
        {isLoading ? (
          <div style={{
            height: 650, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#0a0c18", borderRadius: 8, border: "1px solid #151f38",
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, border: "2px solid #1a3a6a", borderTopColor: "#d4a843",
                borderRadius: "50%", animation: "spin 1s linear infinite",
              }} />
              <span style={{
                color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.2em", textTransform: "uppercase",
              }}>
                Loading contacts...
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <GlobeWidget contacts={globeContacts} height={650} />
        )}
      </main>
    </div>
  );
}
