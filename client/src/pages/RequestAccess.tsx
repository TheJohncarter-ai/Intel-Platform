import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { CheckCircle, Clock, Shield } from "lucide-react";

export default function RequestAccess() {
  const { user, loading: authLoading, logout } = useAuth();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: status } = trpc.accessRequests.myStatus.useQuery(undefined, {
    enabled: !!user,
  });

  const submitMutation = trpc.accessRequests.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const { data: access } = trpc.auth.checkAccess.useQuery(undefined, {
    enabled: !!user,
  });

  if (access?.whitelisted) {
    window.location.href = "/";
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0c18" }}>
        <Clock className="h-6 w-6 animate-spin text-[#d4a843]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0c18" }}>
        <div className="flex flex-col items-center gap-5 sm:gap-6 p-5 sm:p-8 max-w-md w-full">
          <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-[#d4a843]" />
          <h1 className="text-lg sm:text-xl font-semibold text-[#c8d8f0]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Sign In First
          </h1>
          <p className="text-[#4a6080] font-mono text-xs sm:text-sm text-center">
            You need to sign in before requesting access.
          </p>
          <button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="py-3 px-8 rounded font-mono text-xs sm:text-sm font-bold tracking-wider uppercase w-full sm:w-auto"
            style={{ background: "#d4a843", color: "#0a0c18" }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const hasPending = status?.hasPending || submitted;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0a0c18" }}>
      <div className="flex flex-col items-center gap-5 sm:gap-6 p-4 sm:p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-1 sm:mb-2">
          <div className="w-1 h-6 sm:h-8 bg-[#d4a843] rounded-sm" style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }} />
          <span className="text-[#d4a843] font-mono text-[10px] sm:text-xs font-extrabold tracking-[0.18em] sm:tracking-[0.22em] uppercase">
            Access Control
          </span>
        </div>

        {hasPending ? (
          <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-[#4ade80]" />
            <h1 className="text-lg sm:text-xl font-semibold text-[#c8d8f0]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Request Submitted
            </h1>
            <p className="text-[#4a6080] font-mono text-xs sm:text-sm max-w-sm">
              Your access request is pending admin review. You'll be able to access the platform once approved.
            </p>
            <div className="flex items-center gap-2 mt-2 px-3 sm:px-4 py-2 rounded border border-[#151f38] bg-[#060914]">
              <Clock className="h-4 w-4 text-[#d4a843]" />
              <span className="text-[#d4a843] font-mono text-[10px] sm:text-xs tracking-wider">PENDING REVIEW</span>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg sm:text-xl font-semibold text-[#c8d8f0]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Request Access
            </h1>
            <p className="text-[#4a6080] font-mono text-xs sm:text-sm text-center max-w-sm">
              Your email <span className="text-[#c8d8f0] break-all">{user.email}</span> is not on the approved list.
              Submit a request to the administrator.
            </p>
            <div className="w-full space-y-4">
              <div>
                <label className="block text-[#4a6080] font-mono text-[9px] sm:text-[10px] tracking-[0.18em] uppercase mb-2">
                  Reason for access (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly explain why you need access..."
                  className="w-full p-3 rounded font-mono text-xs sm:text-sm text-[#c8d8f0] placeholder-[#2a3a54] resize-none"
                  style={{
                    background: "#060914",
                    border: "1px solid #151f38",
                    outline: "none",
                    minHeight: 100,
                  }}
                  maxLength={1000}
                />
              </div>
              <button
                onClick={() => submitMutation.mutate({ reason: reason || undefined })}
                disabled={submitMutation.isPending}
                className="w-full py-3 px-6 rounded font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-50 active:opacity-80"
                style={{ background: "#d4a843", color: "#0a0c18" }}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </>
        )}

        <button
          onClick={logout}
          className="text-[#4a6080] font-mono text-xs tracking-wider hover:text-[#c8d8f0] active:text-[#c8d8f0] transition-colors mt-3 sm:mt-4 p-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
