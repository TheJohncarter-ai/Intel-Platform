import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Users, Tag,
  Plus, Trash2, MessageSquare, PhoneCall, MailIcon, Clock, FileText,
  Edit3, X, Save, Sparkles, ExternalLink, Linkedin, Info,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const NOTE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  meeting:   { label: "Meeting",   icon: <MessageSquare size={12} />, color: "#d4a843" },
  call:      { label: "Call",      icon: <PhoneCall size={12} />,     color: "#60a5fa" },
  email:     { label: "Email",     icon: <MailIcon size={12} />,      color: "#a78bfa" },
  follow_up: { label: "Follow-up", icon: <Clock size={12} />,        color: "#4ade80" },
  general:   { label: "General",   icon: <FileText size={12} />,     color: "#4a6080" },
  research:  { label: "Research",  icon: <Sparkles size={12} />,     color: "#f59e0b" },
};

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

        {/* Static Notes */}
        {contact.notes && (
          <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] mb-5 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Tag size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] text-[9px] font-extrabold tracking-[0.18em] uppercase"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}>Notes</span>
            </div>
            <p className="text-[#4a6080] text-xs sm:text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {contact.notes}
            </p>
          </div>
        )}

        {/* Meeting Notes / Relationship Logs */}
        <MeetingNotesSection contactId={contactId} />
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
  const [noteType, setNoteType] = useState<"meeting" | "call" | "email" | "follow_up" | "general">("meeting");
  const [content, setContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const addMutation = trpc.notes.add.useMutation({
    onSuccess: () => {
      utils.notes.listByContact.invalidate({ contactId });
      setContent("");
      setShowForm(false);
      toast.success("Note added");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.listByContact.invalidate({ contactId });
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
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: showForm ? "rgba(248,113,113,0.08)" : "rgba(212,168,67,0.08)",
            border: `1px solid ${showForm ? "rgba(248,113,113,0.25)" : "rgba(212,168,67,0.25)"}`,
            color: showForm ? "#f87171" : "#d4a843",
          }}
        >
          {showForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add Note</>}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] mb-4">
          <div className="flex gap-1.5 sm:gap-2 mb-3 flex-wrap">
            {(Object.entries(NOTE_TYPE_META) as [string, typeof NOTE_TYPE_META[string]][])
              .filter(([key]) => key !== "research")
              .map(([type, meta]) => {
                const isActive = noteType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setNoteType(type as typeof noteType)}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded text-[9px] sm:text-[10px] tracking-wider uppercase transition-all"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: isActive ? `${meta.color}18` : "transparent",
                      border: `1px solid ${isActive ? `${meta.color}50` : "#151f38"}`,
                      color: isActive ? meta.color : "#4a6080",
                    }}
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Log your interaction, meeting notes, follow-up items..."
            className="w-full p-3 rounded text-xs sm:text-sm text-[#c8d8f0] placeholder-[#2a3a54] resize-none mb-3 bg-[#0a0c18] border border-[#151f38] outline-none focus:border-[#1a3a6a] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", minHeight: 100 }}
            maxLength={10000}
          />
          <button
            onClick={() => content.trim() && addMutation.mutate({ contactId, noteType, content: content.trim() })}
            disabled={!content.trim() || addMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] sm:text-xs font-bold tracking-wider uppercase disabled:opacity-40 transition-all"
            style={{ fontFamily: "'JetBrains Mono', monospace", background: "#d4a843", color: "#0a0c18" }}
          >
            <Save size={12} />
            {addMutation.isPending ? "Saving..." : "Save Note"}
          </button>
        </div>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-8">
          <span className="text-[#4a6080] text-sm animate-pulse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            Loading notes...
          </span>
        </div>
      ) : !notes?.length ? (
        <div className="text-center py-8 sm:py-10 rounded-lg bg-[#060914] border border-[#151f38]">
          <span className="text-[#2a3a54] text-xs sm:text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            No relationship logs yet
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const meta = NOTE_TYPE_META[note.noteType] ?? NOTE_TYPE_META.general;
            const isResearch = note.noteType === "research";
            return (
              <div key={note.id} className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] group transition-colors hover:border-[#1a3a6a]">
                {/* Note header — stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-0 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-wider uppercase"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: `${meta.color}12`,
                        border: `1px solid ${meta.color}30`,
                        color: meta.color,
                      }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-[#4a6080] text-[9px] sm:text-[10px] truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {note.authorName || note.authorEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#2a3a54] text-[9px] sm:text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    {deleteConfirmId === note.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate({ id: note.id })}
                          className="text-[#f87171] text-[9px] font-bold px-2 py-0.5 rounded transition-all"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            background: "rgba(248,113,113,0.1)",
                            border: "1px solid rgba(248,113,113,0.3)",
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[#4a6080] text-[9px] px-2 py-0.5"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 text-[#f87171] hover:text-[#fca5a5] transition-all p-1"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {isResearch ? (
                  <div className="prose prose-invert prose-sm max-w-none text-[#c8d8f0] overflow-x-auto"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    <Streamdown>{note.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-[#c8d8f0] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {note.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function InfoCard({ icon, label, value, action }: { icon: React.ReactNode; label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="p-3 sm:p-4 rounded-lg bg-[#060914] border border-[#151f38] hover:border-[#1a3a6a] transition-colors">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[#d4a843]">{icon}</span>
          <span className="text-[#4a6080] text-[8px] sm:text-[9px] font-extrabold tracking-[0.18em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        </div>
        {action}
      </div>
      <div className="text-[#c8d8f0] text-xs sm:text-sm truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    "Tier 1": { bg: "#0d1f0d", border: "#1a4a1a", text: "#4ade80" },
    "Tier 2": { bg: "#0d1828", border: "#1a3a5a", text: "#60a5fa" },
    "Tier 3": { bg: "#1f0d0d", border: "#4a1a1a", text: "#f87171" },
  };
  const s = styles[tier] ?? { bg: "#120d1f", border: "#2d1a5a", text: "#a78bfa" };
  return (
    <span className="text-[8px] sm:text-[9px] font-extrabold tracking-[0.1em] uppercase px-1.5 sm:px-2 py-0.5 rounded-sm"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
      }}>
      {tier}
    </span>
  );
}
