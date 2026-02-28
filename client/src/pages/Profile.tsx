import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Users, Tag,
  Plus, Trash2, MessageSquare, PhoneCall, MailIcon, Clock, FileText,
  Edit3, X, Save, Sparkles, ExternalLink, Linkedin, Info, Zap, Award, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";

const NOTE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  meeting:   { label: "Meeting",   icon: <MessageSquare size={12} />, color: "#d4a843" },
  call:      { label: "Call",      icon: <PhoneCall size={12} />,     color: "#60a5fa" },
  email:     { label: "Email",     icon: <MailIcon size={12} />,      color: "#a78bfa" },
  follow_up: { label: "Follow-up", icon: <Clock size={12} />,        color: "#4ade80" },
  general:   { label: "General",   icon: <FileText size={12} />,     color: "#4a6080" },
  research:  { label: "Research",  icon: <Sparkles size={12} />,     color: "#f59e0b" },
};

const CONFIDENCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  high:   { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)", text: "#4ade80" },
  medium: { bg: "rgba(212,168,67,0.08)", border: "rgba(212,168,67,0.25)", text: "#d4a843" },
  low:    { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", text: "#f87171" },
};

function TierBadge({ tier }: { tier: string }) {
  const tierColors: Record<string, string> = {
    "Tier 1": "#4ade80",
    "Tier 2": "#d4a843",
    "Tier 3": "#f87171",
  };
  const color = tierColors[tier] || "#60a5fa";
  return (
    <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: `${color}20`,
        border: `1px solid ${color}40`,
        color,
      }}>
      {tier}
    </span>
  );
}

function InfoCard({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] flex items-start gap-3 group hover:border-[#1a3a6a] transition-colors">
      <div className="text-[#d4a843] shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[#4a6080] text-[9px] font-extrabold tracking-[0.18em] uppercase mb-1"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {label}
        </div>
        <div className="text-[#c8d8f0] text-xs sm:text-sm break-words">{value}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default function Profile() {
  const params = useParams<{ id: string }>();
  const contactId = Number(params.id);
  const utils = trpc.useUtils();

  const { data: contact, isLoading, error } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !isNaN(contactId) }
  );

  const [showAddInfo, setShowAddInfo] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => {
      utils.contacts.getById.invalidate({ id: contactId });
      utils.contacts.list.invalidate();
      setShowAddInfo(false);
      setEditFields({});
      toast.success("Contact updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const researchMutation = trpc.contacts.research.useMutation({
    onSuccess: () => {
      utils.notes.listByContact.invalidate({ contactId });
      utils.contacts.getById.invalidate({ id: contactId });
      toast.success("Research complete — saved as a note");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#1a3a6a] border-t-[#d4a843] animate-spin" />
          <span className="text-[#4a6080] text-[10px] tracking-[0.2em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-[#0a0c18] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-[#f87171] text-sm tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Contact not found
        </div>
        <Link href="/" className="text-[#d4a843] text-xs tracking-wider hover:text-[#f0c060] transition-colors flex items-center gap-2"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <ArrowLeft size={14} /> Return to Globe
        </Link>
      </div>
    );
  }

  const handleSaveInfo = () => {
    const updates: Record<string, string> = {};
    Object.entries(editFields).forEach(([k, v]) => {
      if (v.trim()) updates[k] = v.trim();
    });
    if (Object.keys(updates).length === 0) {
      toast.error("No changes to save");
      return;
    }
    updateMutation.mutate({ id: contactId, ...updates });
  };

  return (
    <div className="min-h-screen bg-[#0a0c18] text-[#c8d8f0]">
      {/* Header */}
      <div style={{ borderBottom: "1px solid #151f38", background: "rgba(6,9,20,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Top row: back + title + actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-[#4a6080] hover:text-[#d4a843] active:text-[#d4a843] transition-colors p-1.5 -ml-1.5">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-[3px] h-4 sm:h-5 rounded-sm bg-[#d4a843] shrink-0" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
            <span className="text-[#d4a843] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Profile
            </span>
            <div className="flex-1" />

            {/* Desktop action buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => researchMutation.mutate({ id: contactId })}
                disabled={researchMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(245,158,11,0.15)]"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "#f59e0b",
                }}
                title="AI-powered intelligence research"
              >
                <Sparkles size={12} className={researchMutation.isPending ? "animate-spin" : ""} />
                {researchMutation.isPending ? "Researching..." : "Research"}
              </button>
              <button
                onClick={() => setShowAddInfo(!showAddInfo)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: showAddInfo ? "rgba(248,113,113,0.08)" : "rgba(212,168,67,0.08)",
                  border: `1px solid ${showAddInfo ? "rgba(248,113,113,0.25)" : "rgba(212,168,67,0.25)"}`,
                  color: showAddInfo ? "#f87171" : "#d4a843",
                }}
              >
                {showAddInfo ? <><X size={12} /> Cancel</> : <><Info size={12} /> Add Info</>}
              </button>
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(96,165,250,0.15)]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(96,165,250,0.08)",
                    border: "1px solid rgba(96,165,250,0.25)",
                    color: "#60a5fa",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={12} /> Email
                </a>
              )}
              {contact.linkedinUrl && (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(59,130,246,0.15)]"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.25)",
                    color: "#3b82f6",
                    textDecoration: "none",
                  }}
                >
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Mobile action buttons — stacked row below header */}
          <div className="flex sm:hidden items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => researchMutation.mutate({ id: contactId })}
              disabled={researchMutation.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all shrink-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b",
              }}
            >
              <Sparkles size={11} className={researchMutation.isPending ? "animate-spin" : ""} />
              {researchMutation.isPending ? "..." : "Research"}
            </button>
            <button
              onClick={() => setShowAddInfo(!showAddInfo)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all shrink-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                background: showAddInfo ? "rgba(248,113,113,0.08)" : "rgba(212,168,67,0.08)",
                border: `1px solid ${showAddInfo ? "rgba(248,113,113,0.25)" : "rgba(212,168,67,0.25)"}`,
                color: showAddInfo ? "#f87171" : "#d4a843",
              }}
            >
              {showAddInfo ? <><X size={11} /> Cancel</> : <><Info size={11} /> Add Info</>}
            </button>
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all shrink-0"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.25)",
                  color: "#60a5fa",
                  textDecoration: "none",
                }}
              >
                <Mail size={11} /> Email
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all shrink-0"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(74,222,128,0.08)",
                  border: "1px solid rgba(74,222,128,0.25)",
                  color: "#4ade80",
                  textDecoration: "none",
                }}
              >
                <Phone size={11} /> Call
              </a>
            )}
            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-bold tracking-wider uppercase transition-all shrink-0"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  color: "#3b82f6",
                  textDecoration: "none",
                }}
              >
                <Linkedin size={11} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* ═══ PROFILE HEADER ═══ */}
        <div className="flex items-start gap-3 sm:gap-5 mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-xl sm:text-2xl font-bold shrink-0"
            style={{ fontFamily: "'JetBrains Mono', monospace", boxShadow: "0 0 20px rgba(212,168,67,0.08)" }}>
            {contact.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-[#c8d8f0] mb-1 sm:mb-1.5 truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
              {contact.name}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {contact.role && (
                <span className="text-[#4a6080] text-[10px] sm:text-xs tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {contact.role}
                </span>
              )}
              {contact.tier && <TierBadge tier={contact.tier} />}
              {contact.confidence && (
                <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    ...CONFIDENCE_COLORS[contact.confidence],
                  }}>
                  <Award size={10} />
                  {contact.confidence}
                </span>
              )}
              {contact.event && (
                <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(168,85,247,0.08)",
                    border: "1px solid rgba(168,85,247,0.25)",
                    color: "#a855f7",
                  }}>
                  <Zap size={10} />
                  {contact.event}
                </span>
              )}
              {contact.lastResearchedAt && (
                <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    color: "#f59e0b",
                  }}>
                  Researched {new Date(contact.lastResearchedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ADD INFO FORM ═══ */}
        {showAddInfo && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-5 rounded-lg" style={{ background: "#060914", border: "1px solid #1a3a6a" }}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Edit3 size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Update Contact Information
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { key: "name", label: "Name", placeholder: contact.name },
                { key: "role", label: "Role / Title", placeholder: contact.role || "e.g. Managing Director" },
                { key: "organization", label: "Organization", placeholder: contact.organization || "e.g. Acme Corp" },
                { key: "location", label: "Location", placeholder: contact.location || "e.g. Bogotá, Colombia" },
                { key: "email", label: "Email", placeholder: contact.email || "e.g. name@example.com" },
                { key: "phone", label: "Phone", placeholder: contact.phone || "e.g. +1 555 123 4567" },
                { key: "group", label: "Group", placeholder: contact.group || "e.g. Colombian VC" },
                { key: "tier", label: "Tier", placeholder: contact.tier || "e.g. Tier 1" },
                { key: "linkedinUrl", label: "LinkedIn URL", placeholder: contact.linkedinUrl || "https://linkedin.com/in/..." },
                { key: "sector", label: "Sector/Industry", placeholder: contact.sector || "e.g. Venture Capital, Real Estate" },
              ] as { key: string; label: string; placeholder: string }[]).map(field => (
                <div key={field.key}>
                  <label className="block text-[#4a6080] text-[9px] font-extrabold tracking-[0.18em] uppercase mb-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={editFields[field.key] ?? ""}
                    onChange={(e) => setEditFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded text-[12px] text-[#c8d8f0] placeholder-[#2a3a54] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-[#4a6080] text-[9px] font-extrabold tracking-[0.18em] uppercase mb-1.5"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Notes
              </label>
              <textarea
                value={editFields.notes ?? ""}
                onChange={(e) => setEditFields(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={contact.notes || "Additional notes about this contact..."}
                className="w-full px-3 py-2 rounded text-[12px] text-[#c8d8f0] placeholder-[#2a3a54] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors resize-none"
                style={{ fontFamily: "'JetBrains Mono', monospace", minHeight: 80 }}
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveInfo}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded text-[11px] font-bold tracking-wider uppercase disabled:opacity-40 transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace", background: "#d4a843", color: "#0a0c18" }}
              >
                <Save size={12} />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ INFO GRID ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {contact.organization && <InfoCard icon={<Building size={14} />} label="Organization" value={contact.organization} />}
          {contact.location && <InfoCard icon={<MapPin size={14} />} label="Location" value={contact.location} />}
          {contact.group && <InfoCard icon={<Users size={14} />} label="Group" value={contact.group} />}
          {contact.role && <InfoCard icon={<Briefcase size={14} />} label="Role" value={contact.role} />}
          {contact.sector && <InfoCard icon={<Zap size={14} />} label="Sector" value={contact.sector} />}
          {contact.companyDomain && <InfoCard icon={<Globe size={14} />} label="Domain" value={contact.companyDomain} />}
          {contact.email && (
            <InfoCard icon={<Mail size={14} />} label="Email" value={contact.email}
              action={<a href={`mailto:${contact.email}`} className="text-[#60a5fa] hover:text-[#93bbfc] active:text-[#93bbfc] transition-colors p-1"><ExternalLink size={12} /></a>} />
          )}
          {contact.phone && (
            <InfoCard icon={<Phone size={14} />} label="Phone" value={contact.phone}
              action={<a href={`tel:${contact.phone}`} className="text-[#60a5fa] hover:text-[#93bbfc] active:text-[#93bbfc] transition-colors p-1"><ExternalLink size={12} /></a>} />
          )}
          {contact.linkedinUrl && (
            <InfoCard icon={<Linkedin size={14} />} label="LinkedIn" value={contact.linkedinUrl}
              action={<a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#60a5fa] hover:text-[#93bbfc] active:text-[#93bbfc] transition-colors p-1"><ExternalLink size={12} /></a>} />
          )}
        </div>

        {/* Company Description */}
        {contact.companyDescription && (
          <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] mb-5 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Building size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] text-[9px] font-extrabold tracking-[0.18em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>Company Overview</span>
            </div>
            <p className="text-[#4a6080] text-xs sm:text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {contact.companyDescription}
            </p>
          </div>
        )}

        {/* Static Notes / Bio */}
        {contact.notes && (
          <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] mb-5 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Tag size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] text-[9px] font-extrabold tracking-[0.18em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>Bio</span>
            </div>
            <p className="text-[#4a6080] text-xs sm:text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {contact.notes}
            </p>
          </div>
        )}

        {/* Meeting Notes / Relationship Logs */}
        <MeetingNotesSection contactId={contactId} />

        {/* Shared Activity / Business Connections */}
        <SharedActivitySection contactId={contactId} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MEETING NOTES SECTION
// ═══════════════════════════════════════════════════════════════════════

function MeetingNotesSection({ contactId }: { contactId: number }) {
  const utils = trpc.useUtils();
  const { data: notes, isLoading } = trpc.notes.listByContact.useQuery({ contactId });
  const [showForm, setShowForm] = useState(false);
  const [noteType, setNoteType] = useState<"meeting" | "call" | "email" | "follow_up" | "general" | "research">("meeting");
  const [content, setContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const addMutation = trpc.notes.add.useMutation({
    onSuccess: () => {
      utils.notes.listByContact.invalidate({ contactId });
      utils.contacts.getById.invalidate({ id: contactId });
      setContent("");
      setShowForm(false);
      toast.success("Note added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.listByContact.invalidate({ contactId });
      utils.contacts.getById.invalidate({ id: contactId });
      setDeleteConfirmId(null);
      toast.success("Note deleted");
    },
  });

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-[3px] h-4 rounded-sm bg-[#d4a843]" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
          <span className="text-[#d4a843] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Relationship Log
          </span>
          <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            [{notes?.length ?? 0}]
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all hover:bg-[rgba(212,168,67,0.15)]"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: showForm ? "rgba(248,113,113,0.08)" : "rgba(212,168,67,0.08)",
            border: `1px solid ${showForm ? "rgba(248,113,113,0.25)" : "rgba(212,168,67,0.25)"}`,
            color: showForm ? "#f87171" : "#d4a843",
          }}
        >
          {showForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add Note</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38]">
          <div className="mb-3">
            <label className="block text-[#4a6080] text-[9px] font-extrabold tracking-[0.18em] uppercase mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Note Type
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as any)}
              className="w-full px-3 py-2 rounded text-[12px] text-[#c8d8f0] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {Object.entries(NOTE_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here..."
            className="w-full px-3 py-2 rounded text-[12px] text-[#c8d8f0] placeholder-[#2a3a54] bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors resize-none mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", minHeight: 100 }}
          />
          <div className="flex justify-end">
            <button
              onClick={() => addMutation.mutate({ contactId, noteType, content })}
              disabled={addMutation.isPending || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-[11px] font-bold tracking-wider uppercase disabled:opacity-40 transition-all"
              style={{ fontFamily: "'JetBrains Mono', monospace", background: "#d4a843", color: "#0a0c18" }}
            >
              <Save size={12} />
              {addMutation.isPending ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-[#4a6080] text-xs text-center py-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading notes...
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] hover:border-[#1a3a6a] transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: `${NOTE_TYPE_META[note.noteType].color}20`,
                      border: `1px solid ${NOTE_TYPE_META[note.noteType].color}40`,
                      color: NOTE_TYPE_META[note.noteType].color,
                    }}>
                    {NOTE_TYPE_META[note.noteType].icon}
                    {NOTE_TYPE_META[note.noteType].label}
                  </span>
                  <span className="text-[#4a6080] text-[8px] sm:text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirmId(note.id)}
                  className="text-[#4a6080] hover:text-[#f87171] active:text-[#f87171] transition-colors p-1 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[#c8d8f0] text-xs sm:text-sm leading-relaxed mb-2">{note.content}</p>
              <div className="text-[#4a6080] text-[8px] sm:text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                by {note.authorName || note.authorEmail}
              </div>

              {deleteConfirmId === note.id && (
                <div className="mt-2 p-2 bg-[#f87171]20 border border-[#f87171]40 rounded flex items-center gap-2">
                  <span className="text-[#f87171] text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Delete this note?</span>
                  <button
                    onClick={() => deleteMutation.mutate({ id: note.id })}
                    className="text-[#f87171] hover:text-[#fca5a5] text-[9px] font-bold tracking-wider uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-[#4a6080] hover:text-[#c8d8f0] text-[9px] font-bold tracking-wider uppercase"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[#4a6080] text-xs text-center py-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          No notes yet. Add one to start tracking interactions.
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// SHARED ACTIVITY / BUSINESS CONNECTIONS SECTION
// ═══════════════════════════════════════════════════════════════════════

type SharedPerson = { id: number; name: string; role: string | null; organization: string | null; sharedValue: string };

function ConnectionCard({ person }: { person: SharedPerson }) {
  return (
    <Link
      href={`/profile/${person.id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#060914] border border-[#151f38] hover:border-[#1a3a6a] transition-all group cursor-pointer"
    >
      <div className="w-8 h-8 rounded-md bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-[10px] font-bold shrink-0"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {person.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[#c8d8f0] text-xs font-semibold truncate group-hover:text-[#d4a843] transition-colors">
          {person.name}
        </div>
        {person.role && (
          <div className="text-[#4a6080] text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {person.role}
          </div>
        )}
      </div>
      <ExternalLink size={12} className="text-[#4a6080] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

function ConnectionGroup({ icon, title, color, people, maxShow = 6 }: {
  icon: React.ReactNode;
  title: string;
  color: string;
  people: SharedPerson[];
  maxShow?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (people.length === 0) return null;
  const visible = expanded ? people : people.slice(0, maxShow);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div style={{ color }}>{icon}</div>
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>
          {title}
        </span>
        <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          [{people.length}]
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map(p => <ConnectionCard key={p.id} person={p} />)}
      </div>
      {people.length > maxShow && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[10px] font-bold tracking-wider uppercase transition-colors hover:text-[#c8d8f0]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "#4a6080" }}
        >
          {expanded ? "Show Less" : `Show ${people.length - maxShow} More`}
        </button>
      )}
    </div>
  );
}

function SharedActivitySection({ contactId }: { contactId: number }) {
  const { data, isLoading } = trpc.connections.sharedActivity.useQuery(
    { contactId },
    { enabled: contactId > 0 }
  );

  if (isLoading) {
    return (
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="w-[3px] h-4 rounded-sm bg-[#60a5fa]" style={{ boxShadow: "0 0 10px rgba(96,165,250,0.5)" }} />
          <span className="text-[#60a5fa] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Business Connections
          </span>
        </div>
        <div className="text-[#4a6080] text-xs py-4 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Loading connections...
        </div>
      </div>
    );
  }

  const totalConnections = (data?.colleagues.length ?? 0) + (data?.coAttendees.length ?? 0) + (data?.sectorPeers.length ?? 0) + (data?.sharedDomain.length ?? 0);

  if (totalConnections === 0) return null;

  return (
    <div className="mt-6 sm:mt-8">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-[3px] h-4 rounded-sm bg-[#60a5fa]" style={{ boxShadow: "0 0 10px rgba(96,165,250,0.5)" }} />
        <span className="text-[#60a5fa] text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Business Connections
        </span>
        <span className="text-[#4a6080] text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          [{totalConnections}]
        </span>
      </div>

      <div className="space-y-6">
        <ConnectionGroup
          icon={<Building size={14} />}
          title="Same Organization"
          color="#f59e0b"
          people={data?.colleagues ?? []}
        />
        <ConnectionGroup
          icon={<Tag size={14} />}
          title="Same Event"
          color="#06b6d4"
          people={data?.coAttendees ?? []}
        />
        <ConnectionGroup
          icon={<Briefcase size={14} />}
          title="Same Sector"
          color="#8b5cf6"
          people={data?.sectorPeers ?? []}
        />
        <ConnectionGroup
          icon={<Globe size={14} />}
          title="Same Company Domain"
          color="#10b981"
          people={data?.sharedDomain ?? []}
        />
      </div>
    </div>
  );
}
