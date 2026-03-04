export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // URL of the GitHub Pages frontend (used for CORS and post-login redirect)
  frontendUrl: process.env.FRONTEND_URL ?? "",
  // Google OAuth credentials
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Backend base URL for constructing the OAuth callback URI.
  // Render sets RENDER_EXTERNAL_URL automatically; fallback to BACKEND_URL if self-hosting.
  backendUrl: process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || "",
  // Admin email — users who sign in with this Google account get admin role
  adminEmail: process.env.ADMIN_EMAIL ?? "Powelljohn9521@gmail.com",
};
