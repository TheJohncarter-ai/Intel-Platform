import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-open-id",
    email: "Powelljohn9521@gmail.com",
    name: "John Powell",
    loginMethod: "google",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-open-id",
    email: "testuser@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Phase 3 features", () => {
  describe("contacts.update", () => {
    it("updates a contact's fields", async () => {
      const caller = appRouter.createCaller(createUserContext());
      // Get a contact first
      const contacts = await caller.contacts.list();
      expect(contacts.length).toBeGreaterThan(0);
      const first = contacts[0]!;

      // Update it
      const updated = await caller.contacts.update({
        id: first.id,
        role: "Updated Role Test",
      });
      expect(updated.role).toBe("Updated Role Test");

      // Restore original
      await caller.contacts.update({
        id: first.id,
        role: first.role ?? undefined,
      });
    });
  });

  describe("contacts.research", () => {
    it("generates an LLM research note for a contact", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const contacts = await caller.contacts.list();
      expect(contacts.length).toBeGreaterThan(0);
      const first = contacts[0]!;

      // Research should create a note (returns the full note object)
      const result = await caller.contacts.research({ id: first.id });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("noteType", "research");
      expect(typeof result.id).toBe("number");
    }, 30000); // LLM can take time
  });

  describe("admin.stats", () => {
    it("returns platform statistics for admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const stats = await caller.admin.stats();
      expect(stats).toHaveProperty("totalContacts");
      expect(stats).toHaveProperty("totalWhitelisted");
      expect(stats).toHaveProperty("pendingRequests");
      expect(stats).toHaveProperty("totalNotes");
      expect(stats).toHaveProperty("recentActivity");
      expect(typeof stats.totalContacts).toBe("number");
      expect(stats.totalContacts).toBeGreaterThanOrEqual(35);
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.admin.stats()).rejects.toThrow();
    });
  });

  describe("admin.invite", () => {
    it("adds email to whitelist and logs invite", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const testEmail = `test-invite-${Date.now()}@example.com`;

      const result = await caller.admin.invite({
        email: testEmail,
        message: "Welcome to the platform!",
      });
      expect(result).toHaveProperty("success", true);

      // Verify the email is in the whitelist
      const whitelist = await caller.admin.whitelist.list();
      const found = whitelist.find((e: { email: string }) => e.email === testEmail);
      expect(found).toBeDefined();

      // Clean up
      await caller.admin.whitelist.remove({ email: testEmail });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.admin.invite({ email: "test@example.com" })
      ).rejects.toThrow();
    });
  });
});
