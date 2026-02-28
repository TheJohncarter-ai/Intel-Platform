import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle,
  Shield, Clock, Eye, FileText, Trash2, ChevronLeft, ChevronRight,
  Plus, Send, Users, Activity, BarChart3, Mail, Sparkles, Edit3,
} from "lucide-react";
import { toast } from "sonner";

type AuditAction = "profile_view" | "note_added" | "note_deleted" | "access_approved" | "access_denied" | "whitelist_added" | "whitelist_removed" | "contact_updated" | "contact_researched" | "invite_sent";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  profile_view:       { label: "Profile View",       color: "#60a5fa", icon: <Eye size={12} /> },
  note_added:         { label: "Note Added",         color: "#4ade80", icon: <FileText size={12} /> },
  note_deleted:       { label: "Note Deleted",       color: "#f87171", icon: <Trash2 size={12} /> },
  access_approved:    { label: "Access Approved",    color: "#4ade80", icon: <CheckCircle size={12} /> },
  access_denied:      { label: "Access Denied",      color: "#f87171", icon: <XCircle size={12} /> },
  whitelist_added:    { label: "Whitelist Added",    color: "#d4a843", icon: <UserPlus size={12} /> },
  whitelist_removed:  { label: "Whitelist Removed",  color: "#f87171", icon: <UserMinus size={12} /> },
  contact_updated:    { label: "Contact Updated",    color: "#a78bfa", icon: <Edit3 size={12} /> },
  contact_researched: { label: "Contact Researched", color: "#f59e0b", icon: <Sparkles size={12} /> },
  invite_sent:        { label: "Invite Sent",        color: "#34d399", icon: <Send size={12} /> },
};

type Tab = "overview" | "requests" | "whitelist" | "audit";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview",  label: "Overview",         icon: <BarChart3 size={12} /> },
    { key: "requests",  label: "Access Requests",  icon: <Users size={12} /> },
    { key: "whitelist", label: "Whitelist",         icon: <Shield size={12} /> },
    { key: "audit",     label: "Audit Log",         icon: <Activity size={12} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0c18" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #151f38", background: "rgba(6,9,20,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#4a6080] hover:text-[#d4a843] transition-colors p-1">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-[3px] h-5 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
          <Shield className="h-4 w-4 text-[#d4a843]" />
          <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.22em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Admin Panel
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-5">
        <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #151f38" }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-3 text-[10px] font-bold tracking-[0.12em] uppercase transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: activeTab === tab.key ? "#d4a843" : "#4a6080",
                borderBottom: `2px solid ${activeTab === tab.key ? "#d4a843" : "transparent"}`,
                background: "none",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "requests" && <AccessRequestsTab />}
        {activeTab === "whitelist" && <WhitelistTab />}
        {activeTab === "audit" && <AuditLogTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════

function OverviewTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  if (isLoading) return <LoadingState />;

  const cards = [
    { label: "Total Contacts", value: stats?.totalContacts ?? 0, color: "#d4a843", icon: <Users size={16} /> },
    { label: "Whitelisted Users", value: stats?.totalWhitelisted ?? 0, color: "#4ade80", icon: <Shield size={16} /> },
    { label: "Pending Requests", value: stats?.pendingRequests ?? 0, color: "#f59e0b", icon: <Clock size={16} /> },
    { label: "Total Notes", value: stats?.totalNotes ?? 0, color: "#60a5fa", icon: <FileText size={16} /> },
    { label: "Recent Activity", value: stats?.recentActivity ?? 0, color: "#a78bfa", icon: <Activity size={16} /> },
  ];

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Platform Statistics" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map(card => (
          <div key={card.label} className="p-4 rounded-lg transition-colors hover:border-[#1a3a6a]"
            style={{ background: "#060914", border: "1px solid #151f38" }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: card.color }}>{card.icon}</span>
              <span className="text-[#4a6080] text-[9px] font-extrabold tracking-[0.15em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Syne', sans-serif", color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Section */}
      <InviteSection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INVITE SECTION
// ═══════════════════════════════════════════════════════════════════════

function InviteSection() {
  const utils = trpc.useUtils();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const inviteMutation = trpc.admin.invite.useMutation({
    onSuccess: () => {
      utils.admin.whitelist.list.invalidate();
      utils.admin.stats.invalidate();
      setInviteEmail("");
      setInviteMessage("");
      setShowMessage(false);
      toast.success("Invite sent — user added to whitelist");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-5 rounded-lg" style={{ background: "#060914", border: "1px solid #151f38" }}>
      <div className="flex items-center gap-2 mb-4">
        <Send size={14} className="text-[#34d399]" />
        <span className="text-[#34d399] text-[10px] font-extrabold tracking-[0.18em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Invite User
        </span>
      </div>
      <p className="text-[#4a6080] text-xs mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Invite someone to the platform by email. They'll be added to the whitelist and can sign in immediately.
      </p>
      <div className="flex gap-3 items-start">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-8 pr-3 py-2.5 rounded text-sm text-[#c8d8f0] placeholder-[#2a3a54] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inviteEmail) inviteMutation.mutate({ email: inviteEmail, message: inviteMessage || undefined });
                }}
              />
            </div>
            <button
              onClick={() => setShowMessage(!showMessage)}
              className="px-3 py-2.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: showMessage ? "rgba(52,211,153,0.12)" : "transparent",
                border: "1px solid rgba(52,211,153,0.2)",
                color: "#34d399",
              }}
              title="Add a personal message"
            >
              + Msg
            </button>
          </div>
          {showMessage && (
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Optional personal message..."
              className="w-full px-3 py-2 rounded text-xs text-[#c8d8f0] placeholder-[#2a3a54] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors resize-none"
              style={{ fontFamily: "'JetBrains Mono', monospace", minHeight: 60 }}
              maxLength={500}
            />
          )}
        </div>
        <button
          onClick={() => inviteEmail && inviteMutation.mutate({ email: inviteEmail, message: inviteMessage || undefined })}
          disabled={!inviteEmail || inviteMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded text-xs font-bold tracking-wider uppercase disabled:opacity-40 transition-all shrink-0"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "linear-gradient(135deg, #34d399, #059669)",
            color: "#0a0c18",
          }}
        >
          <Send size={12} />
          {inviteMutation.isPending ? "Sending..." : "Invite"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ACCESS REQUESTS TAB
// ═══════════════════════════════════════════════════════════════════════

function AccessRequestsTab() {
  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.admin.requests.list.useQuery();

  const approveMutation = trpc.admin.requests.approve.useMutation({
    onSuccess: () => {
      utils.admin.requests.list.invalidate();
      utils.admin.whitelist.list.invalidate();
      utils.admin.stats.invalidate();
      toast.success("Access approved and email added to whitelist");
    },
  });

  const denyMutation = trpc.admin.requests.deny.useMutation({
    onSuccess: () => {
      utils.admin.requests.list.invalidate();
      utils.admin.stats.invalidate();
      toast.success("Access request denied");
    },
  });

  if (isLoading) return <LoadingState />;

  const pending = requests?.filter(r => r.status === "pending") ?? [];
  const resolved = requests?.filter(r => r.status !== "pending") ?? [];

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader title="Pending Requests" count={pending.length} />
      {pending.length === 0 ? (
        <EmptyState text="No pending requests" />
      ) : (
        <div className="space-y-2">
          {pending.map(req => (
            <div key={req.id} className="p-4 rounded-lg flex items-start justify-between gap-4 transition-colors hover:border-[#1a3a6a]"
              style={{ background: "#060914", border: "1px solid #151f38" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#c8d8f0] text-sm font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {req.name || "Unknown"}
                  </span>
                  <span className="text-[#4a6080] text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {req.email}
                  </span>
                </div>
                {req.reason && (
                  <p className="text-[#4a6080] text-xs mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {req.reason}
                  </p>
                )}
                <span className="text-[#2a3a54] text-[10px] mt-2 block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => approveMutation.mutate({ id: req.id })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(74,222,128,0.15)]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "#0d1f0d",
                    border: "1px solid #1a4a1a",
                    color: "#4ade80",
                  }}
                >
                  <CheckCircle size={12} /> Approve
                </button>
                <button
                  onClick={() => denyMutation.mutate({ id: req.id })}
                  disabled={denyMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(248,113,113,0.15)]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "#1f0d0d",
                    border: "1px solid #4a1a1a",
                    color: "#f87171",
                  }}
                >
                  <XCircle size={12} /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <>
          <SectionHeader title="Resolved" count={resolved.length} />
          <div className="space-y-2">
            {resolved.map(req => (
              <div key={req.id} className="p-3 rounded-lg flex items-center justify-between gap-4 opacity-70"
                style={{ background: "#060914", border: "1px solid #151f38" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                    req.status === "approved"
                      ? "text-[#4ade80] bg-[#0d1f0d] border border-[#1a4a1a]"
                      : "text-[#f87171] bg-[#1f0d0d] border border-[#4a1a1a]"
                  }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {req.status}
                  </span>
                  <span className="text-[#c8d8f0] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {req.email}
                  </span>
                  <span className="text-[#2a3a54] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(req.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// WHITELIST TAB
// ═══════════════════════════════════════════════════════════════════════

function WhitelistTab() {
  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.admin.whitelist.list.useQuery();
  const [newEmail, setNewEmail] = useState("");

  const addMutation = trpc.admin.whitelist.add.useMutation({
    onSuccess: () => {
      utils.admin.whitelist.list.invalidate();
      utils.admin.stats.invalidate();
      setNewEmail("");
      toast.success("Email added to whitelist");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.admin.whitelist.remove.useMutation({
    onSuccess: () => {
      utils.admin.whitelist.list.invalidate();
      utils.admin.stats.invalidate();
      toast.success("Email removed from whitelist");
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 pb-8">
      {/* Add email */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-8 pr-3 py-2.5 rounded text-sm text-[#c8d8f0] placeholder-[#2a3a54] bg-[#060914] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newEmail) addMutation.mutate({ email: newEmail });
            }}
          />
        </div>
        <button
          onClick={() => newEmail && addMutation.mutate({ email: newEmail })}
          disabled={!newEmail || addMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded text-xs font-bold tracking-wider uppercase disabled:opacity-40 transition-all"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: "#d4a843", color: "#0a0c18" }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <SectionHeader title="Whitelisted Emails" count={entries?.length ?? 0} />
      {!entries?.length ? (
        <EmptyState text="No whitelisted emails" />
      ) : (
        <div className="space-y-1">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3 rounded-lg group transition-colors hover:border-[#1a3a6a]"
              style={{ background: "#060914", border: "1px solid #151f38" }}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.5)" }} />
                <span className="text-[#c8d8f0] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {entry.email}
                </span>
                <span className="text-[#2a3a54] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  added {new Date(entry.createdAt).toLocaleDateString()}
                  {entry.addedBy && ` by ${entry.addedBy}`}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate({ email: entry.email })}
                className="opacity-0 group-hover:opacity-100 text-[#f87171] hover:text-[#fca5a5] transition-all p-1"
              >
                <UserMinus size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AUDIT LOG TAB
// ═══════════════════════════════════════════════════════════════════════

function AuditLogTab() {
  const [filter, setFilter] = useState<AuditAction | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading } = trpc.admin.auditLog.list.useQuery(
    { action: filter, page, pageSize },
    { placeholderData: (prev) => prev }
  );

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="space-y-4 pb-8">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[#4a6080] text-[10px] tracking-[0.18em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>Filter:</span>
        <FilterButton label="All" active={!filter} onClick={() => { setFilter(undefined); setPage(1); }} />
        {Object.entries(ACTION_LABELS).map(([key, val]) => (
          <FilterButton
            key={key}
            label={val.label}
            active={filter === key}
            onClick={() => { setFilter(key as AuditAction); setPage(1); }}
          />
        ))}
      </div>

      {isLoading ? <LoadingState /> : (
        <>
          <div className="space-y-1">
            {data?.entries.map(entry => {
              const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: "#4a6080", icon: null };
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:border-[#1a3a6a]"
                  style={{ background: "#060914", border: "1px solid #151f38" }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shrink-0"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: meta.color,
                      background: `${meta.color}10`,
                      border: `1px solid ${meta.color}30`,
                    }}>
                    {meta.label}
                  </span>
                  <span className="text-[#c8d8f0] text-xs shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {entry.actorName || entry.actorEmail}
                  </span>
                  {entry.details && (
                    <span className="text-[#4a6080] text-xs truncate flex-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.details}
                    </span>
                  )}
                  <span className="text-[#2a3a54] text-[10px] shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
              );
            })}
            {data?.entries.length === 0 && <EmptyState text="No audit entries found" />}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[#4a6080] hover:text-[#d4a843] disabled:opacity-30 transition-colors p-1"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[#4a6080] text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[#4a6080] hover:text-[#d4a843] disabled:opacity-30 transition-colors p-1"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-[3px] h-4 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
      <span className="text-[#d4a843] text-[10px] font-extrabold tracking-[0.18em] uppercase"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>{title}</span>
      {count !== undefined && (
        <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>[{count}]</span>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 rounded-lg" style={{ background: "#060914", border: "1px solid #151f38" }}>
      <span className="text-[#2a3a54] text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{text}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-[#1a3a6a] border-t-[#d4a843] animate-spin" />
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded text-[10px] tracking-wider uppercase transition-all"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: active ? "rgba(212,168,67,0.12)" : "transparent",
        border: `1px solid ${active ? "#d4a843" : "#151f38"}`,
        color: active ? "#d4a843" : "#4a6080",
      }}
    >
      {label}
    </button>
  );
}
