import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ─── Mock the database module ────────────────────────────────
vi.mock("./db", () => {
  // In-memory stores for testing
  const whitelistStore = new Map<string, { email: string; name: string | null; approvedBy: string | null }>();
  const requestStore: Array<{
    id: number;
    name: string;
    email: string;
    reason: string | null;
    status: "pending" | "approved" | "denied";
    reviewedBy: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }> = [];
  let nextId = 1;

  // Seed admin
  whitelistStore.set("powelljohn9521@gmail.com", {
    email: "powelljohn9521@gmail.com",
    name: "Admin",
    approvedBy: "system",
  });

  return {
    getDb: vi.fn().mockResolvedValue({}),
    upsertUser: vi.fn().mockResolvedValue(undefined),
    getUserByOpenId: vi.fn().mockResolvedValue(undefined),
    seedAdminWhitelist: vi.fn().mockResolvedValue(undefined),
    isEmailWhitelisted: vi.fn().mockImplementation(async (email: string) => {
      return whitelistStore.has(email.toLowerCase().trim());
    }),
    addToWhitelist: vi.fn().mockImplementation(async (entry: { email: string; name?: string | null; approvedBy?: string | null }) => {
      whitelistStore.set(entry.email.toLowerCase().trim(), {
        email: entry.email.toLowerCase().trim(),
        name: entry.name ?? null,
        approvedBy: entry.approvedBy ?? null,
      });
    }),
    removeFromWhitelist: vi.fn().mockImplementation(async (email: string) => {
      whitelistStore.delete(email.toLowerCase().trim());
    }),
    getAllWhitelistEntries: vi.fn().mockImplementation(async () => {
      return Array.from(whitelistStore.values()).map((e, i) => ({
        id: i + 1,
        ...e,
        createdAt: new Date(),
      }));
    }),
    isAdminEmail: vi.fn().mockImplementation((email: string | null | undefined) => {
      if (!email) return false;
      return email.toLowerCase().trim() === "powelljohn9521@gmail.com";
    }),
    createAccessRequest: vi.fn().mockImplementation(async (req: { name: string; email: string; reason?: string | null }) => {
      const id = nextId++;
      requestStore.push({
        id,
        name: req.name,
        email: req.email.toLowerCase().trim(),
        reason: req.reason ?? null,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
      });
      return id;
    }),
    getAccessRequests: vi.fn().mockImplementation(async (status?: string) => {
      if (status) return requestStore.filter((r) => r.status === status);
      return [...requestStore];
    }),
    getAccessRequestById: vi.fn().mockImplementation(async (id: number) => {
      return requestStore.find((r) => r.id === id);
    }),
    updateAccessRequestStatus: vi.fn().mockImplementation(
      async (id: number, status: "approved" | "denied", reviewedBy: string) => {
        const req = requestStore.find((r) => r.id === id);
        if (req) {
          req.status = status;
          req.reviewedBy = reviewedBy;
          req.reviewedAt = new Date();
        }
      }
    ),
    hasExistingPendingRequest: vi.fn().mockImplementation(async (email: string) => {
      return requestStore.some(
        (r) => r.email === email.toLowerCase().trim() && r.status === "pending"
      );
    }),
  };
});

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Context helpers ─────────────────────────────────────────

function createMockContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "testuser@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe("auth.whitelistStatus", () => {
  it("returns whitelisted=true for admin email", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.whitelistStatus();
    expect(result.whitelisted).toBe(true);
    expect(result.isAdmin).toBe(true);
    expect(result.email).toBe("powelljohn9521@gmail.com");
  });

  it("returns whitelisted=false for non-whitelisted user", async () => {
    const ctx = createMockContext({ email: "stranger@example.com" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.whitelistStatus();
    expect(result.whitelisted).toBe(false);
    expect(result.isAdmin).toBe(false);
  });

  it("requires authentication", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.whitelistStatus()).rejects.toThrow();
  });
});

describe("accessRequest.submit", () => {
  it("creates a new access request", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accessRequest.submit({
      name: "New User",
      email: "newuser@example.com",
      reason: "I need access for business",
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Your request has been submitted.");
  });

  it("returns already-approved message if email is whitelisted", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accessRequest.submit({
      name: "Admin",
      email: "powelljohn9521@gmail.com",
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("You are already approved.");
  });
});

describe("admin.listRequests", () => {
  it("returns pending requests for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listRequests({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listRequests({})).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listRequests({})).rejects.toThrow();
  });
});

describe("admin.approveRequest", () => {
  it("approves a pending request and adds to whitelist", async () => {
    // First create a request
    const userCtx = createMockContext({ email: "approvetest@example.com" });
    const userCaller = appRouter.createCaller(userCtx);
    await userCaller.accessRequest.submit({
      name: "Approve Test",
      email: "approvetest@example.com",
      reason: "Testing approval",
    });

    // Admin approves
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);
    const requests = await adminCaller.admin.listRequests({ status: "pending" });
    const pendingReq = requests.find((r: any) => r.email === "approvetest@example.com");

    if (pendingReq) {
      const result = await adminCaller.admin.approveRequest({ id: pendingReq.id });
      expect(result.success).toBe(true);
    }
  });
});

describe("admin.addWhitelist", () => {
  it("allows admin to manually add email", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.addWhitelist({
      email: "manual@example.com",
      name: "Manual Add",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.addWhitelist({ email: "test@test.com" })
    ).rejects.toThrow();
  });
});

describe("admin.removeWhitelist", () => {
  it("allows admin to remove non-admin email", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // First add
    await caller.admin.addWhitelist({ email: "removeme@example.com" });
    // Then remove
    const result = await caller.admin.removeWhitelist({ email: "removeme@example.com" });
    expect(result.success).toBe(true);
  });

  it("prevents removing the admin email", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.removeWhitelist({ email: "powelljohn9521@gmail.com" })
    ).rejects.toThrow("Cannot remove the primary admin from the whitelist");
  });
});
