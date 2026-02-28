import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("Phase 4 — Arcs, CSV, Last Contacted", () => {
  describe("contacts.stale", () => {
    it("returns an array of stale contacts", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.contacts.stale({ daysSince: 30 });
      expect(Array.isArray(result)).toBe(true);
      // All 35 contacts should be stale since none have been contacted
      expect(result.length).toBeGreaterThan(0);
    });

    it("accepts custom daysSince parameter", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.contacts.stale({ daysSince: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("contacts.exportCsv", () => {
    it("returns a CSV string with headers", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const csv = await caller.contacts.exportCsv();
      expect(typeof csv).toBe("string");
      expect(csv.length).toBeGreaterThan(0);
      const lines = csv.split("\n");
      expect(lines[0]).toBe("name,role,organization,location,group,tier,email,phone,notes,linkedinUrl");
      expect(lines.length).toBeGreaterThan(1); // At least header + 1 data row
    });

    it("contains contact data in CSV rows", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const csv = await caller.contacts.exportCsv();
      const lines = csv.split("\n");
      // Should have 35 contacts + 1 header = 36 lines
      expect(lines.length).toBeGreaterThanOrEqual(36);
    });
  });

  describe("contacts.importCsv", () => {
    it("imports contacts from CSV content", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const csvContent = `name,role,organization,location
Test Import Person,CEO,Test Corp,New York, United States
Another Person,CTO,Another Corp,London, United Kingdom`;
      const result = await caller.contacts.importCsv({ csvContent });
      expect(result.imported).toBe(2);
    });

    it("rejects CSV without name column", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const csvContent = `role,organization\nCEO,Test Corp`;
      await expect(caller.contacts.importCsv({ csvContent })).rejects.toThrow("name");
    });

    it("rejects CSV with only header", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const csvContent = `name,role`;
      await expect(caller.contacts.importCsv({ csvContent })).rejects.toThrow();
    });
  });

  describe("contacts.list includes lastContacted", () => {
    it("returns contacts with lastContacted field", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const contacts = await caller.contacts.list();
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
      // Each contact should have lastContacted field (may be null)
      contacts.forEach(c => {
        expect(c).toHaveProperty("lastContacted");
      });
    });
  });
});
