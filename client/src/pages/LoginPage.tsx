import { useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const apiBase = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any).error || "Login failed");
        return;
      }
      setLocation("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0a0c18" }}
    >
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-1 h-8 bg-[#d4a843] rounded-sm"
              style={{ boxShadow: "0 0 10px rgba(212,168,67,0.5)" }}
            />
            <span className="text-[#d4a843] font-mono text-xs font-extrabold tracking-[0.22em] uppercase">
              Strategic Network Intelligence
            </span>
          </div>
          <h1
            className="text-xl font-semibold text-[#c8d8f0]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Sign In
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[#4a6080] font-mono text-xs tracking-[0.15em] uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded font-mono text-sm text-[#c8d8f0] bg-[#111428] border border-[#1e2a4a] outline-none focus:border-[#d4a843] transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[#4a6080] font-mono text-xs tracking-[0.15em] uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded font-mono text-sm text-[#c8d8f0] bg-[#111428] border border-[#1e2a4a] outline-none focus:border-[#d4a843] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 font-mono text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded font-mono text-sm font-bold tracking-wider uppercase transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #d4a843, #b8922e)",
              color: "#0a0c18",
              border: "1px solid #d4a843",
              boxShadow: "0 0 20px rgba(212,168,67,0.2)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
