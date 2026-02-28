import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────

type CookieCall = { name: string; options: Record<string, unknown> };

function createContext(overrides: {
  email?: string;
  name?: string;
  role?: "user" | "admin";
  authenticated?: boolean;
} = {}): TrpcContext {
  const {
    email = "testuser@example.com",
    name = "Test User",
    role = "user",
    authenticated = true,
  } = overrides;

  const clearedCookies: CookieCall[] = [];

  if (!authenticated) {
    return {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (n: string, o: Record<string, unknown>) => clearedCookies.push({ name: n, options: o }),
      } as TrpcContext["res"],
    };
  }

  return {
    user: {
      id: 1,
      openId: "test-open-id",
      email,
      name,
      loginMethod: "google",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (n: string, o: Record<string, unknown>) => clearedCookies.push({ name: n, options: o }),
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ──────────────────────────────────────────────────────

describe("auth.checkAccess", () => {
  it("returns whitelisted and isAdmin for authenticated user", async () => {
    const ctx = createContext({ email: "someone@example.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.checkAccess();
    expect(result).toHaveProperty("whitelisted");
    expect(result).toHaveProperty("isAdmin");
    expect(typeof result.whitelisted).toBe("boolean");
    expect(typeof result.isAdmin).toBe("boolean");
  });

  it("identifies admin email correctly", async () => {
    const ctx = createContext({ email: "Powelljohn9521@gmail.com", role: "admin" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.checkAccess();
    expect(result.isAdmin).toBe(true);
  });

  it("non-admin email is not admin", async () => {
    const ctx = createContext({ email: "regular@example.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.checkAccess();
    expect(result.isAdmin).toBe(false);
  });
});

// ─── Contacts Tests ──────────────────────────────────────────────────

describe("contacts", () => {
  it("list returns an array", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const contacts = await caller.contacts.list();
    expect(Array.isArray(contacts)).toBe(true);
  });

  it("getById returns a contact or undefined", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const contact = await caller.contacts.getById({ id: 1 });
    // May or may not exist depending on DB state
    if (contact) {
      expect(contact).toHaveProperty("id");
      expect(contact).toHaveProperty("name");
    }
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createContext({ authenticated: false });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.contacts.list()).rejects.toThrow();
  });
});

// ─── Access Requests Tests ───────────────────────────────────────────

describe("accessRequests", () => {
  it("myStatus returns pending status for authenticated user", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accessRequests.myStatus();
    expect(result).toHaveProperty("hasPending");
    expect(typeof result!.hasPending).toBe("boolean");
  });

  it("rejects unauthenticated myStatus", async () => {
    const ctx = createContext({ authenticated: false });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.accessRequests.myStatus()).rejects.toThrow();
  });
});

// ─── Admin Tests ─────────────────────────────────────────────────────

describe("admin", () => {
  it("whitelist.list requires admin role", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.whitelist.list()).rejects.toThrow();
  });

  it("whitelist.list works for admin", async () => {
    const ctx = createContext({ role: "admin", email: "Powelljohn9521@gmail.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.whitelist.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("requests.list requires admin role", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.requests.list()).rejects.toThrow();
  });

  it("auditLog.list requires admin role", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.auditLog.list({ page: 1, pageSize: 10 })).rejects.toThrow();
  });

  it("auditLog.list works for admin with pagination", async () => {
    const ctx = createContext({ role: "admin", email: "Powelljohn9521@gmail.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.auditLog.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("entries");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.entries)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("auditLog.list supports action filter", async () => {
    const ctx = createContext({ role: "admin", email: "Powelljohn9521@gmail.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.auditLog.list({ action: "profile_view", page: 1, pageSize: 10 });
    expect(result).toHaveProperty("entries");
    // All entries should be profile_view
    for (const entry of result.entries) {
      expect(entry.action).toBe("profile_view");
    }
  });
});

// ─── Meeting Notes Tests ─────────────────────────────────────────────

describe("notes", () => {
  it("listByContact returns array for authenticated user", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const notes = await caller.notes.listByContact({ contactId: 1 });
    expect(Array.isArray(notes)).toBe(true);
  });

  it("rejects unauthenticated note listing", async () => {
    const ctx = createContext({ authenticated: false });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notes.listByContact({ contactId: 1 })).rejects.toThrow();
  });

  it("add creates a note and returns it", async () => {
    const ctx = createContext({ email: "testuser@example.com", name: "Test User" });
    const caller = appRouter.createCaller(ctx);
    const note = await caller.notes.add({
      contactId: 1,
      noteType: "meeting",
      content: "Test meeting note from vitest",
    });
    expect(note).toHaveProperty("id");
    expect(note.content).toBe("Test meeting note from vitest");
    expect(note.noteType).toBe("meeting");
    expect(note.authorEmail).toBe("testuser@example.com");

    // Clean up
    await caller.notes.delete({ id: note.id });
  });

  it("delete removes a note", async () => {
    const ctx = createContext({ email: "testuser@example.com", name: "Test User" });
    const caller = appRouter.createCaller(ctx);
    // Create
    const note = await caller.notes.add({
      contactId: 1,
      noteType: "general",
      content: "Note to be deleted",
    });
    // Delete
    const result = await caller.notes.delete({ id: note.id });
    expect(result.success).toBe(true);
    // Verify gone
    const notes = await caller.notes.listByContact({ contactId: 1 });
    expect(notes.find((n) => n.id === note.id)).toBeUndefined();
  });
});
