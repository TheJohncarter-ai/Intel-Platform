import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("extended network", () => {
  it("extendedNetwork query returns an array (possibly empty for new contacts)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.contacts.extendedNetwork({ id: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("extendedNetwork query returns empty array for non-existent contact", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.contacts.extendedNetwork({ id: 999999 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("researchNetwork mutation researches a real contact and returns associates", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // Use contact ID 1 which should exist in the seeded data
    const result = await caller.contacts.researchNetwork({ id: 1 });
    expect(Array.isArray(result)).toBe(true);
    // LLM should return some associates
    expect(result.length).toBeGreaterThan(0);
    // Each associate should have required fields
    for (const assoc of result) {
      expect(assoc).toHaveProperty("associateName");
      expect(assoc).toHaveProperty("contactId");
      expect(typeof assoc.associateName).toBe("string");
      expect(assoc.associateName.length).toBeGreaterThan(0);
      expect(assoc.contactId).toBe(1);
    }
  }, 30000); // 30s timeout for LLM call

  it("researchNetwork caches results that are retrievable via extendedNetwork query", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    // After the previous test, contact 1 should have cached results
    const cached = await caller.contacts.extendedNetwork({ id: 1 });
    expect(Array.isArray(cached)).toBe(true);
    expect(cached.length).toBeGreaterThan(0);
    // Verify cached entries have proper structure
    for (const entry of cached) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("contactId");
      expect(entry).toHaveProperty("associateName");
      expect(entry).toHaveProperty("associateRole");
      expect(entry).toHaveProperty("associateOrg");
      expect(entry).toHaveProperty("connectionReason");
      expect(entry).toHaveProperty("connectionType");
      expect(entry).toHaveProperty("confidence");
      expect(entry).toHaveProperty("createdAt");
    }
  });

  it("associate entries have valid confidence values", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const cached = await caller.contacts.extendedNetwork({ id: 1 });
    for (const entry of cached) {
      expect(["high", "medium", "low"]).toContain(entry.confidence);
    }
  });

  it("researchNetwork throws for non-existent contact", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.contacts.researchNetwork({ id: 999999 })).rejects.toThrow("Contact not found");
  });
});
