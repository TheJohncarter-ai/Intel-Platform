import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2, Shield, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequestAccess from "@/pages/RequestAccess";
import AdminPanel from "@/pages/AdminPanel";
import { Route, Switch, useLocation } from "wouter";

const NETWORK_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/network-abstract-HzaZPiZczZUKwzawdPq7Ne.webp";

/**
 * AuthGate wraps the entire app:
 * 1. Not authenticated → show login screen
 * 2. Authenticated but not whitelisted → show request access screen
 * 3. Authenticated + whitelisted → render children (the app)
 * 4. Admin → also gets access to /admin route
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const {
    data: whitelistStatus,
    isLoading: whitelistLoading,
    refetch: refetchWhitelist,
  } = trpc.auth.whitelistStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Loading state
  if (authLoading || (isAuthenticated && whitelistLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin text-primary mx-auto mb-4"
          />
          <p className="font-mono-label text-[0.7rem] text-muted-foreground">
            AUTHENTICATING...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → login screen
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // Authenticated but not whitelisted → request access
  if (whitelistStatus && !whitelistStatus.whitelisted) {
    return (
      <RequestAccess
        userEmail={user.email ?? ""}
        userName={user.name ?? ""}
        onLogout={logout}
        onRefresh={refetchWhitelist}
      />
    );
  }

  // Admin route handling
  if (whitelistStatus?.isAdmin && location === "/admin") {
    return <AdminPanel onLogout={logout} />;
  }

  // Whitelisted → render the app with admin link if applicable
  return (
    <>
      {children}
    </>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <img
          src={NETWORK_BG}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">
            Strategic Network
          </h1>
          <p className="text-sm text-muted-foreground">
            Intelligence dossiers for key contacts across Colombian VC,
            financial ecosystem, and international business networks.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={14} className="text-primary" />
            <span className="font-mono-label text-[0.7rem] text-primary">
              SECURE ACCESS REQUIRED
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access the network intelligence platform. Only
            authorized users can view contact dossiers.
          </p>
          <a
            href={getLoginUrl()}
            className="block w-full"
          >
            <Button className="w-full" size="lg">
              Sign In to Continue
            </Button>
          </a>
        </div>

        <p className="text-center text-[0.6rem] text-muted-foreground/60 mt-6 font-mono-label">
          CONFIDENTIAL — AUTHORIZED ACCESS ONLY
        </p>
      </div>
    </div>
  );
}
