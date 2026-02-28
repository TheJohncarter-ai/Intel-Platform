import { describe, expect, it } from "vitest";

/**
 * Test the country extraction logic used by the Home page
 * to map contact.location → contact.country for the GlobeWidget.
 */
function extractCountry(location: string | null | undefined): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || undefined;
}

describe("extractCountry", () => {
  it("extracts country from 'City, Country' format", () => {
    expect(extractCountry("Bogotá, Colombia")).toBe("Colombia");
    expect(extractCountry("New York, United States")).toBe("United States");
    expect(extractCountry("London, United Kingdom")).toBe("United Kingdom");
    expect(extractCountry("Dubai, UAE")).toBe("UAE");
  });

  it("handles single-value locations (just country)", () => {
    expect(extractCountry("Colombia")).toBe("Colombia");
    expect(extractCountry("Mexico")).toBe("Mexico");
  });

  it("handles 'City, State, Country' format", () => {
    expect(extractCountry("San Francisco, CA, United States")).toBe("United States");
  });

  it("returns undefined for null/undefined/empty", () => {
    expect(extractCountry(null)).toBeUndefined();
    expect(extractCountry(undefined)).toBeUndefined();
    expect(extractCountry("")).toBeUndefined();
  });

  it("trims whitespace", () => {
    expect(extractCountry("  Bogotá ,  Colombia  ")).toBe("Colombia");
  });
});

describe("contact to globe mapping", () => {
  it("maps DB contact fields to GlobeWidget contact shape", () => {
    const dbContact = {
      id: 1,
      name: "Alejandro Restrepo",
      role: "Managing Partner",
      organization: "Bogotá Ventures",
      location: "Bogotá, Colombia",
      group: "Colombian VC",
      tier: "Tier 1",
      email: "test@test.com",
      phone: "+57 310 555 0101",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const globeContact = {
      id: dbContact.id,
      name: dbContact.name,
      role: dbContact.role ?? undefined,
      organization: dbContact.organization ?? undefined,
      country: extractCountry(dbContact.location),
      group: dbContact.group ?? undefined,
      tier: dbContact.tier ?? undefined,
    };

    expect(globeContact.id).toBe(1);
    expect(globeContact.name).toBe("Alejandro Restrepo");
    expect(globeContact.role).toBe("Managing Partner");
    expect(globeContact.organization).toBe("Bogotá Ventures");
    expect(globeContact.country).toBe("Colombia");
    expect(globeContact.group).toBe("Colombian VC");
    expect(globeContact.tier).toBe("Tier 1");
  });

  it("handles contacts with null optional fields", () => {
    const dbContact = {
      id: 2,
      name: "Test User",
      role: null,
      organization: null,
      location: null,
      group: null,
      tier: null,
      email: null,
      phone: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const globeContact = {
      id: dbContact.id,
      name: dbContact.name,
      role: dbContact.role ?? undefined,
      organization: dbContact.organization ?? undefined,
      country: extractCountry(dbContact.location),
      group: dbContact.group ?? undefined,
      tier: dbContact.tier ?? undefined,
    };

    expect(globeContact.id).toBe(2);
    expect(globeContact.name).toBe("Test User");
    expect(globeContact.role).toBeUndefined();
    expect(globeContact.organization).toBeUndefined();
    expect(globeContact.country).toBeUndefined();
    expect(globeContact.group).toBeUndefined();
    expect(globeContact.tier).toBeUndefined();
  });
});
