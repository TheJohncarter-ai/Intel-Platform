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

describe("connections", () => {
  it("connections.graph returns nodes and edges arrays", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.connections.graph();
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
    // Each node should have id, name, organization, sector
    if (result.nodes.length > 0) {
      const node = result.nodes[0];
      expect(node).toHaveProperty("id");
      expect(node).toHaveProperty("name");
    }
    // Each edge should have source, target, type, label
    if (result.edges.length > 0) {
      const edge = result.edges[0];
      expect(edge).toHaveProperty("source");
      expect(edge).toHaveProperty("target");
      expect(edge).toHaveProperty("type");
      expect(edge).toHaveProperty("label");
    }
  });

  it("connections.sharedActivity returns categorized connections for a contact", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.connections.sharedActivity({ contactId: 1 });
    expect(result).toHaveProperty("colleagues");
    expect(result).toHaveProperty("coAttendees");
    expect(result).toHaveProperty("sectorPeers");
    expect(result).toHaveProperty("sharedDomain");
    expect(Array.isArray(result.colleagues)).toBe(true);
    expect(Array.isArray(result.coAttendees)).toBe(true);
    expect(Array.isArray(result.sectorPeers)).toBe(true);
    expect(Array.isArray(result.sharedDomain)).toBe(true);
  });

  it("shared activity people have required fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.connections.sharedActivity({ contactId: 1 });
    const allPeople = [...result.colleagues, ...result.coAttendees, ...result.sectorPeers, ...result.sharedDomain];
    for (const person of allPeople) {
      expect(person).toHaveProperty("id");
      expect(person).toHaveProperty("name");
      expect(person).toHaveProperty("sharedValue");
      expect(typeof person.id).toBe("number");
      expect(typeof person.name).toBe("string");
    }
  });
});
