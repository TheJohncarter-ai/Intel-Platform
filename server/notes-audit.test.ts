import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "testuser@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createMockContext({
    id: 99,
    openId: "admin-user",
    email: "powelljohn9521@gmail.com",
    name: "Admin",
    role: "admin",
  });
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("notes.create", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.notes.create({
        contactId: 1,
        contactName: "Test Contact",
        noteType: "meeting",
        content: "Test note content",
      })
    ).rejects.toThrow();
  });

  it("creates a note for an authenticated user", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.notes.create({
      contactId: 1,
      contactName: "Alejandro Arenas",
      noteType: "meeting",
      content: "Discussed partnership opportunities in Bogotá.",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeGreaterThan(0);
  });

  it("rejects empty content", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(
      caller.notes.create({
        contactId: 1,
        contactName: "Test Contact",
        noteType: "general",
        content: "",
      })
    ).rejects.toThrow();
  });

  it("supports all note types", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const types = ["meeting", "interaction", "follow_up", "general"] as const;
    for (const noteType of types) {
      const result = await caller.notes.create({
        contactId: 2,
        contactName: "Test Contact",
        noteType,
        content: `Test ${noteType} note`,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("notes.list", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(caller.notes.list({ contactId: 1 })).rejects.toThrow();
  });

  it("returns notes for a contact", async () => {
    const caller = appRouter.createCaller(createMockContext());
    // First create a note
    await caller.notes.create({
      contactId: 10,
      contactName: "Isabella Muñoz",
      noteType: "interaction",
      content: "Met at conference in Medellín.",
    });
    // Then list
    const notes = await caller.notes.list({ contactId: 10 });
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(1);
    const latest = notes[0];
    expect(latest.contactId).toBe(10);
    expect(latest.content).toBe("Met at conference in Medellín.");
    expect(latest.noteType).toBe("interaction");
    expect(latest.userName).toBe("Test User");
  });
});

describe("notes.delete", () => {
  it("allows the author to delete their own note", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const created = await caller.notes.create({
      contactId: 3,
      contactName: "Delete Test",
      noteType: "general",
      content: "This will be deleted.",
    });
    const result = await caller.notes.delete({ id: created.id });
    expect(result.success).toBe(true);
  });

  it("allows admin to delete any note", async () => {
    // Create as regular user
    const userCaller = appRouter.createCaller(createMockContext());
    const created = await userCaller.notes.create({
      contactId: 4,
      contactName: "Admin Delete Test",
      noteType: "general",
      content: "Admin will delete this.",
    });

    // Delete as admin
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.notes.delete({ id: created.id });
    expect(result.success).toBe(true);
  });
});

describe("audit.logView", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createUnauthContext());
    await expect(
      caller.audit.logView({ contactId: 1, contactName: "Test" })
    ).rejects.toThrow();
  });

  it("logs a profile view", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.audit.logView({
      contactId: 5,
      contactName: "Martha Juliana Silva",
    });
    expect(result.success).toBe(true);
  });
});

describe("admin.auditLog", () => {
  it("requires admin role", async () => {
    const caller = appRouter.createCaller(createMockContext());
    await expect(caller.admin.auditLog({})).rejects.toThrow();
  });

  it("returns audit entries for admin", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const result = await adminCaller.admin.auditLog({});
    expect(result).toHaveProperty("entries");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.entries)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("filters by action type", async () => {
    // First create some audit entries
    const userCaller = appRouter.createCaller(createMockContext());
    await userCaller.audit.logView({ contactId: 6, contactName: "View Test" });
    await userCaller.notes.create({
      contactId: 6,
      contactName: "Note Test",
      noteType: "general",
      content: "Audit filter test note",
    });

    const adminCaller = appRouter.createCaller(createAdminContext());

    // Filter profile views
    const viewResult = await adminCaller.admin.auditLog({ action: "profile_view" });
    expect(viewResult.entries.every((e) => e.action === "profile_view")).toBe(true);

    // Filter note additions
    const noteResult = await adminCaller.admin.auditLog({ action: "note_added" });
    expect(noteResult.entries.every((e) => e.action === "note_added")).toBe(true);
  });

  it("supports pagination", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const page1 = await adminCaller.admin.auditLog({ limit: 2, offset: 0 });
    const page2 = await adminCaller.admin.auditLog({ limit: 2, offset: 2 });

    expect(page1.entries.length).toBeLessThanOrEqual(2);
    // If there are enough entries, pages should be different
    if (page1.total > 2 && page2.entries.length > 0) {
      expect(page1.entries[0].id).not.toBe(page2.entries[0].id);
    }
  });
});
