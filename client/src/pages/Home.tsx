import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import GlobeWidget from "@/components/GlobeWidget";
import type { Contact as GlobeContact } from "@/components/GlobeWidget";
import { extractCountry } from "@shared/utils";
import { Link, useLocation } from "wouter";
import {
  Shield, LogOut, Search, Globe, List, Mail, ChevronRight,
  Users, MapPin, Building, X, ArrowUpDown, Download, Upload,
  AlertTriangle, Clock, RotateCcw, Smartphone, Menu, Network,
} from "lucide-react";
import { toast } from "sonner";
import IntelligentSearch from "@/components/IntelligentSearch";

type ViewMode = "globe" | "list" | "stale";
type SortKey = "name" | "organization" | "location" | "tier" | "group";

// ═══════════════════════════════════════════════════════════════════════
// LANDSCAPE PROMPT COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function LandscapePrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center"
      style={{ background: "#060914", borderRadius: 8, border: "1px solid #151f38", margin: "8px 12px" }}
    >
      <div className="relative">
        <Smartphone size={48} className="text-[#d4a843]" />
        <RotateCcw size={20} className="text-[#60a5fa] absolute -right-2 -bottom-1 animate-pulse" />
      </div>
      <div>
        <p className="text-[#c8d8f0] text-sm font-semibold mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
          Rotate for Best Experience
        </p>
        <p className="text-[#4a6080] text-xs max-w-[260px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          The 3D globe works best in landscape mode. Rotate your device or tap below to continue.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="px-5 py-2 rounded text-[10px] font-bold tracking-wider uppercase transition-all"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          background: "rgba(212,168,67,0.12)",
          border: "1px solid rgba(212,168,67,0.3)",
          color: "#d4a843",
        }}
      >
        Continue Anyway
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MOBILE CONTACT CARD (for list view on small screens)
// ═══════════════════════════════════════════════════════════════════════

function MobileContactCard({ contact, tierColor }: {
  contact: any;
  tierColor: (tier: string | null | undefined) => { bg: string; border: string; text: string };
}) {
  const tc = tierColor(contact.tier);
  return (
    <Link
      href={`/profile/${contact.id}`}
      className="flex items-center gap-3 px-3 py-3 transition-all active:bg-[#0d1020]"
      style={{ borderBottom: "1px solid #0d1020" }}
    >
      <div
        className="w-9 h-9 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[11px] font-bold shrink-0"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {contact.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[#c8d8f0] text-[12px] font-semibold truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {contact.name}
          </span>
          {contact.tier && (
            <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: tc.bg,
                border: `1px solid ${tc.border}`,
                color: tc.text,
              }}>
              {contact.tier}
            </span>
          )}
        </div>
        <div className="text-[#4a6080] text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {[contact.role, contact.organization].filter(Boolean).join(" · ")}
        </div>
        {contact.location && (
          <div className="text-[#2a3a54] text-[9px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {contact.location}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded text-[#4a6080] active:text-[#d4a843] active:bg-[rgba(212,168,67,0.08)]"
            title={`Email ${contact.name}`}
          >
            <Mail size={14} />
          </a>
        )}
        <ChevronRight size={14} className="text-[#2a3a54]" />
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function Home() {
  const { user, logout } = useAuth();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery();
  const { data: access } = trpc.auth.checkAccess.useQuery(undefined, { enabled: !!user });
  const { data: staleContacts } = trpc.contacts.stale.useQuery({ daysSince: 30 });
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [viewMode, setViewMode] = useState<ViewMode>("globe");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listFilter, setListFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [importing, setImporting] = useState(false);
  const [landscapeDismissed, setLandscapeDismissed] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile + portrait
  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsPortrait(mobile && window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", () => setTimeout(checkOrientation, 100));
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", () => {});
    };
  }, []);

  const exportCsv = trpc.contacts.exportCsv.useQuery(undefined, { enabled: false });
  const importCsv = trpc.contacts.importCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} contacts`);
      utils.contacts.list.invalidate();
      utils.contacts.stale.invalidate();
      setImporting(false);
    },
    onError: (err) => {
      toast.error(`Import failed: ${err.message}`);
      setImporting(false);
    },
  });

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
    if (!contacts) return { total: 0, countries: 0, orgs: 0, stale: 0 };
    const countries = new Set(contacts.map(c => extractCountry(c.location)).filter(Boolean));
    const orgs = new Set(contacts.map(c => c.organization).filter(Boolean));
    return { total: contacts.length, countries: countries.size, orgs: orgs.size, stale: staleContacts?.length ?? 0 };
  }, [contacts, staleContacts]);

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
        setMobileMenuOpen(false);
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

  const handleExportCsv = async () => {
    try {
      const result = await exportCsv.refetch();
      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
      }
    } catch {
      toast.error("Export failed");
    }
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const csvContent = ev.target?.result as string;
      importCsv.mutate({ csvContent });
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const daysSince = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Show landscape prompt for globe on mobile portrait
  const showLandscapePrompt = viewMode === "globe" && isMobile && isPortrait && !landscapeDismissed;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0c18" }}>
      {/* ═══ HEADER ═══ */}
      <header className="shrink-0 relative z-[100]" style={{
        borderBottom: "1px solid #151f38",
        background: "rgba(6,9,20,0.92)",
        backdropFilter: "blur(16px)",
      }}>
        <div className="flex items-center h-12 sm:h-14 px-3 sm:px-5 gap-2 sm:gap-3">
          {/* Brand */}
          <div className="w-[3px] h-4 sm:h-5 rounded-sm bg-[#d4a843] shrink-0" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
          <span className="text-[#d4a843] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase hidden sm:inline"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Strategic Network Intelligence
          </span>
          <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.22em] uppercase sm:hidden"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            SNI
          </span>

          <div className="flex-1" />

          {/* View Toggle — always visible */}
          <div className="flex rounded-md overflow-hidden shrink-0" style={{ border: "1px solid #151f38" }}>
            {([
              { mode: "globe" as ViewMode, icon: <Globe size={11} />, label: "Globe" },
              { mode: "list" as ViewMode, icon: <List size={11} />, label: "List" },
              { mode: "stale" as ViewMode, icon: <AlertTriangle size={11} />, label: "Stale" },
            ]).map((v, i) => (
              <button
                key={v.mode}
                onClick={() => setViewMode(v.mode)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: viewMode === v.mode ? "rgba(212,168,67,0.12)" : "transparent",
                  color: viewMode === v.mode ? "#d4a843" : "#4a6080",
                  borderLeft: i > 0 ? "1px solid #151f38" : "none",
                }}
              >
                {v.icon}
                <span className="hidden sm:inline">{v.label}</span>
                {v.mode === "stale" && stats.stale > 0 && (
                  <span className="ml-0.5 text-[7px] sm:text-[8px] bg-[#f87171] text-white rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center font-bold">
                    {stats.stale > 9 ? "9+" : stats.stale}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop: CSV, Search, Stats, Admin, User */}
          <div className="hidden md:flex items-center gap-2">
            {/* CSV Buttons */}
            <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid #151f38" }}>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(74,96,128,0.1)]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4a6080" }}
                title="Export contacts as CSV"
              >
                <Download size={11} /> Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(74,96,128,0.1)]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: importing ? "#2a3a54" : "#4a6080",
                  borderLeft: "1px solid #151f38",
                }}
                title="Import contacts from CSV"
              >
                <Upload size={11} /> {importing ? "..." : "Import"}
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
              <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Search</span>
              <kbd className="text-[#2a3a54] text-[9px] bg-[#151f38] px-1.5 py-0.5 rounded"
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

            {/* Connections */}
            <Link href="/connections" className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:bg-[rgba(96,165,250,0.12)]"
              style={{ border: "1px solid rgba(96,165,250,0.2)" }}>
              <Network size={12} className="text-[#60a5fa]" />
              <span className="text-[#60a5fa] text-[10px] font-bold tracking-[0.12em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>Graph</span>
            </Link>

            {/* Admin */}
            {access?.isAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-all hover:bg-[rgba(212,168,67,0.12)]"
                style={{ border: "1px solid rgba(212,168,67,0.2)" }}>
                <Shield size={12} className="text-[#d4a843]" />
                <span className="text-[#d4a843] text-[10px] font-bold tracking-[0.12em] uppercase"
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
                <span className="text-[#4a6080] text-[10px] max-w-[120px] truncate"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {user.name || user.email}
                </span>
                <button onClick={logout} className="text-[#4a6080] hover:text-[#f87171] transition-colors p-1" title="Sign out">
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile: Search + Menu */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded transition-all active:bg-[rgba(74,96,128,0.1)]"
              title="Search"
            >
              <Search size={16} className="text-[#4a6080]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded transition-all active:bg-[rgba(74,96,128,0.1)]"
            >
              {mobileMenuOpen ? <X size={16} className="text-[#d4a843]" /> : <Menu size={16} className="text-[#4a6080]" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: "1px solid #151f38", background: "rgba(6,9,20,0.98)" }}>
            {/* Stats row */}
            <div className="flex items-center justify-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid #0d1020" }}>
              <StatPill icon={<Users size={10} />} value={stats.total} label="contacts" />
              <div className="w-px h-3 bg-[#151f38]" />
              <StatPill icon={<MapPin size={10} />} value={stats.countries} label="countries" />
              <div className="w-px h-3 bg-[#151f38]" />
              <StatPill icon={<Building size={10} />} value={stats.orgs} label="orgs" />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-px" style={{ background: "#0d1020" }}>
              <button
                onClick={() => { handleExportCsv(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-wider uppercase transition-all active:bg-[#151f38]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4a6080", background: "#060914" }}
              >
                <Download size={12} /> Export CSV
              </button>
              <button
                onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                disabled={importing}
                className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-wider uppercase transition-all active:bg-[#151f38]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: importing ? "#2a3a54" : "#4a6080", background: "#060914" }}
              >
                <Upload size={12} /> {importing ? "Importing..." : "Import CSV"}
              </button>
              {access?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-wider uppercase transition-all active:bg-[#151f38]"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#d4a843", background: "#060914" }}
                >
                  <Shield size={12} /> Admin Panel
                </Link>
              )}
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold tracking-wider uppercase transition-all active:bg-[#151f38]"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#f87171", background: "#060914" }}
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: "1px solid #0d1020" }}>
                <div className="w-6 h-6 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[9px] font-bold"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span className="text-[#4a6080] text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {user.name || user.email}
                </span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCsv}
        className="hidden"
      />

      {/* ═══ SEARCH OVERLAY ═══ */}
      {searchOpen && (
        <>
          <div className="fixed inset-0 z-[199] bg-black/40" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
          <div className="fixed top-12 sm:top-14 left-0 right-0 z-[200] flex justify-center px-2 sm:px-4 pt-2 sm:pt-4">
            <div className="w-full max-w-xl rounded-lg overflow-hidden"
              style={{ background: "#0d1020", border: "1px solid #1a3a6a", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3" style={{ borderBottom: "1px solid #151f38" }}>
                <Search size={14} className="text-[#d4a843] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="flex-1 bg-transparent border-none outline-none text-[#c8d8f0] text-[13px]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  autoComplete="off"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="text-[#4a6080] hover:text-[#c8d8f0] transition-colors p-1">
                  <X size={14} />
                </button>
              </div>
              {searchQuery.trim() && (
                <div className="max-h-[50vh] sm:max-h-[360px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-[#2a3a54] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      No contacts found
                    </div>
                  ) : searchResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); setLocation(`/profile/${c.id}`); }}
                      className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left transition-colors hover:bg-[#151f38] active:bg-[#151f38]"
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
          <div className="flex items-center justify-center" style={{ height: isMobile ? 400 : 650 }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#1a3a6a] border-t-[#d4a843] animate-spin" />
              <span className="text-[#4a6080] text-[10px] tracking-[0.2em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Loading intelligence network...
              </span>
            </div>
          </div>
        ) : viewMode === "globe" ? (
          showLandscapePrompt ? (
            <LandscapePrompt onDismiss={() => setLandscapeDismissed(true)} />
          ) : (
            <div className="px-1 sm:px-3 pb-2 sm:pb-4 pt-1 sm:pt-2">
              <GlobeWidget contacts={globeContacts} height={isMobile ? Math.min(window.innerHeight - 60, 500) : 650} />
            </div>
          )
        ) : viewMode === "stale" ? (
          /* ═══ STALE CONTACTS VIEW ═══ */
          <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-[3px] h-5 rounded-sm bg-[#f87171]" style={{ boxShadow: "0 0 10px rgba(248,113,113,0.5)" }} />
              <span className="text-[#f87171] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Stale Contacts
              </span>
              <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                [{staleContacts?.length ?? 0}]
              </span>
            </div>

            {!staleContacts || staleContacts.length === 0 ? (
              <div className="rounded-lg py-12 sm:py-16 text-center" style={{ background: "#060914", border: "1px solid #151f38" }}>
                <Clock size={32} className="mx-auto mb-3 text-[#1a3a6a]" />
                <p className="text-[#4a6080] text-[11px] sm:text-[12px] px-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  All contacts engaged within 30 days
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {staleContacts.map(c => {
                  const days = daysSince(c.lastContactedAt);
                  const urgency = days === null ? "never" : days > 90 ? "critical" : days > 60 ? "warning" : "mild";
                  const urgencyColors = {
                    never: { bg: "#1f0d0d", border: "#4a1a1a", text: "#f87171", label: "NEVER" },
                    critical: { bg: "#1f0d0d", border: "#4a1a1a", text: "#f87171", label: `${days}d` },
                    warning: { bg: "#1f1a0d", border: "#4a3a1a", text: "#fbbf24", label: `${days}d` },
                    mild: { bg: "#0d1828", border: "#1a3a5a", text: "#60a5fa", label: `${days}d` },
                  };
                  const u = urgencyColors[urgency];
                  return (
                    <Link
                      key={c.id}
                      href={`/profile/${c.id}`}
                      className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg transition-all active:bg-[#0d1020] hover:bg-[#0d1020] group"
                      style={{ background: "#060914", border: "1px solid #151f38" }}
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[11px] sm:text-[12px] font-bold shrink-0"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#c8d8f0] text-[11px] sm:text-[12px] font-semibold truncate group-hover:text-[#d4a843] transition-colors"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {c.name}
                        </div>
                        <div className="text-[#4a6080] text-[9px] sm:text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {[c.role, c.organization].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {c.tier && (() => {
                        const tc = tierColor(c.tier);
                        return (
                          <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded shrink-0 hidden sm:inline"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              background: tc.bg,
                              border: `1px solid ${tc.border}`,
                              color: tc.text,
                            }}>
                            {c.tier}
                          </span>
                        );
                      })()}
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded shrink-0"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          background: u.bg,
                          border: `1px solid ${u.border}`,
                          color: u.text,
                        }}>
                        {u.label}
                      </span>
                      <ChevronRight size={12} className="text-[#2a3a54] shrink-0 group-hover:text-[#d4a843] transition-colors hidden sm:block" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ═══ LIST VIEW ═══ */
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
            {/* List Header */}
            <div className="flex items-center gap-3 mb-4 sm:mb-5 flex-wrap">
              <div className="w-[3px] h-5 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
              <span className="text-[#d4a843] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Contact Directory
              </span>
              <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                [{listContacts.length}]
              </span>
              <div className="flex-1" />
              <div className="relative w-full sm:w-auto">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
                <input
                  type="text"
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  placeholder="Filter contacts..."
                  className="pl-8 pr-3 py-2 rounded text-[12px] text-[#c8d8f0] placeholder-[#2a3a54] bg-[#060914] border border-[#151f38] outline-none w-full sm:w-56 focus:border-[#1a3a6a] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
            </div>

            {/* Desktop Table (hidden on mobile) */}
            <div className="rounded-lg overflow-hidden hidden md:block" style={{ border: "1px solid #151f38" }}>
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr_0.6fr_80px] gap-0 px-4 py-3"
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
                  Tags
                </span>
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
                    className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr_0.5fr_0.6fr_80px] gap-0 px-4 py-3 items-center transition-colors hover:bg-[#0d1020] group"
                    style={{
                      borderBottom: i < listContacts.length - 1 ? "1px solid #0d1020" : "none",
                      background: i % 2 === 0 ? "transparent" : "rgba(6,9,20,0.4)",
                    }}
                  >
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
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.organization || "—"}
                    </span>
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.location || "—"}
                    </span>
                    <span className="text-[#4a6080] text-[11px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {c.group || "—"}
                    </span>
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
                    <div className="flex items-center gap-1 flex-wrap">
                      {c.sector && (
                        <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: "rgba(168,85,247,0.08)",
                            border: "1px solid rgba(168,85,247,0.25)",
                            color: "#a855f7",
                          }}>
                          {c.sector.split(",")[0].trim()}
                        </span>
                      )}
                      {c.event && (
                        <span className="text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: "rgba(236,72,153,0.08)",
                            border: "1px solid rgba(236,72,153,0.25)",
                            color: "#ec4899",
                          }}>
                          {c.event.split(" ")[0]}
                        </span>
                      )}
                    </div>
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

            {/* Mobile Card List (visible on mobile only) */}
            <div className="md:hidden rounded-lg overflow-hidden" style={{ border: "1px solid #151f38", background: "#060914" }}>
              {/* Sort controls for mobile */}
              <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto" style={{ borderBottom: "1px solid #151f38" }}>
                <span className="text-[#4a6080] text-[9px] tracking-wider uppercase shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Sort:
                </span>
                {(["name", "organization", "tier"] as SortKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold tracking-wider uppercase shrink-0 transition-all"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: sortKey === key ? "rgba(212,168,67,0.12)" : "transparent",
                      border: `1px solid ${sortKey === key ? "rgba(212,168,67,0.3)" : "#151f38"}`,
                      color: sortKey === key ? "#d4a843" : "#4a6080",
                    }}
                  >
                    {key}
                    {sortKey === key && <ArrowUpDown size={8} />}
                  </button>
                ))}
              </div>

              {listContacts.length === 0 ? (
                <div className="py-12 text-center text-[#2a3a54] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  No contacts match your filter
                </div>
              ) : listContacts.map(c => (
                <MobileContactCard key={c.id} contact={c} tierColor={tierColor} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ═══ INTELLIGENT SEARCH — only visible in list view ═══ */}
      {viewMode === "list" && <IntelligentSearch />}
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
