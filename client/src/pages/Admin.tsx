import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, UserPlus, UserMinus, CheckCircle, XCircle,
  Shield, Clock, Eye, FileText, Trash2, ChevronLeft, ChevronRight,
  Globe, Plus,
} from "lucide-react";
import { toast } from "sonner";

type AuditAction = "profile_view" | "note_added" | "note_deleted" | "access_approved" | "access_denied" | "whitelist_added" | "whitelist_removed";

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  profile_view:     { label: "Profile View",     color: "#60a5fa", icon: <Eye size={12} /> },
  note_added:       { label: "Note Added",       color: "#4ade80", icon: <FileText size={12} /> },
  note_deleted:     { label: "Note Deleted",      color: "#f87171", icon: <Trash2 size={12} /> },
  access_approved:  { label: "Access Approved",   color: "#4ade80", icon: <CheckCircle size={12} /> },
  access_denied:    { label: "Access Denied",     color: "#f87171", icon: <XCircle size={12} /> },
  whitelist_added:  { label: "Whitelist Added",   color: "#d4a843", icon: <UserPlus size={12} /> },
  whitelist_removed:{ label: "Whitelist Removed",  color: "#f87171", icon: <UserMinus size={12} /> },
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"requests" | "whitelist" | "audit">("requests");

  return (
    <div className="min-h-screen" style={{ background: "#0a0c18" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #151f38", background: "rgba(6,9,20,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#4a6080] hover:text-[#d4a843] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-0.5 h-5 bg-[#d4a843] rounded-sm" />
          <Shield className="h-4 w-4 text-[#d4a843]" />
          <span className="text-[#d4a843] font-mono text-[10px] font-extrabold tracking-[0.22em] uppercase">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid #151f38" }}>
          {(["requests", "whitelist", "audit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 font-mono text-xs tracking-[0.12em] uppercase transition-all"
              style={{
                color: activeTab === tab ? "#d4a843" : "#4a6080",
                borderBottom: activeTab === tab ? "2px solid #d4a843" : "2px solid transparent",
                background: "none",
                border: "none",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: activeTab === tab ? "#d4a843" : "transparent",
              }}
            >
              {tab === "requests" ? "Access Requests" : tab === "whitelist" ? "Whitelist" : "Audit Log"}
            </button>
          ))}
        </div>

        {activeTab === "requests" && <AccessRequestsTab />}
        {activeTab === "whitelist" && <WhitelistTab />}
        {activeTab === "audit" && <AuditLogTab />}
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
      toast.success("Access approved and email added to whitelist");
    },
  });

  const denyMutation = trpc.admin.requests.deny.useMutation({
    onSuccess: () => {
      utils.admin.requests.list.invalidate();
      toast.success("Access request denied");
    },
  });

  if (isLoading) return <LoadingState />;

  const pending = requests?.filter(r => r.status === "pending") ?? [];
  const resolved = requests?.filter(r => r.status !== "pending") ?? [];

  return (
    <div className="space-y-6 pb-8">
      {/* Pending */}
      <SectionHeader title="Pending Requests" count={pending.length} />
      {pending.length === 0 ? (
        <EmptyState text="No pending requests" />
      ) : (
        <div className="space-y-2">
          {pending.map((req) => (
            <div key={req.id} className="p-4 rounded-lg flex items-start justify-between gap-4"
              style={{ background: "#060914", border: "1px solid #151f38" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#c8d8f0] font-mono text-sm font-semibold">{req.name || "Unknown"}</span>
                  <span className="text-[#4a6080] font-mono text-xs">{req.email}</span>
                </div>
                {req.reason && <p className="text-[#4a6080] font-mono text-xs mt-1">{req.reason}</p>}
                <span className="text-[#2a3a54] font-mono text-[10px] mt-2 block">
                  {new Date(req.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => approveMutation.mutate({ id: req.id })}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase"
                  style={{ background: "#0d1f0d", border: "1px solid #1a4a1a", color: "#4ade80" }}
                >
                  <CheckCircle size={12} /> Approve
                </button>
                <button
                  onClick={() => denyMutation.mutate({ id: req.id })}
                  disabled={denyMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase"
                  style={{ background: "#1f0d0d", border: "1px solid #4a1a1a", color: "#f87171" }}
                >
                  <XCircle size={12} /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <>
          <SectionHeader title="Resolved" count={resolved.length} />
          <div className="space-y-2">
            {resolved.map((req) => (
              <div key={req.id} className="p-3 rounded-lg flex items-center justify-between gap-4"
                style={{ background: "#060914", border: "1px solid #151f38", opacity: 0.7 }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                    req.status === "approved" ? "text-[#4ade80] bg-[#0d1f0d] border border-[#1a4a1a]" : "text-[#f87171] bg-[#1f0d0d] border border-[#4a1a1a]"
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-[#c8d8f0] font-mono text-sm">{req.email}</span>
                  <span className="text-[#2a3a54] font-mono text-[10px]">{new Date(req.updatedAt).toLocaleDateString()}</span>
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
      setNewEmail("");
      toast.success("Email added to whitelist");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.admin.whitelist.remove.useMutation({
    onSuccess: () => {
      utils.admin.whitelist.list.invalidate();
      toast.success("Email removed from whitelist");
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6 pb-8">
      {/* Add email */}
      <div className="flex gap-3">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email@example.com"
          className="flex-1 px-4 py-2.5 rounded font-mono text-sm text-[#c8d8f0] placeholder-[#2a3a54]"
          style={{ background: "#060914", border: "1px solid #151f38", outline: "none" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newEmail) addMutation.mutate({ email: newEmail });
          }}
        />
        <button
          onClick={() => newEmail && addMutation.mutate({ email: newEmail })}
          disabled={!newEmail || addMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded font-mono text-xs font-bold tracking-wider uppercase disabled:opacity-40"
          style={{ background: "#d4a843", color: "#0a0c18" }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      <SectionHeader title="Whitelisted Emails" count={entries?.length ?? 0} />
      {!entries?.length ? (
        <EmptyState text="No whitelisted emails" />
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-4 py-3 rounded-lg group"
              style={{ background: "#060914", border: "1px solid #151f38" }}>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.5)" }} />
                <span className="text-[#c8d8f0] font-mono text-sm">{entry.email}</span>
                <span className="text-[#2a3a54] font-mono text-[10px]">
                  added {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate({ email: entry.email })}
                className="opacity-0 group-hover:opacity-100 text-[#f87171] hover:text-[#fca5a5] transition-all"
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

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[#4a6080] font-mono text-[10px] tracking-[0.18em] uppercase">Filter:</span>
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
            {data?.entries.map((entry) => {
              const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: "#4a6080", icon: null };
              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "#060914", border: "1px solid #151f38" }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span className="font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded"
                    style={{ color: meta.color, background: `${meta.color}10`, border: `1px solid ${meta.color}30` }}>
                    {meta.label}
                  </span>
                  <span className="text-[#c8d8f0] font-mono text-xs">{entry.actorName || entry.actorEmail}</span>
                  {entry.details && (
                    <span className="text-[#4a6080] font-mono text-xs truncate flex-1">{entry.details}</span>
                  )}
                  <span className="text-[#2a3a54] font-mono text-[10px] shrink-0">
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
                className="text-[#4a6080] hover:text-[#d4a843] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[#4a6080] font-mono text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[#4a6080] hover:text-[#d4a843] disabled:opacity-30 transition-colors"
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

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-0.5 h-4 bg-[#d4a843] rounded-sm" />
      <span className="text-[#d4a843] font-mono text-[10px] font-extrabold tracking-[0.18em] uppercase">{title}</span>
      <span className="text-[#4a6080] font-mono text-[10px]">[{count}]</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8">
      <span className="text-[#2a3a54] font-mono text-sm">{text}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Clock className="h-5 w-5 animate-spin text-[#d4a843]" />
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded font-mono text-[10px] tracking-wider uppercase transition-all"
      style={{
        background: active ? "rgba(212,168,67,0.12)" : "transparent",
        border: `1px solid ${active ? "#d4a843" : "#151f38"}`,
        color: active ? "#d4a843" : "#4a6080",
      }}
    >
      {label}
    </button>
  );
}
