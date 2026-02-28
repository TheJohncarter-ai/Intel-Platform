import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

/**
 * AuthGate wraps protected pages.
 * - If not logged in → show sign-in prompt
 * - If logged in but not whitelisted → redirect to /request-access
 * - If whitelisted → render children
 */
export default function AuthGate({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: access, isLoading: accessLoading } = trpc.auth.checkAccess.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !user) return; // handled below
    if (!accessLoading && access && !access.whitelisted) {
      setLocation("/request-access");
    }
    if (requireAdmin && !accessLoading && access && !access.isAdmin) {
      setLocation("/");
    }
  }, [authLoading, user, accessLoading, access, requireAdmin, setLocation]);

  if (authLoading || (user && accessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0c18" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4a843]" />
          <span className="text-[#4a6080] font-mono text-xs tracking-[0.2em] uppercase">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0c18" }}>
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-[#d4a843] rounded-sm" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
              <span className="text-[#d4a843] font-mono text-xs font-extrabold tracking-[0.22em] uppercase">
                Strategic Network Intelligence
              </span>
            </div>
            <h1 className="text-xl font-semibold text-[#c8d8f0]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Authentication Required
            </h1>
            <p className="text-sm text-[#4a6080] text-center max-w-sm font-mono">
              Sign in with your authorized account to access the intelligence platform.
            </p>
          </div>
          <button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full py-3 px-6 rounded font-mono text-sm font-bold tracking-wider uppercase transition-all"
            style={{
              background: "linear-gradient(135deg, #d4a843, #b8922e)",
              color: "#0a0c18",
              border: "1px solid #d4a843",
              boxShadow: "0 0 20px rgba(212,168,67,0.2)",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!access?.whitelisted) return null; // redirecting
  if (requireAdmin && !access?.isAdmin) return null; // redirecting

  return <>{children}</>;
}
