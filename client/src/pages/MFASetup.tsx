/**
 * MFA Enrollment page
 *
 * Shown after first Google login when the user has not yet set up an
 * authenticator app. Steps:
 *   1. Fetch OTP URI from /api/auth/mfa/setup?pending=...
 *   2. Render QR code (using the otpauth URI)
 *   3. User scans with Google Authenticator / Authy
 *   4. User enters 6-digit confirmation code
 *   5. POST /api/auth/mfa/setup/confirm → redirect to /
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MFASetup() {
  const [, navigate] = useLocation();
  const [otpUri, setOtpUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"loading" | "scan" | "confirm">("loading");

  const pendingId = new URLSearchParams(window.location.search).get("pending");

  useEffect(() => {
    if (!pendingId) {
      navigate("/");
      return;
    }

    fetch(`/api/auth/mfa/setup?pending=${pendingId}`)
      .then(r => r.json())
      .then(async (data: { otpAuthUri: string }) => {
        setOtpUri(data.otpAuthUri);
        // Generate QR code client-side using the URI
        const qr = await generateQRCode(data.otpAuthUri);
        setQrDataUrl(qr);
        setStep("scan");
      })
      .catch(() => setError("Failed to load setup. Please sign in again."));
  }, [pendingId, navigate]);

  async function handleConfirm() {
    if (!pendingId || code.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/mfa/setup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, token: code }),
      });
      const data = await res.json() as { success?: boolean; error?: string };

      if (data.success) {
        navigate("/");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Set up two-factor authentication</CardTitle>
          <CardDescription>
            Protect your account with an authenticator app.
            This is required to access Intel Platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "loading" && (
            <p className="text-center text-muted-foreground text-sm">Loading...</p>
          )}

          {step === "scan" && (
            <>
              <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Install <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone</li>
                <li>Open the app and tap <strong>Add account</strong></li>
                <li>Scan the QR code below</li>
                <li>Enter the 6-digit code shown in the app</li>
              </ol>

              {qrDataUrl ? (
                <div className="flex justify-center">
                  <img
                    src={qrDataUrl}
                    alt="MFA QR Code"
                    className="border rounded-lg p-2 bg-white"
                    width={200}
                    height={200}
                  />
                </div>
              ) : (
                <div className="text-xs break-all font-mono bg-muted p-3 rounded text-center">
                  {otpUri}
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setStep("confirm")}>
                I've scanned the code
              </Button>
            </>
          )}

          {(step === "confirm" || step === "scan") && (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Enter the 6-digit code from your authenticator app:
              </p>
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
                onKeyDown={e => e.key === "Enter" && handleConfirm()}
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button
                onClick={handleConfirm}
                disabled={code.length !== 6 || loading}
                className="w-full"
              >
                {loading ? "Verifying..." : "Enable two-factor authentication"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── QR code generator (canvas-based, no external lib needed) ─────────────────

async function generateQRCode(text: string): Promise<string | null> {
  try {
    // Dynamic import of qrcode (browser build)
    const QRCode = await import("qrcode");
    return QRCode.toDataURL(text, { width: 200, margin: 1 });
  } catch {
    return null;
  }
}
