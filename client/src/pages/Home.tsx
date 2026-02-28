import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import GlobeWidget from "@/components/GlobeWidget";
import type { Contact as GlobeContact } from "@/components/GlobeWidget";
import { Link } from "wouter";
import { Shield, LogOut } from "lucide-react";

/**
 * Extract country from a location string like "Bogotá, Colombia" → "Colombia"
 */
function extractCountry(location: string | null | undefined): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || undefined;
}

export default function Home() {
  const { user, logout } = useAuth();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();
  const { data: access } = trpc.auth.checkAccess.useQuery(undefined, { enabled: !!user });

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

        {/* Status */}
        <span style={{ color: "#4a6080", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em" }}>
          {isLoading ? "LOADING..." : `${globeContacts.length} CONTACTS INDEXED`}
        </span>

        {/* Admin link */}
        {access?.isAdmin && (
          <Link href="/admin" className="flex items-center gap-1.5 ml-4 px-3 py-1.5 rounded transition-all"
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
            <button
              onClick={logout}
              className="text-[#4a6080] hover:text-[#f87171] transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </header>

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
