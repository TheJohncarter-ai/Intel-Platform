/**
 * MFA Verify page
 *
 * Shown during login for users who already have MFA enrolled.
 * User enters the 6-digit TOTP code from their authenticator app.
 * On success the server issues the session cookie and redirects to /.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MFAVerify() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingId = new URLSearchParams(window.location.search).get("pending");

  async function handleVerify() {
    if (!pendingId || code.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, token: code }),
      });
      const data = await res.json() as { success?: boolean; error?: string };

      if (data.success) {
        // Full reload so the session cookie is picked up
        window.location.href = "/";
      } else {
        setError(data.error ?? "Invalid code, please try again.");
        setCode("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!pendingId) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-widest"
            autoComplete="one-time-code"
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleVerify()}
          />

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Locked out?{" "}
            <a href="/api/auth/google" className="underline underline-offset-2">
              Sign in again
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
