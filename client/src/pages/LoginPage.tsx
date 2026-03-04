export default function LoginPage() {
  const apiBase = import.meta.env.VITE_API_URL ?? "";

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBase}/api/auth/google`;
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
            Authentication Required
          </h1>
          <p className="text-sm text-[#4a6080] text-center max-w-sm font-mono">
            Sign in with your Google account to access the intelligence platform.
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-6 rounded font-mono text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-3"
          style={{
            background: "linear-gradient(135deg, #d4a843, #b8922e)",
            color: "#0a0c18",
            border: "1px solid #d4a843",
            boxShadow: "0 0 20px rgba(212,168,67,0.2)",
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
