import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, Users, Tag,
  Plus, Trash2, MessageSquare, PhoneCall, MailIcon, Clock, FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, LoadingScreen, PanelCard, SectionHeader, StatusBadge, EmptyState } from "@/components/ui-primitives";

const NOTE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  meeting:   { label: "Meeting",   icon: <MessageSquare size={12} />, color: "#d4a843" },
  call:      { label: "Call",      icon: <PhoneCall size={12} />,     color: "#60a5fa" },
  email:     { label: "Email",     icon: <MailIcon size={12} />,      color: "#a78bfa" },
  follow_up: { label: "Follow-up", icon: <Clock size={12} />,        color: "#4ade80" },
  general:   { label: "General",   icon: <FileText size={12} />,     color: "#4a6080" },
};

export default function Profile() {
  const params = useParams<{ id: string }>();
  const contactId = Number(params.id);

  const { data: contact, isLoading, error } = trpc.contacts.getById.useQuery(
    { id: contactId },
    { enabled: !isNaN(contactId) }
  );

  if (isLoading) return <LoadingScreen text="Loading profile..." />;

  if (error || !contact) {
    return (
      <PageShell>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="text-[#f87171] font-mono text-sm tracking-widest uppercase">Contact not found</div>
          <Link href="/" className="text-[#d4a843] font-mono text-xs tracking-wider hover:text-[#f0c060] transition-colors flex items-center gap-2">
            <ArrowLeft size={14} /> Return to Globe
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header */}
      <div className="border-b border-[#151f38] bg-[#060914]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-[#4a6080] hover:text-[#d4a843] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-0.5 h-5 bg-[#d4a843] rounded-sm" />
          <span className="text-[#d4a843] font-mono text-[10px] font-extrabold tracking-[0.22em] uppercase">Contact Profile</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Name & Tier */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-lg bg-[#151f38] border border-[#1a3a6a] flex items-center justify-center text-[#d4a843] text-xl font-bold font-mono">
            {contact.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#c8d8f0] mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              {contact.name}
            </h1>
            <div className="flex items-center gap-3">
              {contact.role && <span className="text-[#4a6080] font-mono text-xs tracking-wider">{contact.role}</span>}
              {contact.tier && (
                <StatusBadge variant={contact.tier === 'Tier 1' ? 'success' : contact.tier === 'Tier 2' ? 'info' : 'danger'}>
                  {contact.tier}
                </StatusBadge>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contact.organization && <InfoCard icon={<Building size={16} />} label="Organization" value={contact.organization} />}
          {contact.location && <InfoCard icon={<MapPin size={16} />} label="Location" value={contact.location} />}
          {contact.group && <InfoCard icon={<Users size={16} />} label="Group" value={contact.group} />}
          {contact.role && <InfoCard icon={<Briefcase size={16} />} label="Role" value={contact.role} />}
          {contact.email && <InfoCard icon={<Mail size={16} />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
          {contact.phone && <InfoCard icon={<Phone size={16} />} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />}
        </div>

        {/* Static Notes */}
        {contact.notes && (
          <PanelCard className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-[#d4a843]" />
              <span className="text-[#d4a843] font-mono text-[9px] font-extrabold tracking-[0.18em] uppercase">Notes</span>
            </div>
            <p className="text-[#4a6080] font-mono text-sm leading-relaxed">{contact.notes}</p>
          </PanelCard>
        )}

        {/* Meeting Notes / Relationship Logs */}
        <MeetingNotesSection contactId={contactId} />
      </div>
    </PageShell>
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
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Relationship Log" count={notes?.length ?? 0} />
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase transition-all"
          style={{
            background: showForm ? "rgba(248,113,113,0.1)" : "rgba(212,168,67,0.1)",
            border: `1px solid ${showForm ? "rgba(248,113,113,0.3)" : "rgba(212,168,67,0.3)"}`,
            color: showForm ? "#f87171" : "#d4a843",
          }}
        >
          {showForm ? "Cancel" : <><Plus size={12} /> Add Note</>}
        </button>
      </div>

      {/* Add Note Form */}
      {showForm && (
        <PanelCard className="mb-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            {(Object.keys(NOTE_TYPE_META) as Array<keyof typeof NOTE_TYPE_META>).map((type) => {
              const meta = NOTE_TYPE_META[type];
              const isActive = noteType === type;
              return (
                <button
                  key={type}
                  onClick={() => setNoteType(type as typeof noteType)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[10px] tracking-wider uppercase transition-all"
                  style={{
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
            className="w-full p-3 rounded font-mono text-sm text-[#c8d8f0] placeholder-[#2a3a54] resize-none mb-3"
            style={{ background: "#0a0c18", border: "1px solid #151f38", outline: "none", minHeight: 120 }}
            maxLength={10000}
          />
          <button
            onClick={() => content.trim() && addMutation.mutate({ contactId, noteType, content: content.trim() })}
            disabled={!content.trim() || addMutation.isPending}
            className="px-4 py-2 rounded font-mono text-xs font-bold tracking-wider uppercase disabled:opacity-40"
            style={{ background: "#d4a843", color: "#0a0c18" }}
          >
            {addMutation.isPending ? "Saving..." : "Save Note"}
          </button>
        </PanelCard>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-8">
          <span className="text-[#4a6080] font-mono text-sm animate-pulse">Loading notes...</span>
        </div>
      ) : !notes?.length ? (
        <EmptyState text="No relationship logs yet" />
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const meta = NOTE_TYPE_META[note.noteType] ?? NOTE_TYPE_META.general;
            return (
              <PanelCard key={note.id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase"
                      style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30`, color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-[#4a6080] font-mono text-[10px]">
                      {note.authorName || note.authorEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#2a3a54] font-mono text-[10px]">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    {deleteConfirmId === note.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate({ id: note.id })}
                          className="text-[#f87171] font-mono text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[#4a6080] font-mono text-[9px] px-2 py-0.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(note.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#f87171] hover:text-[#fca5a5] transition-all"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[#c8d8f0] font-mono text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </PanelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════

function InfoCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <PanelCard className="hover:border-[#1a3a6a] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#d4a843]">{icon}</span>
        <span className="text-[#4a6080] font-mono text-[9px] font-extrabold tracking-[0.18em] uppercase">{label}</span>
      </div>
      <div className="text-[#c8d8f0] font-mono text-sm">{value}</div>
    </PanelCard>
  );
  if (href) return <a href={href} className="block no-underline">{inner}</a>;
  return inner;
}
