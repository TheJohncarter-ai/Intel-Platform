// ============================================================
// DESIGN: Intelligence Dossier — Rankings / VC Assessment page
// Dark charcoal canvas, amber accents, tier classification
// ============================================================

import { Link } from "wouter";
import Layout from "@/components/Layout";
import { CONTACTS, getTierLabel } from "@/data/contacts";
import { Trophy, ArrowRight, ExternalLink, Star, TrendingUp, Users } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/network-abstract-HzaZPiZczZUKwzawdPq7Ne.webp";

const rankedContacts = CONTACTS.filter((c) => c.tier !== undefined && c.tier !== null).sort(
  (a, b) => (a.tier ?? 99) - (b.tier ?? 99) || a.id - b.id
);

const tiers = [
  { level: 1 as const, label: "Tier 1 — Highest Impact", description: "Maximum capital access, deepest track record, strongest network reach." },
  { level: 2 as const, label: "Tier 2 — High Impact, Specialized Access", description: "Significant capital access with specialized expertise in specific sectors or geographies." },
  { level: 3 as const, label: "Tier 3 — Supporting Players with Niche Access", description: "Valuable niche access and specialized roles within the broader ecosystem." },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export default function Rankings() {
  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-48 overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="relative h-full flex flex-col justify-end px-6 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={20} className="text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl text-foreground">
              Decision Maker Rankings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Top players ranked by access to VC-friendly capital, track record, and relationship strength in the Colombian financial ecosystem.
          </p>
        </div>
      </div>

      {/* Ranking methodology */}
      <div className="border-b border-border bg-card/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={12} className="text-primary" />
            <span className="font-mono-label text-[0.65rem] text-primary">RANKING METHODOLOGY</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Access to Capital</p>
                <p className="text-[0.65rem] text-muted-foreground">Direct pipeline to institutional, PE, and VC capital</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Track Record</p>
                <p className="text-[0.65rem] text-muted-foreground">History of executed deals, fund management, and exits</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <div>
                <p className="text-xs font-medium text-foreground">Relationships & Network</p>
                <p className="text-[0.65rem] text-muted-foreground">Breadth and depth of institutional and family office connections</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tier sections */}
      <div className="px-6 py-6 space-y-8 max-w-5xl">
        {tiers.map((tier) => {
          const tierContacts = rankedContacts.filter((c) => c.tier === tier.level);
          if (tierContacts.length === 0) return null;

          return (
            <section key={tier.level}>
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`tier-badge tier-${tier.level}`}>{tier.label.toUpperCase()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
                <div className="diamond-divider mt-3">
                  <span className="text-primary/40 text-xs">◆</span>
                </div>
              </div>

              <div className="space-y-4">
                {tierContacts.map((contact, index) => {
                  const globalRank = rankedContacts.indexOf(contact) + 1;
                  return (
                    <Link key={contact.id} href={`/profile/${contact.id}`}>
                      <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-all duration-150 cursor-pointer group">
                        <div className="flex items-start gap-4">
                          {/* Rank number */}
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-lg text-primary">#{globalRank}</span>
                          </div>

                          {/* Avatar */}
                          {contact.photo ? (
                            <img
                              src={contact.photo}
                              alt={contact.name}
                              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                              <span className="font-display text-base text-primary/80">{getInitials(contact.name)}</span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-display text-lg text-foreground">{contact.name}</h3>
                                <p className="text-sm text-foreground/80">{contact.role}</p>
                                <p className="text-xs text-primary">{contact.organization}</p>
                              </div>
                              <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
                            </div>

                            {/* Tier ratings */}
                            {contact.tierRating && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                {contact.tierRating.access && (
                                  <div className="bg-background/50 rounded-md p-3">
                                    <span className="font-mono-label text-[0.55rem] text-muted-foreground">ACCESS</span>
                                    <p className="text-xs text-primary font-medium mt-0.5">{contact.tierRating.access}</p>
                                    <p className="text-[0.65rem] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{contact.tierRating.accessDetail}</p>
                                  </div>
                                )}
                                {contact.tierRating.history && (
                                  <div className="bg-background/50 rounded-md p-3">
                                    <span className="font-mono-label text-[0.55rem] text-muted-foreground">TRACK RECORD</span>
                                    <p className="text-xs text-primary font-medium mt-0.5">{contact.tierRating.history}</p>
                                    <p className="text-[0.65rem] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{contact.tierRating.historyDetail}</p>
                                  </div>
                                )}
                                {contact.tierRating.relationships && (
                                  <div className="bg-background/50 rounded-md p-3">
                                    <span className="font-mono-label text-[0.55rem] text-muted-foreground">RELATIONSHIPS</span>
                                    <p className="text-xs text-primary font-medium mt-0.5">{contact.tierRating.relationships}</p>
                                    <p className="text-[0.65rem] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{contact.tierRating.relationshipsDetail}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Key wins */}
                            {contact.keyWins && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <span className="font-mono-label text-[0.55rem] text-primary">KEY WINS</span>
                                <p className="text-[0.65rem] text-muted-foreground mt-0.5 leading-relaxed">{contact.keyWins}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Summary table */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-primary" />
            <h2 className="font-mono-label text-[0.7rem] text-primary">SUMMARY RANKING TABLE</h2>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">RANK</th>
                    <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">NAME</th>
                    <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">ORGANIZATION</th>
                    <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">PRIMARY EDGE</th>
                    <th className="text-left px-4 py-3 font-mono-label text-[0.6rem] text-muted-foreground">TIER</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedContacts.map((contact, i) => {
                    const edges: Record<number, string> = {
                      29: "Only person who has built and exited a VC fund in Colombia + now deploys institutional private credit into LatAm",
                      30: "40-year track record, UBS partnership, elite Colombian business family network",
                      31: "76+ PE firm relationships globally, $9B+ managed, cross-border capital specialist",
                      32: "PE/VC + real estate, HBS network",
                      33: "Financial services M&A leader, $180M Helm deal",
                      34: "US-Colombia capital bridge",
                      35: "Alternative assets, fintech investment vehicles",
                    };
                    return (
                      <tr key={contact.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-display text-primary">#{i + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/profile/${contact.id}`}>
                            <span className="text-foreground hover:text-primary transition-colors font-medium">{contact.name}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{contact.organization}</td>
                        <td className="px-4 py-3 text-xs text-foreground/70 max-w-xs">{edges[contact.id] || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`tier-badge tier-${contact.tier}`}>T{contact.tier}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
