// ============================================================
// DESIGN: Intelligence Dossier — Full profile detail page
// Dark charcoal canvas, amber accents, editorial layout
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import Layout from "@/components/Layout";
import ContactNotes from "@/components/ContactNotes";
import ContactUpdateModal from "@/components/ContactUpdateModal";
import { getContactById, getTierLabel, GROUP_LABELS } from "@/data/contacts";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Award,
  Globe,
  Building2,
  Star,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NETWORK_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/network-abstract-HzaZPiZczZUKwzawdPq7Ne.webp";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function ProfileDetail() {
  const params = useParams<{ id: string }>();
  const contact = getContactById(Number(params.id));
  const loggedViewRef = useRef<number | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Log profile view to audit trail
  const logViewMutation = trpc.audit.logView.useMutation();

  useEffect(() => {
    if (contact && loggedViewRef.current !== contact.id) {
      loggedViewRef.current = contact.id;
      logViewMutation.mutate({
        contactId: contact.id,
        contactName: contact.name,
      });
    }
  }, [contact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!contact) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="font-mono-label text-sm text-muted-foreground">CONTACT NOT FOUND</p>
            <Link href="/">
              <span className="text-primary text-sm mt-2 inline-block hover:underline">Return to Network</span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const hasTier = contact.tier !== undefined && contact.tier !== null;

  return (
    <Layout>
      {/* Back navigation */}
      <div className="px-6 py-3 border-b border-border bg-background/50">
        <div className="flex items-center justify-between max-w-5xl">
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
              <ArrowLeft size={14} />
              <span className="font-mono-label text-[0.65rem]">BACK TO NETWORK</span>
            </span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpdateModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Pencil size={11} />
            Update Info
          </Button>
        </div>
      </div>

      {/* Profile header */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <img src={NETWORK_BG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
        <div className="relative px-6 py-8 sm:py-10 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            {contact.photo ? (
              <img
                src={contact.photo}
                alt={contact.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-primary/25 shadow-xl ring-4 ring-background"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-accent to-accent/40 border-2 border-primary/20 flex items-center justify-center shadow-xl ring-4 ring-background">
                <span className="font-display text-2xl text-primary/80">{getInitials(contact.name)}</span>
              </div>
            )}

            {/* Name & role */}
            <div className="flex-1">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl text-foreground">{contact.name}</h1>
                {hasTier && (
                  <span className={`tier-badge tier-${contact.tier} mt-1`}>
                    {getTierLabel(contact.tier ?? null)}
                  </span>
                )}
              </div>
              <p className="text-base text-foreground/80 mt-1">{contact.role}</p>
              <p className="text-sm text-primary mt-0.5 font-medium">{contact.organization}</p>

              <div className="flex flex-wrap items-center gap-4 mt-3">
                {contact.location && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <MapPin size={12} />
                    {contact.location}
                  </span>
                )}
                <span className="font-mono-label text-[0.6rem] text-muted-foreground/60">
                  ID #{String(contact.id).padStart(2, "0")} · {GROUP_LABELS[contact.group]}
                </span>
              </div>

              {/* Quick action buttons in header */}
              <div className="flex flex-wrap gap-2 mt-4">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400/90 hover:text-amber-400 hover:bg-amber-500/20 transition-all duration-150 text-xs font-medium"
                  >
                    <Mail size={12} />
                    Send Email
                  </a>
                )}
                {contact.linkedin && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 text-xs"
                  >
                    <Linkedin size={12} />
                    LinkedIn
                    <ExternalLink size={10} className="opacity-50" />
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.split("/")[0].split("(")[0].trim()}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 text-xs"
                  >
                    <Phone size={12} />
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 py-6 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content — left 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio */}
            {contact.bio && (
              <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-primary" />
                  <h2 className="font-mono-label text-[0.7rem] text-primary">PROFESSIONAL BIOGRAPHY</h2>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{contact.bio}</p>
              </section>
            )}

            {/* Career History */}
            {contact.career && contact.career.length > 0 && (
              <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={14} className="text-primary" />
                  <h2 className="font-mono-label text-[0.7rem] text-primary">CAREER HISTORY</h2>
                </div>
                <div className="space-y-4">
                  {contact.career.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/40 mt-2 flex-shrink-0 ring-2 ring-primary/10" />
                      <div className="flex-1 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                        <p className="text-sm text-foreground font-medium">{entry.role}</p>
                        <p className="text-xs text-primary/70 mt-0.5">{entry.organization}</p>
                        {entry.dates && (
                          <p className="font-mono-label text-[0.6rem] text-muted-foreground/60 mt-0.5">{entry.dates}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Achievements */}
            {contact.achievements && contact.achievements.length > 0 && (
              <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={14} className="text-primary" />
                  <h2 className="font-mono-label text-[0.7rem] text-primary">KEY ACHIEVEMENTS</h2>
                </div>
                <div className="space-y-4">
                  {contact.achievements.map((a, i) => (
                    <div key={i} className="border-l-2 border-primary/25 pl-4 py-0.5">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Board Memberships */}
            {contact.boardMemberships && contact.boardMemberships.length > 0 && (
              <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={14} className="text-primary" />
                  <h2 className="font-mono-label text-[0.7rem] text-primary">BOARD MEMBERSHIPS</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contact.boardMemberships.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/80 py-1">
                      <span className="text-primary/40">◆</span>
                      {b}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* VC Tier Assessment */}
            {contact.tierRating && (
              <section className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUpIcon size={14} className="text-primary" />
                  <h2 className="font-mono-label text-[0.7rem] text-primary">VC ASSESSMENT</h2>
                </div>
                <div className="space-y-5">
                  {contact.tierRating.access && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-label text-[0.6rem] text-muted-foreground">CAPITAL ACCESS</span>
                        <span className="font-mono-label text-[0.6rem] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{contact.tierRating.access}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{contact.tierRating.accessDetail}</p>
                    </div>
                  )}
                  {contact.tierRating.history && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-label text-[0.6rem] text-muted-foreground">TRACK RECORD</span>
                        <span className="font-mono-label text-[0.6rem] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{contact.tierRating.history}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{contact.tierRating.historyDetail}</p>
                    </div>
                  )}
                  {contact.tierRating.relationships && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-label text-[0.6rem] text-muted-foreground">RELATIONSHIPS</span>
                        <span className="font-mono-label text-[0.6rem] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{contact.tierRating.relationships}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{contact.tierRating.relationshipsDetail}</p>
                    </div>
                  )}
                </div>

                {contact.keyWins && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="font-mono-label text-[0.6rem] text-primary">KEY WINS</span>
                    <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{contact.keyWins}</p>
                  </div>
                )}
              </section>
            )}

            {/* Relationship Notes — database-backed */}
            <ContactNotes contactId={contact.id} contactName={contact.name} />
          </div>

          {/* Sidebar — right col */}
          <div className="space-y-4">
            {/* Contact Info Card */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono-label text-[0.7rem] text-primary">CONTACT INFORMATION</h3>
                <button
                  onClick={() => setUpdateModalOpen(true)}
                  title="Submit an update"
                  className="flex items-center gap-1 text-[0.6rem] text-muted-foreground/50 hover:text-muted-foreground transition-colors font-mono-label"
                >
                  <Pencil size={9} />
                  UPDATE
                </button>
              </div>
              <div className="space-y-3">
                {contact.linkedin && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group"
                  >
                    <Linkedin size={14} className="text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    <span className="truncate">LinkedIn Profile</span>
                    <ExternalLink size={10} className="text-muted-foreground/40 ml-auto flex-shrink-0" />
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 text-sm text-foreground/80 hover:text-amber-400 transition-colors group"
                  >
                    <Mail size={14} className="text-muted-foreground group-hover:text-amber-400 flex-shrink-0" />
                    <span className="truncate text-xs">{contact.email}</span>
                  </a>
                )}
                {contact.phone && (
                  <div className="flex items-start gap-3 text-sm text-foreground/80">
                    <Phone size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-xs leading-relaxed">{contact.phone}</span>
                  </div>
                )}
                {contact.cell && (
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Phone size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-xs">Cell: {contact.cell}</span>
                  </div>
                )}
                {contact.website && (
                  <a
                    href={`https://${contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group"
                  >
                    <Globe size={14} className="text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    <span className="truncate text-xs">{contact.website}</span>
                    <ExternalLink size={10} className="text-muted-foreground/40 ml-auto flex-shrink-0" />
                  </a>
                )}

                {/* Email CTA if available */}
                {contact.email && (
                  <div className="pt-2 mt-1 border-t border-border/60">
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/90 hover:bg-amber-500/20 hover:text-amber-400 transition-all duration-150 text-xs font-medium"
                    >
                      <Mail size={12} />
                      Send Email
                    </a>
                  </div>
                )}
              </div>
              {contact.notes && (
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="font-mono-label text-[0.6rem] text-muted-foreground">NOTES</span>
                  <p className="text-xs text-foreground/70 mt-1 italic leading-relaxed">{contact.notes}</p>
                </div>
              )}
            </div>

            {/* Education */}
            {contact.education && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={14} className="text-primary" />
                  <h3 className="font-mono-label text-[0.7rem] text-primary">EDUCATION</h3>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{contact.education}</p>
              </div>
            )}

            {/* Quick Stats */}
            {hasTier && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-mono-label text-[0.7rem] text-primary mb-3">CLASSIFICATION</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tier Level</span>
                    <span className={`tier-badge tier-${contact.tier}`}>TIER {contact.tier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Group</span>
                    <span className="text-xs text-foreground/80">{GROUP_LABELS[contact.group].split("—")[0].trim()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Contact ID</span>
                    <span className="font-mono-label text-[0.65rem] text-foreground/80">#{String(contact.id).padStart(2, "0")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Modal */}
      <ContactUpdateModal
        contactId={contact.id}
        contactName={contact.name}
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
    </Layout>
  );
}

// Inline icon to avoid import issues
function TrendingUpIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
