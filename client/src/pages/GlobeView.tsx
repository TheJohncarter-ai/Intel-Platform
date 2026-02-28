// ============================================================
// DESIGN: Intelligence Dossier — Globe / Map view
// Interactive Google Maps with contact markers by geography
// ============================================================

import { useRef, useState } from "react";
import Layout from "@/components/Layout";
import { MapView } from "@/components/Map";
import { CONTACTS } from "@/data/contacts";
import { Link } from "wouter";
import { MapPin, Users, X, ExternalLink, Mail, Linkedin } from "lucide-react";

// Approximate lat/lng for each contact by location string
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  "Colombia": { lat: 4.7110, lng: -74.0721 },
  "Bogotá, Colombia": { lat: 4.6097, lng: -74.0817 },
  "Medellín, Colombia": { lat: 6.2442, lng: -75.5812 },
  "Cali, Colombia": { lat: 3.4516, lng: -76.5320 },
  "New York, USA": { lat: 40.7128, lng: -74.0060 },
  "Miami, USA": { lat: 25.7617, lng: -80.1918 },
  "San Francisco, USA": { lat: 37.7749, lng: -122.4194 },
  "London, UK": { lat: 51.5074, lng: -0.1278 },
  "Madrid, Spain": { lat: 40.4168, lng: -3.7038 },
  "Mexico City, Mexico": { lat: 19.4326, lng: -99.1332 },
  "São Paulo, Brazil": { lat: -23.5505, lng: -46.6333 },
  "Lima, Peru": { lat: -12.0464, lng: -77.0428 },
  "Santiago, Chile": { lat: -33.4489, lng: -70.6693 },
  "Buenos Aires, Argentina": { lat: -34.6037, lng: -58.3816 },
  "Panama City, Panama": { lat: 8.9936, lng: -79.5197 },
  "LATAM": { lat: 0, lng: -60 },
  "International": { lat: 20, lng: 0 },
};

function getCoords(location?: string): { lat: number; lng: number } | null {
  if (!location) return null;
  // Direct match
  if (LOCATION_COORDS[location]) return LOCATION_COORDS[location];
  // Partial match
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (location.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(location.toLowerCase())) {
      return coords;
    }
  }
  // Default Colombia if nothing found but has Colombian name context
  return { lat: 4.7110, lng: -74.0721 };
}

export default function GlobeView() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedContact, setSelectedContact] = useState<typeof CONTACTS[0] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const contactsWithCoords = CONTACTS.map((c) => ({
    ...c,
    coords: getCoords(c.location),
  })).filter((c) => c.coords !== null);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);

    // Create markers for each contact
    contactsWithCoords.forEach((contact) => {
      if (!contact.coords) return;

      const pin = document.createElement("div");
      pin.className = "contact-map-pin";
      pin.style.cssText = `
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: oklch(0.80 0.135 72);
        border: 2px solid oklch(0.90 0.005 75 / 0.8);
        box-shadow: 0 0 8px oklch(0.80 0.135 72 / 0.6);
        cursor: pointer;
        transition: transform 0.15s ease;
      `;
      pin.addEventListener("mouseenter", () => {
        pin.style.transform = "scale(1.5)";
      });
      pin.addEventListener("mouseleave", () => {
        pin.style.transform = "scale(1)";
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: contact.coords!,
        content: pin,
        title: contact.name,
      });

      marker.addListener("click", () => {
        setSelectedContact(contact);
        map.panTo(contact.coords!);
        map.setZoom(Math.max(map.getZoom() ?? 4, 6));
      });

      markersRef.current.push(marker);
    });
  };

  const groupCounts = {
    "colombian-vc": CONTACTS.filter((c) => c.group === "colombian-vc").length,
    "general": CONTACTS.filter((c) => c.group === "general").length,
    "business-card": CONTACTS.filter((c) => c.group === "business-card").length,
  };

  return (
    <Layout>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between max-w-6xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-primary" />
              <h1 className="font-display text-xl text-foreground">Globe View</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {contactsWithCoords.length} contacts mapped across Latin America and beyond
            </p>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/80" />
              <span>Contact location</span>
            </div>
            <div className="flex items-center gap-4 border-l border-border pl-4">
              <span>{groupCounts["colombian-vc"]} Colombian VC</span>
              <span>{groupCounts["general"]} General</span>
              <span>{groupCounts["business-card"]} Business Card</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="relative">
        <MapView
          className="w-full"
          style={{ height: "calc(100vh - 10rem)" }}
          initialCenter={{ lat: 4.7110, lng: -74.0721 }}
          initialZoom={5}
          onMapReady={handleMapReady}
        />

        {/* Contact info panel */}
        {selectedContact && (
          <div className="absolute top-4 right-4 w-72 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-sm text-primary/80">
                    {selectedContact.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm text-foreground truncate">{selectedContact.name}</p>
                  <p className="text-[0.65rem] text-primary/70 truncate">{selectedContact.organization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-foreground/80 mb-1">{selectedContact.role}</p>
            {selectedContact.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <MapPin size={10} />
                {selectedContact.location}
              </div>
            )}

            {selectedContact.bio && (
              <p className="text-[0.7rem] text-muted-foreground leading-relaxed mb-3 line-clamp-3">
                {selectedContact.bio}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              {(selectedContact.bio || (selectedContact.career && selectedContact.career.length > 0)) && (
                <Link href={`/profile/${selectedContact.id}`}>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs">
                    <ExternalLink size={10} />
                    View Dossier
                  </span>
                </Link>
              )}
              {selectedContact.email && (
                <a
                  href={`mailto:${selectedContact.email}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs border border-amber-500/20"
                >
                  <Mail size={10} />
                  Email
                </a>
              )}
              {selectedContact.linkedin && (
                <a
                  href={selectedContact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-accent text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-xs"
                >
                  <Linkedin size={10} />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}

        {/* Contacts list overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-8 pb-3 px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="font-mono-label text-[0.6rem] text-muted-foreground/60 flex-shrink-0 flex items-center gap-1">
              <Users size={10} />
              CONTACTS
            </span>
            {CONTACTS.slice(0, 20).map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  const coords = getCoords(contact.location);
                  if (coords && mapRef.current) {
                    mapRef.current.panTo(coords);
                    mapRef.current.setZoom(7);
                    setSelectedContact(contact);
                  }
                }}
                className="flex-shrink-0 px-2.5 py-1 rounded-md bg-card/80 border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all duration-150 backdrop-blur-sm"
              >
                {contact.name.split(" ")[0]}
              </button>
            ))}
            {CONTACTS.length > 20 && (
              <span className="flex-shrink-0 text-xs text-muted-foreground/50 font-mono-label">
                +{CONTACTS.length - 20} more
              </span>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
