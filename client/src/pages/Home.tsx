// ============================================================
// DESIGN: Intelligence Dossier — Main dashboard / network view
// Dark charcoal canvas, amber accents, sidebar layout
// ============================================================

import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import ContactCard from "@/components/ContactCard";
import {
  CONTACTS,
  ContactGroup,
  GROUP_LABELS,
  GROUP_DESCRIPTIONS,
  getContactsByGroup,
} from "@/data/contacts";
import { Search, Users, Briefcase, TrendingUp, ChevronDown } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/hero-banner-Ld3fy6MPtpZPpyqSm8FZPr.webp";
const MAP_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/colombia-map-KctYGWoUUhDv6UmkZcxZzE.webp";

const GROUP_ICONS: Record<ContactGroup, typeof Users> = {
  general: Users,
  "business-card": Briefcase,
  "colombian-vc": TrendingUp,
};

const GROUP_ORDER: ContactGroup[] = ["colombian-vc", "general", "business-card"];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<ContactGroup | "all">("all");

  const filteredContacts = useMemo(() => {
    let contacts = activeGroup === "all" ? CONTACTS : getContactsByGroup(activeGroup as ContactGroup);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          (c.location && c.location.toLowerCase().includes(q))
      );
    }
    return contacts;
  }, [searchQuery, activeGroup]);

  const groupedContacts = useMemo(() => {
    if (activeGroup !== "all") {
      return [{ group: activeGroup as ContactGroup, contacts: filteredContacts }];
    }
    return GROUP_ORDER.map((group) => ({
      group,
      contacts: filteredContacts.filter((c) => c.group === group),
    })).filter((g) => g.contacts.length > 0);
  }, [filteredContacts, activeGroup]);

  const stats = useMemo(() => ({
    total: CONTACTS.length,
    withLinkedIn: CONTACTS.filter((c) => c.linkedin).length,
    withEmail: CONTACTS.filter((c) => c.email).length,
    withPhone: CONTACTS.filter((c) => c.phone || c.cell).length,
    tier1: CONTACTS.filter((c) => c.tier === 1).length,
    tier2: CONTACTS.filter((c) => c.tier === 2).length,
    tier3: CONTACTS.filter((c) => c.tier === 3).length,
  }), []);

  return (
    <Layout>
      {/* Hero section */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src={HERO_BG}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="relative h-full flex flex-col justify-end px-6 pb-6 max-w-6xl">
          <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">
            Strategic Network
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Intelligence dossiers for 35 key contacts across Colombian VC, financial ecosystem, and international business networks. Ranked by capital access, track record, and relationship strength.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-border bg-card/50">
        <div className="px-6 py-4 flex flex-wrap gap-6">
          <div>
            <span className="font-mono-label text-[0.6rem] text-muted-foreground">TOTAL CONTACTS</span>
            <p className="text-xl font-display text-primary mt-0.5">{stats.total}</p>
          </div>
          <div>
            <span className="font-mono-label text-[0.6rem] text-muted-foreground">LINKEDIN VERIFIED</span>
            <p className="text-xl font-display text-foreground mt-0.5">{stats.withLinkedIn}</p>
          </div>
          <div>
            <span className="font-mono-label text-[0.6rem] text-muted-foreground">DIRECT EMAIL</span>
            <p className="text-xl font-display text-foreground mt-0.5">{stats.withEmail}</p>
          </div>
          <div>
            <span className="font-mono-label text-[0.6rem] text-muted-foreground">PHONE ACCESS</span>
            <p className="text-xl font-display text-foreground mt-0.5">{stats.withPhone}</p>
          </div>
          <div className="hidden sm:block border-l border-border pl-6">
            <span className="font-mono-label text-[0.6rem] text-muted-foreground">VC TIERS</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="tier-badge tier-1">T1: {stats.tier1}</span>
              <span className="tier-badge tier-2">T2: {stats.tier2}</span>
              <span className="tier-badge tier-3">T3: {stats.tier3}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-3 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, organization, role, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Group filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveGroup("all")}
              className={`px-3 py-2 rounded-md font-mono-label text-[0.65rem] whitespace-nowrap transition-colors ${
                activeGroup === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              ALL ({CONTACTS.length})
            </button>
            {GROUP_ORDER.map((group) => {
              const Icon = GROUP_ICONS[group];
              const count = getContactsByGroup(group).length;
              return (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono-label text-[0.65rem] whitespace-nowrap transition-colors ${
                    activeGroup === group
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon size={12} />
                  <span>{GROUP_LABELS[group].split("—")[0].trim()} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact groups */}
      <div className="px-6 py-6 space-y-10">
        {groupedContacts.map(({ group, contacts }) => (
          <section key={group}>
            {/* Group header */}
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const Icon = GROUP_ICONS[group];
                  return <Icon size={16} className="text-primary" />;
                })()}
                <h2 className="font-display text-xl text-foreground">
                  {GROUP_LABELS[group]}
                </h2>
                <span className="font-mono-label text-[0.6rem] text-muted-foreground">
                  {contacts.length} CONTACTS
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                {GROUP_DESCRIPTIONS[group]}
              </p>
              <div className="diamond-divider mt-4">
                <span className="text-primary/40 text-xs">◆</span>
              </div>
            </div>

            {/* Contact grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </section>
        ))}

        {filteredContacts.length === 0 && (
          <div className="text-center py-16">
            <p className="font-mono-label text-sm text-muted-foreground">NO CONTACTS MATCH YOUR SEARCH</p>
            <p className="text-xs text-muted-foreground mt-2">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Footer with map */}
      <div className="relative mt-8 border-t border-border">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <img src={MAP_BG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative px-6 py-8 text-center">
          <p className="font-mono-label text-[0.6rem] text-muted-foreground">
            STRATEGIC NETWORK INTELLIGENCE — CONFIDENTIAL
          </p>
          <p className="font-mono-label text-[0.55rem] text-muted-foreground/60 mt-1">
            35 CONTACTS · COLOMBIA · LATAM · INTERNATIONAL
          </p>
        </div>
      </div>
    </Layout>
  );
}
