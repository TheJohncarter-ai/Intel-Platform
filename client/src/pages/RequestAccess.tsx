import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Send,
  Clock,
  CheckCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";

const NETWORK_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663029992019/cVMuCcQ54nJHNk4TDe3BMH/network-abstract-HzaZPiZczZUKwzawdPq7Ne.webp";

interface RequestAccessProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function RequestAccess({
  userEmail,
  userName,
  onLogout,
  onRefresh,
}: RequestAccessProps) {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const { data: myStatus } = trpc.accessRequest.myStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const submitMutation = trpc.accessRequest.submit.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setMessage(data.message);
    },
  });

  const hasPending = myStatus?.hasPending || submitted;

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-2xl text-foreground mb-2">
            Access Required
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account ({userEmail}) is not yet authorized to access the
            Strategic Network platform.
          </p>
        </div>

        {/* Form or Pending state */}
        <div className="bg-card border border-border rounded-lg p-6">
          {hasPending ? (
            // Pending state
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {submitted ? (
                  <CheckCircle size={24} className="text-green-500" />
                ) : (
                  <Clock size={24} className="text-primary" />
                )}
              </div>
              <h2 className="font-display text-lg text-foreground mb-2">
                {submitted ? "Request Submitted" : "Request Pending"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {message ||
                  "Your access request is pending review. The administrator will be notified and will review your request shortly."}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="gap-1.5"
                >
                  <RefreshCw size={12} />
                  Check Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="gap-1.5 text-muted-foreground"
                >
                  <LogOut size={12} />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            // Request form
            <>
              <div className="flex items-center gap-2 mb-4">
                <Send size={14} className="text-primary" />
                <span className="font-mono-label text-[0.7rem] text-primary">
                  REQUEST ACCESS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Submit your details below. The administrator will review your
                request and grant access if approved.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block font-mono-label text-[0.6rem] text-muted-foreground mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block font-mono-label text-[0.6rem] text-muted-foreground mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block font-mono-label text-[0.6rem] text-muted-foreground mb-1">
                    REASON FOR ACCESS (OPTIONAL)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
                    placeholder="Briefly explain why you need access..."
                  />
                </div>

                <Button
                  className="w-full mt-2"
                  onClick={() =>
                    submitMutation.mutate({ name, email, reason })
                  }
                  disabled={
                    !name.trim() ||
                    !email.trim() ||
                    submitMutation.isPending
                  }
                >
                  {submitMutation.isPending
                    ? "Submitting..."
                    : "Submit Request"}
                </Button>

                {submitMutation.error && (
                  <p className="text-xs text-red-400 mt-2">
                    {submitMutation.error.message}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="gap-1.5 text-muted-foreground"
                >
                  <LogOut size={12} />
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[0.6rem] text-muted-foreground/60 mt-6 font-mono-label">
          CONFIDENTIAL — AUTHORIZED ACCESS ONLY
        </p>
      </div>
    </div>
  );
}
