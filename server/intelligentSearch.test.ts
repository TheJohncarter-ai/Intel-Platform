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
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("contacts.intelligentSearch", () => {
  it("exists as a mutation on the router", () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Verify the procedure exists and is callable
    expect(typeof caller.contacts.intelligentSearch).toBe("function");
  });

  it("rejects empty question", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.contacts.intelligentSearch({ question: "" })
    ).rejects.toThrow();
  });

  it("rejects question exceeding max length", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const longQuestion = "a".repeat(1001);
    await expect(
      caller.contacts.intelligentSearch({ question: longQuestion })
    ).rejects.toThrow();
  });
});
