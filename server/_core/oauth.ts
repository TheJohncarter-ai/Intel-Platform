import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (
      String(email).toLowerCase() !== ENV.adminEmail.toLowerCase() ||
      String(password) !== ENV.adminPassword
    ) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase();

    await db.upsertUser({
      openId: normalizedEmail,
      name: "Admin",
      email: normalizedEmail,
      loginMethod: "password",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(normalizedEmail, {
      name: "Admin",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ success: true });
  });
}
