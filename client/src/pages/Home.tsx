import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import GlobeWidget from "@/components/GlobeWidget";
import type { Contact as GlobeContact } from "@/components/GlobeWidget";
import { extractCountry } from "@shared/utils";
import { Link, useLocation } from "wouter";
import {
  Shield, LogOut, Search, Globe, List, Mail, ChevronRight,
  Users, MapPin, Building, X, ArrowUpDown,
} from "lucide-react";

type ViewMode = "globe" | "list";
type SortKey = "name" | "organization" | "location" | "tier" | "group";

export default function Home() {
  const { user, logout } = useAuth();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();
  const { data: access } = trpc.auth.checkAccess.useQuery(undefined, { enabled: !!user });
  const [, setLocation] = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>("globe");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Stats
  const stats = useMemo(() => {
    if (!contacts) return { total: 0, countries: 0, orgs: 0 };
    const countries = new Set(contacts.map(c => extractCountry(c.location)).filter(Boolean));
    const orgs = new Set(contacts.map(c => c.organization).filter(Boolean));
    return { total: contacts.length, countries: countries.size, orgs: orgs.size };
  }, [contacts]);

  // Search overlay results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (contacts ?? []).filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.organization?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.group?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [contacts, searchQuery]);

  // List view filtered + sorted
  const listContacts = useMemo(() => {
    let filtered = contacts ?? [];
    if (listFilter.trim()) {
      const q = listFilter.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.organization?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortKey] ?? "").toLowerCase();
      const bVal = (b[sortKey] ?? "").toLowerCase();
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [contacts, listFilter, sortKey, sortAsc]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortAsc(prev => !prev);
    else { setSortKey(key); setSortAsc(true); }
  }, [sortKey]);

  const tierColor = (tier: string | null | undefined) => {
    if (!tier) return { bg: "#0d1020", border: "#1a2040", text: "#4a6080" };
    if (tier === "Tier 1") return { bg: "#0d1f0d", border: "#1a4a1a", text: "#4ade80" };
    if (tier === "Tier 2") return { bg: "#0d1828", border: "#1a3a5a", text: "#60a5fa" };
    if (tier === "Tier 3") return { bg: "#1f0d0d", border: "#4a1a1a", text: "#f87171" };
    return { bg: "#120d1f", border: "#2d1a5a", text: "#a78bfa" };
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0c18" }}>
      {/* ═══ HEADER ═══ */}
      <header className="shrink-0 relative z-[100]" style={{
        borderBottom: "1px solid #151f38",
        background: "rgba(6,9,20,0.92)",
        backdropFilter: "blur(16px)",
      }}>
        <div className="flex items-center h-14 px-5 gap-3">
          {/* Brand */}
          <div className="w-[3px] h-5 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
          <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.22em] uppercase hidden sm:inline"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Strategic Network Intelligence
          </span>
          <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.22em] uppercase sm:hidden"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            SNI
          </span>

          <div className="flex-1" />

          {/* View Toggle */}
          <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid #151f38" }}>
            <button
              onClick={() => setViewMode("globe")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: viewMode === "globe" ? "rgba(212,168,67,0.12)" : "transparent",
                color: viewMode === "globe" ? "#d4a843" : "#4a6080",
              }}
            >
              <Globe size={11} /> Globe
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: viewMode === "list" ? "rgba(212,168,67,0.12)" : "transparent",
                color: viewMode === "list" ? "#d4a843" : "#4a6080",
                borderLeft: "1px solid #151f38",
              }}
            >
              <List size={11} /> List
            </button>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded transition-all hover:border-[#1a3a6a]"
            style={{ background: "rgba(74,96,128,0.06)", border: "1px solid rgba(74,96,128,0.15)" }}
            title="Quick Search (Ctrl+K)"
          >
            <Search size={12} className="text-[#4a6080]" />
            <span className="text-[#4a6080] text-[10px] hidden md:inline" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Search</span>
            <kbd className="text-[#2a3a54] text-[9px] bg-[#151f38] px-1.5 py-0.5 rounded hidden md:inline"
              style={{ fontFamily: "'JetBrains Mono', monospace", border: "1px solid #1a3a6a" }}>
              ⌘K
            </kbd>
          </button>

          {/* Stats Pill */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded"
            style={{ background: "rgba(74,96,128,0.06)", border: "1px solid rgba(74,96,128,0.1)" }}>
            <StatPill icon={<Users size={10} />} value={stats.total} label="contacts" />
            <div className="w-px h-3 bg-[#151f38]" />
            <StatPill icon={<MapPin size={10} />} value={stats.countries} label="countries" />
            <div className="w-px h-3 bg-[#151f38]" />
            <StatPill icon={<Building size={10} />} value={stats.orgs} label="orgs" />
          </div>

          {/* Admin */}
          {access?.isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:bg-[rgba(212,168,67,0.12)]"
              style={{ border: "1px solid rgba(212,168,67,0.2)" }}>
              <Shield size={12} className="text-[#d4a843]" />
              <span className="text-[#d4a843] text-[10px] font-bold tracking-[0.12em] uppercase hidden sm:inline"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>Admin</span>
            </Link>
          )}

          {/* User */}
          {user && (
            <div className="flex items-center gap-2.5 ml-1">
              <div className="w-7 h-7 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[10px] font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-[#4a6080] text-[10px] hidden md:inline max-w-[120px] truncate"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {user.name || user.email}
              </span>
              <button onClick={logout} className="text-[#4a6080] hover:text-[#f87171] transition-colors p-1" title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ═══ SEARCH OVERLAY ═══ */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-[199] bg-black/40" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="fixed top-14 left-0 right-0 z-[200] flex justify-center px-4 pt-4">
            <div className="w-full max-w-xl rounded-lg overflow-hidden"
              style={{ background: "#0d1020", border: "1px solid #1a3a6a", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #151f38" }}>
                <Search size={14} className="text-[#d4a843] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name, org, country, role..."
                  className="flex-1 bg-transparent border-none outline-none text-[#c8d8f0] text-[13px]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="text-[#4a6080] hover:text-[#c8d8f0] transition-colors">
                  <X size={14} />
                </button>
              </div>
              {searchQuery.trim() && (
                <div className="max-h-[360px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-[#2a3a54] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      No contacts found
                    </div>
                  ) : searchResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); setLocation(`/profile/${c.id}`); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#151f38]"
                      style={{ borderBottom: "1px solid #0a0c18" }}
                    >
                      <div className="w-8 h-8 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[11px] font-bold shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#c8d8f0] text-[12px] font-semibold truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {c.name}
                        </div>
                        <div className="text-[#4a6080] text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {[c.role, c.organization, extractCountry(c.location)].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {c.tier && (
                        <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shrink-0"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            ...tierColor(c.tier),
                            background: tierColor(c.tier).bg,
                            border: `1px solid ${tierColor(c.tier).border}`,
                            color: tierColor(c.tier).text,
                          }}>
                          {c.tier}
                        </span>
                      )}
                      <ChevronRight size={12} className="text-[#2a3a54] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: 650 }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#1a3a6a] border-t-[#d4a843] animate-spin" />
              <span className="text-[#4a6080] text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Loading intelligence network...
              </span>
            </div>
          </div>
        ) : viewMode === "globe" ? (
          <div className="px-3 pb-4 pt-2">
            <GlobeWidget contacts={globeContacts} height={650} />
          </div>
        ) : (
          /* ═══ LIST VIEW ═══ */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {/* List Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[3px] h-5 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
              <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.22em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Contact Directory
              </span>
              <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                [{listContacts.length}]
              </span>
              <div className="flex-1" />
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
                <input
                  type="text"
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  placeholder="Filter contacts..."
                  className="pl-8 pr-3 py-2 rounded text-[12px] text-[#c8d8f0] placeholder-[#2a3a54] bg-[#060914] border border-[#151f38] outline-none w-56 focus:border-[#1a3a6a] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #151f38" }}>
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr_80px] gap-0 px-4 py-3"
                style={{ background: "#060914", borderBottom: "1px solid #151f38" }}>
                {([
                  { key: "name", label: "Name" },
                  { key: "organization", label: "Organization" },
                  { key: "location", label: "Location" },
                  { key: "group", label: "Group" },
                  { key: "tier", label: "Tier" },
                ] as { key: SortKey; label: string }[]).map(col => (
                  <button
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 text-[9px] font-extrabold tracking-[0.18em] uppercase text-left transition-colors hover:text-[#d4a843]"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: sortKey === col.key ? "#d4a843" : "#4a6080",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <ArrowUpDown size={9} className="text-[#d4a843]" style={{ transform: sortAsc ? "none" : "scaleY(-1)" }} />
                    )}
                  </button>
                ))}
                <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#4a6080] text-right"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Actions
                </span>
              </div>

              {/* Table Rows */}
              {listContacts.length === 0 ? (
                <div className="py-12 text-center text-[#2a3a54] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  No contacts match your filter
                </div>
              ) : listContacts.map((c, i) => {
                const tc = tierColor(c.tier);
                return (
                  <div
                    key={c.id}
                    className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr_80px] gap-0 px-4 py-3 items-center transition-colors hover:bg-[#0d1020] group"
                    style={{
                      borderBottom: i < listContacts.length - 1 ? "1px solid #0d1020" : "none",
                      background: i % 2 === 0 ? "transparent" : "rgba(6,9,20,0.4)",
                    }}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[10px] font-bold shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/profile/${c.id}`}
                          className="text-[#c8d8f0] text-[12px] font-semibold truncate block hover:text-[#d4a843] transition-colors"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {c.name}
                        </Link>
                        {c.role && (
                          <div className="text-[#4a6080] text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {c.role}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Org */}
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.organization || "—"}
                    </span>
                    {/* Location */}
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.location || "—"}
                    </span>
                    {/* Group */}
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.group || "—"}
                    </span>
                    {/* Tier */}
                    {c.tier ? (
                      <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded inline-block w-fit"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: tc.bg,
                          border: `1px solid ${tc.border}`,
                          color: tc.text,
                        }}>
                        {c.tier}
                      </span>
                    ) : (
                      <span className="text-[#2a3a54] text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>—</span>
                    )}
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5">
                      {c.email && (
                        <a href={`mailto:${c.email}`}
                          className="p-1.5 rounded text-[#4a6080] hover:text-[#d4a843] hover:bg-[rgba(212,168,67,0.08)] transition-all opacity-0 group-hover:opacity-100"
                          title={`Email ${c.name}`}>
                          <Mail size={12} />
                        </a>
                      )}
                      <Link href={`/profile/${c.id}`}
                        className="p-1.5 rounded text-[#4a6080] hover:text-[#d4a843] hover:bg-[rgba(212,168,67,0.08)] transition-all opacity-0 group-hover:opacity-100"
                        title="View profile">
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STAT PILL
// ═══════════════════════════════════════════════════════════════════════

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[#4a6080]">{icon}</span>
      <span className="text-[#c8d8f0] text-[10px] font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </span>
      <span className="text-[#2a3a54] text-[9px] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    </div>
  );
}
