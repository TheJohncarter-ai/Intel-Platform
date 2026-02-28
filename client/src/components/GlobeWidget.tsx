/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  GlobeWidget.tsx  —  Strategic Contact Intelligence Globe                   ║
 * ║  Redesigned: Wireframe map · Clickable regions · Bottom contact panel       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * ┌─ FIELD MAPPING ──────────────────────────────────────────────────────────────┐
 * │  Adapt these to match your actual contacts.ts shape:                         │
 * │                                                                              │
 * │  contact.id           → unique identifier                                    │
 * │  contact.name         → full display name                                    │
 * │  contact.role         → job title (rename from "title" if needed)            │
 * │  contact.organization → company/org (rename from "company" if needed)        │
 * │  contact.country      → must match keys in REGION_MAP below                  │
 * │  contact.group        → group name string                                    │
 * │  contact.tier         → optional tier label e.g. "Tier 1", "LP", "GP"       │
 * │                                                                              │
 * │  Search for "// ← ADAPT" comments to find every mapping point               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ ROUTING ─────────────────────────────────────────────────────────────────────┐
 * │  Profile links use: /contacts/${contact.id}                                   │
 * │  Change PROFILE_PATH_PREFIX below to match your router.                       │
 * └───────────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ DEPENDENCIES ────────────────────────────────────────────────────────────────┐
 * │  globe.gl          (already installed)                                        │
 * │  topojson-client   (already installed)                                        │
 * │  No new packages needed.                                                      │
 * └───────────────────────────────────────────────────────────────────────────────┘
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Globe from "globe.gl";
import { feature } from "topojson-client";

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const PROFILE_PATH_PREFIX = "/profile"; // Route prefix for contact profile pages

const COLORS = {
  bg: "#0a0c18",
  globeSurface: "#070910",
  wireframe: "#1a3a6a",
  wireframeAlt: "#0f2040",
  regionDefault: "rgba(14,28,58,0.75)",
  regionDefaultStroke: "#1a3a6a",
  regionHover: "rgba(212,168,67,0.18)",
  regionHoverStroke: "#d4a843",
  regionSelected: "rgba(212,168,67,0.22)",
  regionSelectedStroke: "#f0c060",
  atmosphere: "rgba(10,30,80,0.15)",
  amber: "#d4a843",
  amberBright: "#f0c060",
  amberDim: "#7a5820",
  amberGlow: "rgba(212,168,67,0.5)",
  dotPulse: "#d4a843",
  text: "#c8d8f0",
  textDim: "#4a6080",
  textMuted: "#2a3a54",
  panelBg: "rgba(6,9,20,0.96)",
  panelBorder: "#151f38",
  green: "#4ade80",
  greenBg: "#0d1f0d",
  greenBorder: "#1a4a1a",
  blue: "#60a5fa",
  blueBg: "#0d1828",
  blueBorder: "#1a3a5a",
  red: "#f87171",
  redBg: "#1f0d0d",
  redBorder: "#4a1a1a",
  purple: "#a78bfa",
  purpleBg: "#120d1f",
  purpleBorder: "#2d1a5a",
  teal: "#34d399",
  tealBg: "#0d1f1a",
  tealBorder: "#1a4a3a",
};

// ════════════════════════════════════════════════════════════════════════════════
// REGION DEFINITIONS
// Maps the country value in your contact data → ISO + display info
// ════════════════════════════════════════════════════════════════════════════════

interface RegionMeta {
  iso: string;   // ISO alpha-3 code as used in Natural Earth / world-110m TopoJSON
  label: string; // Display name in UI
  lat: number;   // Centroid latitude for dot placement
  lng: number;   // Centroid longitude for dot placement
}

// ← ADAPT: Add/modify entries to match the country strings in your contacts.country field
const REGION_MAP: Record<string, RegionMeta> = {
  Colombia:         { iso: "COL", label: "Colombia",        lat: 4.711,  lng: -74.072 },
  "United States":  { iso: "USA", label: "United States",   lat: 39.5,   lng: -98.35  },
  US:               { iso: "USA", label: "United States",   lat: 39.5,   lng: -98.35  },
  USA:              { iso: "USA", label: "United States",   lat: 39.5,   lng: -98.35  },
  UK:               { iso: "GBR", label: "United Kingdom",  lat: 51.5,   lng: -0.12   },
  "United Kingdom": { iso: "GBR", label: "United Kingdom",  lat: 51.5,   lng: -0.12   },
  Ecuador:          { iso: "ECU", label: "Ecuador",         lat: -1.83,  lng: -78.18  },
  Peru:             { iso: "PER", label: "Peru",            lat: -9.19,  lng: -75.0   },
  Panama:           { iso: "PAN", label: "Panama",          lat: 8.99,   lng: -79.52  },
  "Puerto Rico":    { iso: "PRI", label: "Puerto Rico",     lat: 18.22,  lng: -66.59  },
  Canada:           { iso: "CAN", label: "Canada",          lat: 56.13,  lng: -106.35 },
  UAE:              { iso: "ARE", label: "UAE / Dubai",     lat: 24.47,  lng: 54.37   },
  Dubai:            { iso: "ARE", label: "UAE / Dubai",     lat: 24.47,  lng: 54.37   },
  "UAE/Dubai":      { iso: "ARE", label: "UAE / Dubai",     lat: 24.47,  lng: 54.37   },
  "United Arab Emirates": { iso: "ARE", label: "UAE / Dubai", lat: 24.47, lng: 54.37 },
  Mexico:           { iso: "MEX", label: "Mexico",          lat: 23.63,  lng: -102.55 },
  Europe:           { iso: "_EUR", label: "Europe",         lat: 50.11,  lng: 14.44   },
  Germany:          { iso: "DEU", label: "Germany",         lat: 51.16,  lng: 10.45   },
  France:           { iso: "FRA", label: "France",          lat: 46.23,  lng: 2.21    },
  Spain:            { iso: "ESP", label: "Spain",           lat: 40.46,  lng: -3.75   },
  Netherlands:      { iso: "NLD", label: "Netherlands",     lat: 52.13,  lng: 5.29    },
};

// ════════════════════════════════════════════════════════════════════════════════
// TIER BADGE CONFIG
// ════════════════════════════════════════════════════════════════════════════════

const TIER_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  "Tier 1": { bg: COLORS.greenBg,  border: COLORS.greenBorder,  text: COLORS.green  },
  "Tier 2": { bg: COLORS.blueBg,   border: COLORS.blueBorder,   text: COLORS.blue   },
  "Tier 3": { bg: COLORS.redBg,    border: COLORS.redBorder,    text: COLORS.red    },
  LP:       { bg: COLORS.purpleBg, border: COLORS.purpleBorder, text: COLORS.purple },
  GP:       { bg: COLORS.tealBg,   border: COLORS.tealBorder,   text: COLORS.teal   },
  default:  { bg: "#0d1020",       border: "#1a2040",           text: COLORS.textDim },
};

// ════════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════════

// ← ADAPT: rename fields to match your actual Contact type from contacts.ts
export interface Contact {
  id: string | number;
  name: string;
  role?: string;          // ← ADAPT: rename to "title" if that's your field name
  organization?: string;  // ← ADAPT: rename to "company" if that's your field name
  country?: string;
  group?: string;
  tier?: string;
}

interface RegionState {
  iso: string;
  label: string;
  lat: number;
  lng: number;
  contacts: Contact[];
  selected: boolean;
  hovered: boolean;
}

interface GlobeWidgetProps {
  contacts: Contact[];
  height?: number;
  onContactClick?: (contact: Contact) => void;
}

// ════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════

function normalizeCountry(country: string | undefined): RegionMeta | null {
  if (!country) return null;
  return REGION_MAP[country.trim()] ?? null;
}

function isColombianVC(contact: Contact): boolean {
  return !!(contact.group?.toLowerCase().includes("colombian vc"));
}

// ════════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════════

// ── Scan Line Divider ──────────────────────────────────────────────────────────
const ScanDivider = () => (
  <div style={{
    height: 1,
    background: `linear-gradient(90deg, transparent, ${COLORS.wireframe} 20%, ${COLORS.wireframe} 80%, transparent)`,
    margin: "0",
  }} />
);

// ── Tier Badge ─────────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  const s = TIER_STYLES[tier] ?? TIER_STYLES.default;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 6px",
      borderRadius: 2,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {tier}
    </span>
  );
}

// ── Contact Card ───────────────────────────────────────────────────────────────
function ContactCard({ contact }: { contact: Contact }) {
  const [hovered, setHovered] = useState(false);
  const vcContact = isColombianVC(contact);

  return (
    <a
      href={`${PROFILE_PATH_PREFIX}/${contact.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "10px 13px",
        borderRadius: 4,
        background: hovered
          ? "rgba(212,168,67,0.06)"
          : "rgba(12,18,36,0.8)",
        border: `1px solid ${hovered ? COLORS.amberDim : COLORS.panelBorder}`,
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        minWidth: 200,
        maxWidth: 260,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Amber left accent line when hovered */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: hovered ? COLORS.amber : "transparent",
        transition: "background 0.15s",
        borderRadius: "4px 0 0 4px",
      }} />

      {/* Name + tier row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 4 }}>
        <div style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          flexShrink: 0,
          background: vcContact ? COLORS.amber : COLORS.wireframe,
          boxShadow: vcContact ? `0 0 8px ${COLORS.amberGlow}` : "none",
          transition: "all 0.2s",
        }} />
        <span style={{
          color: hovered ? COLORS.amberBright : COLORS.text,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Syne', 'Barlow', sans-serif",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
          transition: "color 0.15s",
        }}>
          {contact.name}
        </span>
        {/* ← ADAPT: show tier badge if contact has tier field */}
        {contact.tier && <TierBadge tier={contact.tier} />}
      </div>

      {/* Role / Org row */}
      {(contact.role || contact.organization) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: 4,
          overflow: "hidden",
        }}>
          {/* ← ADAPT: contact.role → contact.title if your field is named "title" */}
          {contact.role && (
            <span style={{
              color: COLORS.textDim,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.03em",
            }}>
              {contact.role}
            </span>
          )}
          {/* ← ADAPT: contact.organization → contact.company if your field is named "company" */}
          {contact.role && contact.organization && (
            <span style={{ color: COLORS.textMuted, fontSize: 10 }}>·</span>
          )}
          {contact.organization && (
            <span style={{
              color: vcContact ? COLORS.amberDim : COLORS.textMuted,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}>
              {contact.organization}
            </span>
          )}
        </div>
      )}
    </a>
  );
}

// ── Region Tab in Panel Header ─────────────────────────────────────────────────
function RegionTab({
  region,
  onRemove,
}: {
  region: RegionState;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px 3px 10px",
        borderRadius: 3,
        background: "rgba(212,168,67,0.08)",
        border: `1px solid ${COLORS.amberDim}`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: COLORS.amber,
        letterSpacing: "0.06em",
        userSelect: "none",
      }}
    >
      <span style={{
        width: 4, height: 4, borderRadius: "50%",
        background: COLORS.amber,
        boxShadow: `0 0 6px ${COLORS.amberGlow}`,
        flexShrink: 0,
      }} />
      {region.label}
      <span style={{
        color: COLORS.amberDim,
        fontSize: 9,
        marginLeft: 2,
      }}>
        [{region.contacts.length}]
      </span>
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: hovered ? COLORS.amber : COLORS.amberDim,
          fontSize: 11,
          lineHeight: 1,
          padding: "0 0 0 2px",
          display: "flex",
          alignItems: "center",
          transition: "color 0.1s",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Bottom Contact Panel ───────────────────────────────────────────────────────
interface ContactPanelProps {
  regions: RegionState[];
  onDeselect: (iso: string) => void;
  onClearAll: () => void;
}

function ContactPanel({ regions, onDeselect, onClearAll }: ContactPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const selectedRegions = regions.filter((r) => r.selected);
  const totalContacts = selectedRegions.reduce((s, r) => s + r.contacts.length, 0);

  if (selectedRegions.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: COLORS.panelBg,
        borderTop: `1px solid ${COLORS.panelBorder}`,
        boxShadow: "0 -16px 48px rgba(0,0,0,0.7), 0 -1px 0 rgba(212,168,67,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
        maxHeight: collapsed ? "44px" : "280px",
        overflow: "hidden",
      }}
    >
      {/* ── Panel Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        height: 44,
        gap: 12,
        borderBottom: collapsed ? "none" : `1px solid ${COLORS.panelBorder}`,
        flexShrink: 0,
      }}>
        {/* Status indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 2,
            height: 16,
            background: COLORS.amber,
            borderRadius: 1,
            boxShadow: `0 0 8px ${COLORS.amberGlow}`,
          }} />
          <span style={{
            color: COLORS.amber,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Intel Report
          </span>
        </div>

        {/* Region tabs */}
        <div style={{
          display: "flex",
          gap: 6,
          flex: 1,
          flexWrap: "wrap",
          overflow: "hidden",
          alignItems: "center",
        }}>
          {selectedRegions.map((r) => (
            <RegionTab key={r.iso} region={r} onRemove={() => onDeselect(r.iso)} />
          ))}
        </div>

        {/* Count */}
        <span style={{
          color: COLORS.textDim,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
        }}>
          {totalContacts} asset{totalContacts !== 1 ? "s" : ""}
        </span>

        {/* Clear all */}
        <button
          onClick={onClearAll}
          style={{
            background: "none",
            border: `1px solid ${COLORS.panelBorder}`,
            color: COLORS.textDim,
            fontSize: 9,
            padding: "3px 9px",
            borderRadius: 2,
            cursor: "pointer",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = COLORS.wireframe;
            (e.target as HTMLButtonElement).style.color = COLORS.text;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = COLORS.panelBorder;
            (e.target as HTMLButtonElement).style.color = COLORS.textDim;
          }}
        >
          Clear All
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: "none",
            border: `1px solid ${COLORS.panelBorder}`,
            color: COLORS.textDim,
            width: 28,
            height: 22,
            borderRadius: 2,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flexShrink: 0,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = COLORS.amber;
            (e.target as HTMLButtonElement).style.color = COLORS.amber;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = COLORS.panelBorder;
            (e.target as HTMLButtonElement).style.color = COLORS.textDim;
          }}
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Contact Rows (one per selected region) ── */}
      {!collapsed && (
        <div style={{
          overflowY: "auto",
          maxHeight: 236,
        }}>
          {selectedRegions.map((region, regionIdx) => (
            <div key={region.iso}>
              {/* Region header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 16px 6px",
                position: "sticky",
                top: 0,
                background: COLORS.panelBg,
                zIndex: 1,
              }}>
                <span style={{
                  color: COLORS.amber,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {region.label}
                </span>
                <div style={{
                  flex: 1,
                  height: 1,
                  background: `linear-gradient(90deg, ${COLORS.amberDim}40, transparent)`,
                }} />
                <span style={{
                  color: COLORS.textDim,
                  fontSize: 9,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {region.contacts.length} contact{region.contacts.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Scrollable contact cards row */}
              <div style={{
                display: "flex",
                gap: 8,
                padding: "4px 16px 12px",
                overflowX: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: `${COLORS.wireframe} transparent`,
              }}>
                {region.contacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))}
              </div>

              {regionIdx < selectedRegions.length - 1 && <ScanDivider />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// OVERLAY UI (top-left stats, top-right legend)
// ════════════════════════════════════════════════════════════════════════════════

function GlobeOverlay({ regions }: { regions: RegionState[] }) {
  const activeCount = regions.filter((r) => r.contacts.length > 0).length;
  const totalContacts = regions.reduce((s, r) => s + r.contacts.length, 0);
  const selectedCount = regions.filter((r) => r.selected).length;

  return (
    <>
      {/* Top-left status block */}
      <div style={{
        position: "absolute",
        top: 20,
        left: 20,
        zIndex: 100,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        pointerEvents: "none",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}>
          <div style={{
            width: 2,
            height: 18,
            background: COLORS.amber,
            boxShadow: `0 0 10px ${COLORS.amberGlow}`,
          }} />
          <span style={{
            color: COLORS.amber,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}>
            Contact Intelligence
          </span>
        </div>
        <div style={{
          background: "rgba(6,9,20,0.85)",
          border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: 4,
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
        }}>
          {[
            ["NODES", totalContacts.toString()],
            ["REGIONS", activeCount.toString()],
            ["SELECTED", selectedCount > 0 ? selectedCount.toString() : "—"],
          ].map(([label, val]) => (
            <div key={label} style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              marginBottom: 3,
            }}>
              <span style={{ color: COLORS.textDim, fontSize: 9, letterSpacing: "0.12em" }}>
                {label}
              </span>
              <span style={{
                color: label === "SELECTED" && selectedCount > 0 ? COLORS.amber : COLORS.text,
                fontSize: 9,
                fontWeight: 700,
              }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top-right instructions */}
      <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 100,
        fontFamily: "'JetBrains Mono', monospace",
        pointerEvents: "none",
        textAlign: "right",
      }}>
        <div style={{
          background: "rgba(6,9,20,0.85)",
          border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: 4,
          padding: "8px 12px",
          backdropFilter: "blur(8px)",
        }}>
          {[
            ["DRAG", "Rotate globe"],
            ["SCROLL", "Zoom"],
            ["CLICK", "Select region"],
            ["MULTI", "Ctrl+click"],
          ].map(([key, desc]) => (
            <div key={key} style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginBottom: 3,
              alignItems: "center",
            }}>
              <span style={{ color: COLORS.textDim, fontSize: 9 }}>{desc}</span>
              <span style={{
                color: COLORS.amber,
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.12em",
                background: "rgba(212,168,67,0.08)",
                border: `1px solid ${COLORS.amberDim}`,
                padding: "1px 5px",
                borderRadius: 2,
              }}>
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

const GlobeWidget: React.FC<GlobeWidgetProps> = ({
  contacts,
  height = 600,
  onContactClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [regions, setRegions] = useState<RegionState[]>([]);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [ready, setReady] = useState(false);

  // ── Build region index from contacts ───────────────────────────────────────
  const regionIndex = useMemo(() => {
    const index: Record<string, RegionState> = {};

    contacts.forEach((contact) => {
      // ← ADAPT: if your field is contact.country_name or similar, change below
      const meta = normalizeCountry(contact.country);
      if (!meta) return;

      if (!index[meta.iso]) {
        index[meta.iso] = {
          iso: meta.iso,
          label: meta.label,
          lat: meta.lat,
          lng: meta.lng,
          contacts: [],
          selected: false,
          hovered: false,
        };
      }
      index[meta.iso].contacts.push(contact);
    });

    return index;
  }, [contacts]);

  // Sync region index → state on first build
  useEffect(() => {
    setRegions(Object.values(regionIndex));
  }, [regionIndex]);

  // ── Load TopoJSON world data ────────────────────────────────────────────────
  useEffect(() => {
    fetch("https://unpkg.com/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const geo = feature(topo, topo.objects.countries);
        setGeoJson(geo);
      })
      .catch(() => {
        // Fallback: try alternative CDN
        fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
          .then((r) => r.json())
          .then((topo) => {
            const geo = feature(topo, topo.objects.countries);
            setGeoJson(geo);
          });
      });
  }, []);

  // ── ISO numeric → alpha-3 lookup (Natural Earth / world-110m numeric IDs) ─
  // world-110m uses numeric ISO codes; we need to map them to our alpha-3 keys.
  const ISO_NUMERIC_TO_A3: Record<string, string> = useMemo(() => ({
    "032": "ARG", "036": "AUS", "076": "BRA", "124": "CAN", "152": "CHL",
    "156": "CHN", "170": "COL", "191": "HRV", "218": "ECU", "250": "FRA",
    "276": "DEU", "356": "IND", "360": "IDN", "376": "ISR", "380": "ITA",
    "392": "JPN", "484": "MEX", "528": "NLD", "554": "NZL", "566": "NGA",
    "586": "PAK", "591": "PAN", "604": "PER", "630": "PRI", "643": "RUS",
    "682": "SAU", "710": "ZAF", "724": "ESP", "756": "CHE", "792": "TUR",
    "784": "ARE", "826": "GBR", "840": "USA", "858": "URY", "862": "VEN",
    "040": "AUT", "056": "BEL", "203": "CZE", "208": "DNK", "246": "FIN",
    "300": "GRC", "348": "HUN", "372": "IRL", "578": "NOR", "616": "POL",
    "620": "PRT", "752": "SWE", "804": "UKR",
  }), []);

  // ── Initialize globe ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !geoJson) return;

    const el = containerRef.current;
    const w = el.offsetWidth || 800;
    const h = height;

    const globe = new Globe(el, { animateIn: false } as any);
    globeRef.current = globe;

    // ── Visual settings ──
    globe
      .width(w)
      .height(h)
      .backgroundColor(COLORS.bg)
      .showAtmosphere(true)
      .atmosphereColor("rgba(30,80,180,0.12)")
      .atmosphereAltitude(0.12);

    // ── Globe surface: near-black, no texture ──
    globe.globeImageUrl(""); // clear any default texture
    // Use a dark solid color via the built-in globe material
    setTimeout(() => {
      try {
        const scene = (globe as any).scene?.();
        if (scene) {
          scene.traverse((obj: any) => {
            if (obj.isMesh && obj.geometry?.type === "SphereGeometry") {
              obj.material.color?.setHex(0x070910);
              obj.material.emissive?.setHex(0x020308);
            }
          });
        }
      } catch (_) {}
    }, 200);

    // ── Polygons: wireframe countries ──
    globe
      .polygonsData(geoJson.features)
      .polygonAltitude(0.006)
      .polygonCapColor((feat: any) => {
        const numId = String(feat.id).padStart(3, "0");
        const a3 = ISO_NUMERIC_TO_A3[numId];
        if (!a3) return COLORS.regionDefault;

        const region = Object.values(regionIndex).find((r) => r.iso === a3);
        if (!region) return COLORS.regionDefault;
        if (region.selected) return COLORS.regionSelected;
        if (region.hovered) return COLORS.regionHover;
        return "rgba(18,30,60,0.85)";
      })
      .polygonSideColor(() => "rgba(10,20,50,0.4)")
      .polygonStrokeColor((feat: any) => {
        const numId = String(feat.id).padStart(3, "0");
        const a3 = ISO_NUMERIC_TO_A3[numId];
        if (!a3) return COLORS.wireframe;
        const region = Object.values(regionIndex).find((r) => r.iso === a3);
        if (!region) return COLORS.wireframe;
        if (region.selected) return COLORS.regionSelectedStroke;
        if (region.hovered) return COLORS.regionHoverStroke;
        if (region.contacts.length > 0) return "#2a5090";
        return COLORS.wireframe;
      })
      .polygonLabel((feat: any) => {
        const numId = String(feat.id).padStart(3, "0");
        const a3 = ISO_NUMERIC_TO_A3[numId];
        if (!a3) return "";
        const region = Object.values(regionIndex).find((r) => r.iso === a3);
        if (!region || region.contacts.length === 0) return "";
        return `
          <div style="
            background: rgba(6,9,20,0.95);
            border: 1px solid #d4a843;
            border-radius: 3px;
            padding: 6px 10px;
            font-family: 'JetBrains Mono', monospace;
            pointer-events: none;
          ">
            <div style="color:#d4a843;font-size:10px;font-weight:700;letter-spacing:0.15em;margin-bottom:3px;">
              ${region.label.toUpperCase()}
            </div>
            <div style="color:#c8d8f0;font-size:9px;letter-spacing:0.08em;">
              ${region.contacts.length} CONTACT${region.contacts.length !== 1 ? "S" : ""}
            </div>
          </div>
        `;
      })
      .onPolygonHover((feat: any) => {
        if (!feat) {
          setRegions((prev) =>
            prev.map((r) => ({ ...r, hovered: false }))
          );
          return;
        }
        const numId = String((feat as any).id).padStart(3, "0");
        const a3 = ISO_NUMERIC_TO_A3[numId];
        setRegions((prev) =>
          prev.map((r) => ({
            ...r,
            hovered: r.iso === a3 && r.contacts.length > 0,
          }))
        );
      })
      .onPolygonClick((feat: any, _ev: MouseEvent, coords: any) => {
        const numId = String((feat as any).id).padStart(3, "0");
        const a3 = ISO_NUMERIC_TO_A3[numId];
        if (!a3) return;

        const region = Object.values(regionIndex).find((r) => r.iso === a3);
        if (!region || region.contacts.length === 0) return;

        const multiSelect = (_ev as MouseEvent).ctrlKey || (_ev as MouseEvent).metaKey;

        setRegions((prev) =>
          prev.map((r) => {
            if (r.iso === a3) return { ...r, selected: !r.selected };
            if (!multiSelect) return { ...r, selected: false };
            return r;
          })
        );

        // Fly to clicked region
        globe.pointOfView(
          { lat: region.lat, lng: region.lng, altitude: 1.8 },
          800
        );
      });

    // ── Points: amber dots on contact regions ──
    const dots = Object.values(regionIndex).map((r) => ({
      lat: r.lat,
      lng: r.lng,
      size: Math.min(0.3 + r.contacts.length * 0.012, 0.7),
      color: COLORS.dotPulse,
      label: r.label,
      count: r.contacts.length,
    }));

    globe
      .pointsData(dots)
      .pointAltitude(0.015)
      .pointRadius((d: any) => d.size)
      .pointColor(() => COLORS.amber)
      .pointsMerge(false);

    // ── Rings: pulsing amber rings on contact regions ──
    globe
      .ringsData(Object.values(regionIndex).map((r) => ({
        lat: r.lat,
        lng: r.lng,
        maxR: 3 + r.contacts.length * 0.15,
        propagationSpeed: 1.5,
        repeatPeriod: 1200 + Math.random() * 400,
      })))
      .ringColor(() => (t: number) =>
        `rgba(212,168,67,${Math.max(0, 0.35 * (1 - t))})`
      )
      .ringMaxRadius("maxR")
      .ringPropagationSpeed("propagationSpeed")
      .ringRepeatPeriod("repeatPeriod");

    // ── Arcs: relationship connections between regions sharing org/group ──
    const arcData: Array<{
      startLat: number; startLng: number;
      endLat: number; endLng: number;
      color: string;
    }> = [];
    const regionArr = Object.values(regionIndex);
    // Build org→regions and group→regions maps
    const orgRegions: Record<string, Set<string>> = {};
    const groupRegions: Record<string, Set<string>> = {};
    regionArr.forEach(r => {
      r.contacts.forEach(c => {
        if (c.organization) {
          if (!orgRegions[c.organization]) orgRegions[c.organization] = new Set();
          orgRegions[c.organization].add(r.iso);
        }
        if (c.group) {
          if (!groupRegions[c.group]) groupRegions[c.group] = new Set();
          groupRegions[c.group].add(r.iso);
        }
      });
    });
    // Create arcs between connected regions
    const arcPairs = new Set<string>();
    const addArcs = (regionMap: Record<string, Set<string>>, color: string) => {
      Object.values(regionMap).forEach(isoSet => {
        const isos = Array.from(isoSet);
        for (let i = 0; i < isos.length; i++) {
          for (let j = i + 1; j < isos.length; j++) {
            const key = [isos[i], isos[j]].sort().join("-");
            if (arcPairs.has(key)) continue;
            arcPairs.add(key);
            const rA = regionArr.find(r => r.iso === isos[i]);
            const rB = regionArr.find(r => r.iso === isos[j]);
            if (rA && rB) {
              arcData.push({
                startLat: rA.lat, startLng: rA.lng,
                endLat: rB.lat, endLng: rB.lng,
                color,
              });
            }
          }
        }
      });
    };
    addArcs(orgRegions, "rgba(212,168,67,0.35)");  // amber for org connections
    addArcs(groupRegions, "rgba(96,165,250,0.25)"); // blue for group connections

    if (arcData.length > 0) {
      globe
        .arcsData(arcData)
        .arcColor((d: any) => d.color)
        .arcAltitude(0.15)
        .arcStroke(0.4)
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(2500);
    }

    // ── Initial camera: full world auto-rotate ──
    globe.pointOfView({ lat: 20, lng: -20, altitude: 2.5 });

    // Auto-rotate
    let rotationFrame: number = 0;
    let isDragging = false;
    const controls = (globe as any).controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.25;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 150;
      controls.maxDistance = 600;

      el.addEventListener("mousedown", () => {
        isDragging = true;
        if (controls) controls.autoRotate = false;
      });
      el.addEventListener("mouseup", () => {
        isDragging = false;
        // Resume auto-rotate after 4 seconds of no interaction
        setTimeout(() => {
          if (!isDragging && controls) controls.autoRotate = true;
        }, 4000);
      });
    }

    // ── Resize observer ──
    const observer = new ResizeObserver(() => {
      const newW = el.offsetWidth;
      globe.width(newW);
    });
    observer.observe(el);

    setReady(true);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rotationFrame);
      try { el.innerHTML = ""; } catch (_) {}
    };
  }, [geoJson, regionIndex]);

  // ── Re-color polygons on region state change ───────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;
    // Trigger re-render by refreshing polygon data
    globe.polygonsData(geoJson?.features ?? []);
  }, [regions, geoJson]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDeselect = useCallback((iso: string) => {
    setRegions((prev) =>
      prev.map((r) => (r.iso === iso ? { ...r, selected: false } : r))
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setRegions((prev) => prev.map((r) => ({ ...r, selected: false })));
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: COLORS.bg,
        overflow: "hidden",
        borderRadius: 8,
        border: `1px solid ${COLORS.panelBorder}`,
        boxShadow: "0 0 60px rgba(0,0,0,0.8), inset 0 0 120px rgba(0,10,30,0.5)",
      }}
    >
      {/* Scanline texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
        }}
      />

      {/* Corner brackets — military HUD aesthetic */}
      {[
        { top: 8, left: 8, rotate: "0deg" },
        { top: 8, right: 8, rotate: "90deg" },
        { bottom: 8, right: 8, rotate: "180deg" },
        { bottom: 8, left: 8, rotate: "270deg" },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            zIndex: 10,
            width: 16,
            height: 16,
            pointerEvents: "none",
            ...pos,
            transform: `rotate(${pos.rotate})`,
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 16,
            height: 2,
            background: COLORS.amber,
            opacity: 0.6,
          }} />
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2,
            height: 16,
            background: COLORS.amber,
            opacity: 0.6,
          }} />
        </div>
      ))}

      {/* Globe container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
        }}
      />

      {/* Overlay UI */}
      {ready && <GlobeOverlay regions={regions} />}

      {/* Loading state */}
      {!ready && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          zIndex: 50,
        }}>
          <div style={{
            width: 32,
            height: 32,
            border: `2px solid ${COLORS.wireframe}`,
            borderTopColor: COLORS.amber,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{
            color: COLORS.textDim,
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}>
            Initializing…
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Bottom contact panel */}
      <ContactPanel
        regions={regions}
        onDeselect={handleDeselect}
        onClearAll={handleClearAll}
      />
    </div>
  );
};

export default GlobeWidget;