import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Check,
  X,
  UserPlus,
  Trash2,
  ArrowLeft,
  LogOut,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  Trash,
} from "lucide-react";
import { Link } from "wouter";

interface AdminPanelProps {
  onLogout: () => void;
}

const ACTION_CONFIG = {
  profile_view: { label: "Profile View", icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
  note_added: { label: "Note Added", icon: FileText, color: "text-green-400", bg: "bg-green-400/10" },
  note_deleted: { label: "Note Deleted", icon: Trash, color: "text-red-400", bg: "bg-red-400/10" },
} as const;

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "whitelist" | "audit">("requests");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "denied" | undefined>("pending");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<"profile_view" | "note_added" | "note_deleted" | undefined>(undefined);
  const [auditPage, setAuditPage] = useState(0);
  const AUDIT_PAGE_SIZE = 30;

  const utils = trpc.useUtils();

  const { data: requests, isLoading: requestsLoading } =
    trpc.admin.listRequests.useQuery(
      statusFilter ? { status: statusFilter } : {},
      { refetchOnWindowFocus: false }
    );

  const { data: whitelistEntries, isLoading: whitelistLoading } =
    trpc.admin.listWhitelist.useQuery(undefined, {
      refetchOnWindowFocus: false,
    });

  const { data: auditData, isLoading: auditLoading } =
    trpc.admin.auditLog.useQuery(
      {
        action: auditActionFilter,
        limit: AUDIT_PAGE_SIZE,
        offset: auditPage * AUDIT_PAGE_SIZE,
      },
      { refetchOnWindowFocus: false }
    );

  const approveMutation = trpc.admin.approveRequest.useMutation({
    onSuccess: () => {
      utils.admin.listRequests.invalidate();
      utils.admin.listWhitelist.invalidate();
    },
  });

  const denyMutation = trpc.admin.denyRequest.useMutation({
    onSuccess: () => {
      utils.admin.listRequests.invalidate();
    },
  });

  const addWhitelistMutation = trpc.admin.addWhitelist.useMutation({
    onSuccess: () => {
      utils.admin.listWhitelist.invalidate();
      setNewEmail("");
      setNewName("");
    },
  });

  const removeWhitelistMutation = trpc.admin.removeWhitelist.useMutation({
    onSuccess: () => {
      utils.admin.listWhitelist.invalidate();
    },
  });

  const handleRefresh = () => {
    utils.admin.listRequests.invalidate();
    utils.admin.listWhitelist.invalidate();
    utils.admin.auditLog.invalidate();
  };

  const totalAuditPages = auditData ? Math.ceil(auditData.total / AUDIT_PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft size={14} />
                Back to Network
              </Button>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <span className="font-display text-lg text-foreground">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw size={12} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-muted-foreground">
              <LogOut size={12} />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono-label text-[0.7rem] transition-colors ${
              activeTab === "requests"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock size={12} />
            ACCESS REQUESTS
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono-label text-[0.7rem] transition-colors ${
              activeTab === "whitelist"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users size={12} />
            WHITELIST
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-mono-label text-[0.7rem] transition-colors ${
              activeTab === "audit"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity size={12} />
            AUDIT LOG
          </button>
        </div>

        {/* ─── Access Requests Tab ─── */}
        {activeTab === "requests" && (
          <div>
            <div className="flex gap-1 mb-4">
              {(
                [
                  { value: "pending", label: "Pending", icon: Clock },
                  { value: "approved", label: "Approved", icon: CheckCircle },
                  { value: "denied", label: "Denied", icon: XCircle },
                  { value: undefined, label: "All", icon: Users },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setStatusFilter(value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    statusFilter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>

            {requestsLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display text-base text-foreground">{req.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[0.6rem] font-mono-label ${
                              req.status === "pending"
                                ? "bg-amber-500/10 text-amber-500"
                                : req.status === "approved"
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.email}</p>
                        {req.reason && (
                          <p className="text-xs text-muted-foreground/80 mt-2 bg-accent/50 rounded px-3 py-2">
                            "{req.reason}"
                          </p>
                        )}
                        <p className="text-[0.6rem] text-muted-foreground/60 mt-2 font-mono-label">
                          {new Date(req.createdAt).toLocaleString()}
                          {req.reviewedBy && ` · Reviewed by ${req.reviewedBy}`}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={() => approveMutation.mutate({ id: req.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check size={12} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => denyMutation.mutate({ id: req.id })}
                            disabled={denyMutation.isPending}
                          >
                            <X size={12} />
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Clock size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No {statusFilter ? statusFilter : ""} access requests
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Whitelist Tab ─── */}
        {activeTab === "whitelist" && (
          <div>
            <div className="bg-card border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={14} className="text-primary" />
                <span className="font-mono-label text-[0.7rem] text-primary">ADD TO WHITELIST</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-48 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
                <Button
                  onClick={() =>
                    addWhitelistMutation.mutate({
                      email: newEmail,
                      name: newName || undefined,
                    })
                  }
                  disabled={!newEmail.trim() || addWhitelistMutation.isPending}
                  className="gap-1"
                >
                  <UserPlus size={12} />
                  Add
                </Button>
              </div>
              {addWhitelistMutation.error && (
                <p className="text-xs text-red-400 mt-2">{addWhitelistMutation.error.message}</p>
              )}
            </div>

            {whitelistLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : whitelistEntries && whitelistEntries.length > 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">EMAIL</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">NAME</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">APPROVED BY</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">DATE</th>
                      <th className="text-right px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whitelistEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {entry.email}
                          {entry.email === "powelljohn9521@gmail.com" && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[0.55rem] font-mono-label bg-primary/10 text-primary">
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.name || "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{entry.approvedBy || "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {entry.email !== "powelljohn9521@gmail.com" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-1"
                              onClick={() => removeWhitelistMutation.mutate({ email: entry.email })}
                              disabled={removeWhitelistMutation.isPending}
                            >
                              <Trash2 size={11} />
                              Remove
                            </Button>
                          ) : (
                            <span className="text-[0.6rem] text-muted-foreground/40 font-mono-label">PROTECTED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Users size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No whitelisted emails yet</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Audit Log Tab ─── */}
        {activeTab === "audit" && (
          <div>
            {/* Action filter */}
            <div className="flex flex-wrap gap-1 mb-4">
              {(
                [
                  { value: undefined, label: "All Activity", icon: Activity },
                  { value: "profile_view" as const, label: "Profile Views", icon: Eye },
                  { value: "note_added" as const, label: "Notes Added", icon: FileText },
                  { value: "note_deleted" as const, label: "Notes Deleted", icon: Trash },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => {
                    setAuditActionFilter(value);
                    setAuditPage(0);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                    auditActionFilter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>

            {/* Stats summary */}
            {auditData && (
              <div className="flex items-center gap-4 mb-4">
                <span className="font-mono-label text-[0.6rem] text-muted-foreground">
                  {auditData.total} TOTAL ENTRIES
                </span>
                {totalAuditPages > 1 && (
                  <span className="font-mono-label text-[0.6rem] text-muted-foreground">
                    PAGE {auditPage + 1} OF {totalAuditPages}
                  </span>
                )}
              </div>
            )}

            {/* Audit entries */}
            {auditLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading audit log...</p>
              </div>
            ) : auditData && auditData.entries.length > 0 ? (
              <>
                <div className="space-y-2">
                  {auditData.entries.map((entry) => {
                    const config = ACTION_CONFIG[entry.action as keyof typeof ACTION_CONFIG];
                    const Icon = config?.icon ?? Activity;
                    const metadata = entry.metadata ? JSON.parse(entry.metadata) : null;

                    return (
                      <div
                        key={entry.id}
                        className="bg-card border border-border rounded-lg p-3 flex items-start gap-3"
                      >
                        {/* Action icon */}
                        <div className={`mt-0.5 p-1.5 rounded-md ${config?.bg ?? "bg-accent"}`}>
                          <Icon size={13} className={config?.color ?? "text-muted-foreground"} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-foreground font-medium">
                              {entry.userName}
                            </span>
                            <span className={`text-[0.6rem] font-mono-label px-1.5 py-0.5 rounded ${config?.bg ?? "bg-accent"} ${config?.color ?? "text-muted-foreground"}`}>
                              {config?.label ?? entry.action}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {entry.action === "profile_view" && (
                              <>
                                Viewed profile of{" "}
                                <Link href={`/profile/${entry.contactId}`}>
                                  <span className="text-primary hover:underline cursor-pointer">
                                    {entry.contactName}
                                  </span>
                                </Link>
                              </>
                            )}
                            {entry.action === "note_added" && (
                              <>
                                Added a{" "}
                                <span className="text-foreground/80">
                                  {metadata?.noteType?.replace("_", " ") ?? "note"}
                                </span>
                                {" "}on{" "}
                                <Link href={`/profile/${entry.contactId}`}>
                                  <span className="text-primary hover:underline cursor-pointer">
                                    {entry.contactName}
                                  </span>
                                </Link>
                                {metadata?.preview && (
                                  <span className="text-muted-foreground/60 italic ml-1">
                                    — "{metadata.preview.length > 60 ? metadata.preview.substring(0, 60) + "..." : metadata.preview}"
                                  </span>
                                )}
                              </>
                            )}
                            {entry.action === "note_deleted" && (
                              <>
                                Deleted a{" "}
                                <span className="text-foreground/80">
                                  {metadata?.noteType?.replace("_", " ") ?? "note"}
                                </span>
                                {" "}from{" "}
                                <Link href={`/profile/${entry.contactId}`}>
                                  <span className="text-primary hover:underline cursor-pointer">
                                    {entry.contactName}
                                  </span>
                                </Link>
                              </>
                            )}
                          </p>

                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[0.6rem] text-muted-foreground/60 font-mono-label">
                              {entry.userEmail}
                            </span>
                            <span className="text-[0.6rem] text-muted-foreground/60 font-mono-label">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalAuditPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                      disabled={auditPage === 0}
                      className="gap-1"
                    >
                      <ChevronLeft size={12} />
                      Previous
                    </Button>
                    <span className="font-mono-label text-[0.65rem] text-muted-foreground px-3">
                      {auditPage + 1} / {totalAuditPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => Math.min(totalAuditPages - 1, p + 1))}
                      disabled={auditPage >= totalAuditPages - 1}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight size={12} />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Activity size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No audit log entries yet. Activity will appear here as users view profiles and add notes.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
