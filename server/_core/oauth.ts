import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getCallbackUrl(req: Request): string {
  if (ENV.backendUrl) return `${ENV.backendUrl}/api/auth/google/callback`;
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  return `${proto}://${req.headers.host}/api/auth/google/callback`;
}

export function registerOAuthRoutes(app: Express) {
  // Step 1: Redirect to Google consent screen
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const callbackUrl = getCallbackUrl(req);
    const state = Buffer.from(ENV.frontendUrl || "/").toString("base64");

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
    });

    res.redirect(302, `${GOOGLE_AUTH_URL}?${params}`);
  });

  // Step 2: Handle Google callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : null;

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      const callbackUrl = getCallbackUrl(req);

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        console.error("[Google OAuth] Token exchange failed", await tokenRes.text());
        res.status(500).json({ error: "Token exchange failed" });
        return;
      }

      const tokens = (await tokenRes.json()) as { access_token: string };

      const userRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        res.status(500).json({ error: "Failed to fetch user info from Google" });
        return;
      }

      const userInfo = (await userRes.json()) as {
        id: string;
        email?: string;
        name?: string;
      };

      if (!userInfo.id || !userInfo.email) {
        res.status(400).json({ error: "Incomplete profile returned by Google" });
        return;
      }

      const openId = `google:${userInfo.id}`;
      const isAdmin = userInfo.email.toLowerCase() === ENV.adminEmail.toLowerCase();

      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email,
        loginMethod: "google",
        role: isAdmin ? "admin" : "user",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || userInfo.email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      let redirectTarget = ENV.frontendUrl || "/";
      if (state) {
        try {
          redirectTarget = Buffer.from(state, "base64").toString("utf8") || redirectTarget;
        } catch {}
      }

      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}
