// ============================================================
// DESIGN: Intelligence Dossier — Contact card with tier badges
// Monospaced labels, diamond dividers, amber accents
// ============================================================

import { useState } from "react";
import { Link } from "wouter";
import { Contact, getTierLabel } from "@/data/contacts";
import { ExternalLink, Mail, Phone, MapPin, Linkedin, Pencil } from "lucide-react";
import ContactUpdateModal from "@/components/ContactUpdateModal";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function ContactCard({ contact }: { contact: Contact }) {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const hasTier = contact.tier !== undefined && contact.tier !== null;
  const hasDetail = contact.bio || (contact.career && contact.career.length > 0);

  const cardContent = (
    <div
      className={`
        group relative bg-card border border-border rounded-lg p-5
        transition-all duration-200
        ${hasDetail ? "hover:border-primary/40 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5 cursor-pointer" : ""}
      `}
    >
      {/* Tier badge */}
      {hasTier && (
        <div className="absolute top-3 right-3">
          <span className={`tier-badge tier-${contact.tier}`}>
            T{contact.tier}
          </span>
        </div>
      )}

      {/* Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        {contact.photo ? (
          <img
            src={contact.photo}
            alt={contact.name}
            className="w-11 h-11 rounded-md object-cover flex-shrink-0 ring-1 ring-border"
          />
        ) : (
          <div className="w-11 h-11 rounded-md bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center flex-shrink-0 ring-1 ring-border">
            <span className="font-display text-sm text-primary/90">{getInitials(contact.name)}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base text-foreground leading-tight truncate pr-8">
            {contact.name}
          </h3>
          <p className="font-mono-label text-[0.6rem] text-muted-foreground/60 mt-0.5 truncate">
            #{String(contact.id).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Role & Org */}
      <div className="mb-3">
        <p className="text-sm text-foreground/90 leading-snug">{contact.role}</p>
        <p className="text-xs text-primary/80 mt-0.5 font-medium">{contact.organization}</p>
      </div>

      {/* Location */}
      {contact.location && (
        <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
          <MapPin size={11} strokeWidth={1.5} />
          <span className="text-xs">{contact.location}</span>
        </div>
      )}

      {/* Contact info pills */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {contact.linkedin && (
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/80 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 text-[0.65rem]"
          >
            <Linkedin size={10} />
            <span>LinkedIn</span>
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/20 transition-all duration-150 text-[0.65rem] border border-amber-500/20"
          >
            <Mail size={10} />
            <span>Email</span>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone.split("/")[0].split("(")[0].trim()}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/80 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 text-[0.65rem]"
          >
            <Phone size={10} />
            <span>Phone</span>
          </a>
        )}
        {contact.website && (
          <a
            href={`https://${contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/80 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150 text-[0.65rem]"
          >
            <ExternalLink size={10} />
            <span>Web</span>
          </a>
        )}
        {/* Update Info button — always visible */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUpdateModalOpen(true);
          }}
          title="Submit an info update for admin review"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/50 text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent transition-all duration-150 text-[0.65rem]"
        >
          <Pencil size={9} />
          <span>Update</span>
        </button>
      </div>

      {/* Notes */}
      {contact.notes && (
        <p className="text-[0.65rem] text-muted-foreground mt-3 italic leading-relaxed line-clamp-2">
          {contact.notes}
        </p>
      )}

      {/* View detail indicator */}
      {hasDetail && (
        <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="font-mono-label text-[0.6rem] text-muted-foreground/70">
            FULL DOSSIER AVAILABLE
          </span>
          <ExternalLink size={11} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {hasDetail ? (
        <Link href={`/profile/${contact.id}`}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}

      <ContactUpdateModal
        contactId={contact.id}
        contactName={contact.name}
        open={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
      />
    </>
  );
}
