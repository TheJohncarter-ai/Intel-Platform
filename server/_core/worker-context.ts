/**
 * tRPC context for Cloudflare Workers
 * Replaces the Express-based createContext in context.ts
 */

import type { D1Database, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { verifySession, getSessionTokenFromRequest } from "./session";
import type { Env } from "../worker";

export interface WorkerContext {
  db: D1Database;
  mfaStore: KVNamespace;
  storage: R2Bucket;
  user: {
    sub: string;
    email: string;
    name: string;
    picture?: string;
    role: "user" | "admin";
    mfaVerified: boolean;
  } | null;
  adminEmail: string;
}

export async function createWorkerContext(
  req: Request,
  env: Env
): Promise<WorkerContext> {
  const token = getSessionTokenFromRequest(req);
  let user: WorkerContext["user"] = null;

  if (token) {
    const session = await verifySession(token, env.JWT_SECRET);
    if (session?.mfaVerified) {
      user = {
        sub: session.sub,
        email: session.email,
        name: session.name,
        picture: session.picture,
        role: session.role,
        mfaVerified: session.mfaVerified,
      };
    }
  }

  return {
    db: env.DB,
    mfaStore: env.MFA_STORE,
    storage: env.STORAGE,
    user,
    adminEmail: env.ADMIN_EMAIL,
  };
}
