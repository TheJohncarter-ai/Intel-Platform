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
  Mail,
  Send,
  Pencil,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

interface AdminPanelProps {
  onLogout: () => void;
}

const ACTION_CONFIG = {
  profile_view: { label: "Profile View", icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10" },
  note_added: { label: "Note Added", icon: FileText, color: "text-green-400", bg: "bg-green-400/10" },
  note_deleted: { label: "Note Deleted", icon: Trash, color: "text-red-400", bg: "bg-red-400/10" },
} as const;

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"requests" | "whitelist" | "updates" | "audit">("requests");
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "denied" | undefined>("pending");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<"profile_view" | "note_added" | "note_deleted" | undefined>(undefined);
  const [auditPage, setAuditPage] = useState(0);
  const AUDIT_PAGE_SIZE = 30;

  // Invite state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteResult, setInviteResult] = useState<{ platformUrl: string } | null>(null);

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

  const { data: contactUpdates, isLoading: updatesLoading } =
    trpc.admin.listContactUpdates.useQuery(
      { status: "pending" },
      { refetchOnWindowFocus: false }
    );

  const approveMutation = trpc.admin.approveRequest.useMutation({
    onSuccess: () => {
      utils.admin.listRequests.invalidate();
      utils.admin.listWhitelist.invalidate();
      toast.success("Request approved — user added to whitelist");
    },
  });

  const denyMutation = trpc.admin.denyRequest.useMutation({
    onSuccess: () => {
      utils.admin.listRequests.invalidate();
      toast.success("Request denied");
    },
  });

  const addWhitelistMutation = trpc.admin.addWhitelist.useMutation({
    onSuccess: () => {
      utils.admin.listWhitelist.invalidate();
      setNewEmail("");
      setNewName("");
      toast.success("Email added to whitelist");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeWhitelistMutation = trpc.admin.removeWhitelist.useMutation({
    onSuccess: () => {
      utils.admin.listWhitelist.invalidate();
      toast.success("Email removed from whitelist");
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteMutation = trpc.admin.inviteUser.useMutation({
    onSuccess: (data) => {
      utils.admin.listWhitelist.invalidate();
      setInviteResult(data);
      toast.success(`Invitation created for ${inviteEmail}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const reviewUpdateMutation = trpc.admin.reviewContactUpdate.useMutation({
    onSuccess: (_, vars) => {
      utils.admin.listContactUpdates.invalidate();
      toast.success(`Update ${vars.action === "approve" ? "approved" : "rejected"}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRefresh = () => {
    utils.admin.listRequests.invalidate();
    utils.admin.listWhitelist.invalidate();
    utils.admin.auditLog.invalidate();
    utils.admin.listContactUpdates.invalidate();
  };

  const totalAuditPages = auditData ? Math.ceil(auditData.total / AUDIT_PAGE_SIZE) : 0;
  const pendingUpdatesCount = contactUpdates?.entries?.length ?? 0;

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({
      email: inviteEmail.trim(),
      name: inviteName.trim() || undefined,
      message: inviteMessage.trim() || undefined,
    });
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setInviteName("");
    setInviteMessage("");
    setInviteResult(null);
    setShowInviteForm(false);
  };

  const TABS = [
    { id: "requests" as const, label: "ACCESS REQUESTS", icon: Clock },
    { id: "whitelist" as const, label: "WHITELIST", icon: Users },
    { id: "updates" as const, label: "INFO UPDATES", icon: Pencil, badge: pendingUpdatesCount },
    { id: "audit" as const, label: "AUDIT LOG", icon: Activity },
  ];

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
        <div className="flex gap-1 mb-6 bg-card border border-border rounded-lg p-1 w-fit overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md font-mono-label text-[0.7rem] transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={12} />
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-1 bg-amber-500/20 text-amber-400 text-[0.6rem] font-mono-label px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Access Requests Tab ─── */}
        {activeTab === "requests" && (
          <div>
            <div className="flex gap-1 mb-4 flex-wrap">
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
                  <div key={req.id} className="bg-card border border-border rounded-lg p-4 transition-colors hover:border-border/80">
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
                        <div className="flex items-center gap-2">
                          <Mail size={11} className="text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{req.email}</p>
                        </div>
                        {req.reason && (
                          <p className="text-xs text-muted-foreground/80 mt-2 bg-accent/50 rounded px-3 py-2 italic">
                            "{req.reason}"
                          </p>
                        )}
                        <p className="text-[0.6rem] text-muted-foreground/60 mt-2 font-mono-label">
                          {new Date(req.createdAt).toLocaleString()}
                          {req.reviewedBy && ` · Reviewed by ${req.reviewedBy}`}
                        </p>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-500 hover:text-green-400 hover:bg-green-500/10 border-green-500/20"
                            onClick={() => approveMutation.mutate({ id: req.id })}
                            disabled={approveMutation.isPending}
                          >
                            <Check size={12} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20"
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
            {/* Action buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                size="sm"
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="gap-1.5"
              >
                <Send size={12} />
                Invite by Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
                className="gap-1.5"
              >
                <UserPlus size={12} />
                Add to Whitelist
              </Button>
            </div>

            {/* Invite form */}
            {showInviteForm && (
              <div className="bg-card border border-primary/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Send size={14} className="text-primary" />
                  <span className="font-mono-label text-[0.7rem] text-primary">INVITE A COLLEAGUE</span>
                </div>

                {inviteResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 rounded-md px-3 py-2">
                      <CheckCircle size={14} />
                      <span>{inviteEmail} has been added to the whitelist</span>
                    </div>
                    <div className="bg-accent/50 rounded-md p-3">
                      <p className="text-xs text-muted-foreground mb-1.5 font-mono-label">SHARE THIS LINK WITH THEM:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-primary flex-1 truncate">{inviteResult.platformUrl}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(inviteResult.platformUrl);
                            toast.success("Link copied!");
                          }}
                          className="flex-shrink-0 p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      They can sign in with any Google account using this email address.
                    </p>
                    <Button variant="ghost" size="sm" onClick={resetInviteForm}>
                      Send another invite
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      />
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="Name (optional)"
                        className="w-40 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Personal message (optional) — shown in your admin notification"
                      rows={2}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleInvite}
                        disabled={!inviteEmail.trim() || inviteMutation.isPending}
                        className="gap-1.5"
                      >
                        <Send size={12} />
                        {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={resetInviteForm}>
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will add the email to the whitelist immediately. Share the platform URL with them so they can sign in.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Quick add form */}
            {!showInviteForm && (
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
            )}

            {whitelistLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : whitelistEntries && whitelistEntries.length > 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-accent/30">
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">EMAIL</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground hidden sm:table-cell">NAME</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground hidden md:table-cell">APPROVED BY</th>
                      <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground hidden sm:table-cell">DATE</th>
                      <th className="text-right px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whitelistEntries.map((entry) => {
                      const isAdmin = entry.email === "powelljohn9521@gmail.com";
                      return (
                        <tr key={entry.id} className="border-b border-border/50 last:border-0 hover:bg-accent/20 transition-colors">
                          <td className="px-4 py-3 text-sm text-foreground">
                            <div className="flex items-center gap-2">
                              <a
                                href={`mailto:${entry.email}`}
                                className="hover:text-primary transition-colors truncate max-w-[200px]"
                              >
                                {entry.email}
                              </a>
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-mono-label bg-primary/10 text-primary flex-shrink-0">
                                  ADMIN
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{entry.name || "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{entry.approvedBy || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!isAdmin ? (
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
                      );
                    })}
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

        {/* ─── Contact Info Updates Tab ─── */}
        {activeTab === "updates" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs text-muted-foreground">
                Users can submit contact info updates from any profile card. Review and apply them here.
              </p>
            </div>

            {updatesLoading ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading updates...</p>
              </div>
            ) : contactUpdates && contactUpdates.entries.length > 0 ? (
              <div className="space-y-3">
                {contactUpdates.entries.map((update) => (
                  <div key={update.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link href={`/profile/${update.contactId}`}>
                            <span className="font-display text-base text-foreground hover:text-primary cursor-pointer transition-colors">
                              {update.contactName}
                            </span>
                          </Link>
                          <span className="text-[0.6rem] font-mono-label bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                            {update.field.toUpperCase()}
                          </span>
                        </div>

                        <div className="bg-accent/50 rounded-md px-3 py-2 mb-2">
                          <p className="text-xs text-muted-foreground mb-0.5 font-mono-label">NEW VALUE</p>
                          <p className="text-sm text-foreground">{update.newValue}</p>
                        </div>

                        {update.context && (
                          <p className="text-xs text-muted-foreground italic mb-2">
                            Source: "{update.context}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[0.6rem] text-muted-foreground/60 font-mono-label">
                          <span>Submitted by {update.submittedByName} ({update.submittedByEmail})</span>
                          <span>{new Date(update.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-500 hover:text-green-400 hover:bg-green-500/10 border-green-500/20"
                          onClick={() => reviewUpdateMutation.mutate({ id: update.id, action: "approve" })}
                          disabled={reviewUpdateMutation.isPending}
                        >
                          <Check size={12} />
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 border-red-500/20"
                          onClick={() => reviewUpdateMutation.mutate({ id: update.id, action: "reject" })}
                          disabled={reviewUpdateMutation.isPending}
                        >
                          <X size={12} />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <Pencil size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending contact updates</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Users can click "Update" on any contact card to submit new information
                </p>
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
                        className="bg-card border border-border rounded-lg p-3 flex items-start gap-3 hover:border-border/80 transition-colors"
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
