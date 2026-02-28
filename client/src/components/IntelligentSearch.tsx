import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { X, Send, Sparkles, Loader2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════
// PARSE CONTACT LINKS — converts [[ID:number|Name]] to clickable links
// ═══════════════════════════════════════════════════════════════════════

function ParsedContent({ content }: { content: string }) {
  // Split on [[ID:number|Name]] pattern
  const parts = content.split(/(\[\[ID:\d+\|[^\]]+\]\])/g);

  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/\[\[ID:(\d+)\|([^\]]+)\]\]/);
        if (match) {
          const [, id, name] = match;
          return (
            <Link
              key={i}
              href={`/profile/${id}`}
              className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded transition-all hover:bg-[rgba(212,168,67,0.15)]"
              style={{
                color: "#d4a843",
                textDecoration: "none",
                fontWeight: 600,
                borderBottom: "1px solid rgba(212,168,67,0.3)",
              }}
            >
              {name}
            </Link>
          );
        }
        // Render markdown-like bold
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              const boldMatch = bp.match(/\*\*([^*]+)\*\*/);
              if (boldMatch) {
                return <strong key={j} className="text-[#c8d8f0] font-semibold">{boldMatch[1]}</strong>;
              }
              return <span key={j}>{bp}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FLOATING BUTTON — glowing lightbulb + question mark
// ═══════════════════════════════════════════════════════════════════════

function FloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[150] group"
      title="Ask AI about your contacts"
      style={{ filter: "drop-shadow(0 0 20px rgba(212,168,67,0.3))" }}
    >
      <div
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
        style={{
          background: "linear-gradient(135deg, rgba(212,168,67,0.15) 0%, rgba(212,168,67,0.08) 100%)",
          border: "1px solid rgba(212,168,67,0.35)",
          boxShadow: "0 0 30px rgba(212,168,67,0.15), inset 0 0 20px rgba(212,168,67,0.05)",
        }}
      >
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: "rgba(212,168,67,0.08)",
            animationDuration: "3s",
          }}
        />
        {/* Second pulse ring (offset) */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: "rgba(212,168,67,0.05)",
            animationDuration: "3s",
            animationDelay: "1.5s",
          }}
        />

        {/* Icon container */}
        <div className="relative flex items-center justify-center">
          <Sparkles
            size={24}
            className="text-[#d4a843] transition-all duration-300 group-hover:text-[#e8c85a]"
            style={{
              filter: "drop-shadow(0 0 8px rgba(212,168,67,0.6))",
            }}
          />
          {/* Small question mark badge */}
          <div
            className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
            style={{
              background: "rgba(96,165,250,0.2)",
              border: "1px solid rgba(96,165,250,0.4)",
              color: "#60a5fa",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ?
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div
        className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: "#0d1020",
          border: "1px solid #1a3a6a",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <span className="text-[#c8d8f0] text-[10px] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Ask AI about your contacts
        </span>
        <div
          className="absolute top-full right-6 w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #1a3a6a",
          }}
        />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHAT OVERLAY
// ═══════════════════════════════════════════════════════════════════════

function ChatOverlay({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchMutation = trpc.contacts.intelligentSearch.useMutation();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await searchMutation.mutateAsync({ question });
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQuestions = [
    "Who has VC experience in Bogotá?",
    "Which contacts work in real estate?",
    "Find people connected to family offices",
    "Who should I talk to about fintech in Peru?",
    "Which Tier 1 contacts haven't been contacted recently?",
    "Who works in government relations?",
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div
        className="fixed z-[201] flex flex-col"
        style={{
          bottom: "24px",
          right: "24px",
          width: "min(460px, calc(100vw - 32px))",
          height: "min(640px, calc(100vh - 48px))",
          background: "#0a0c18",
          border: "1px solid #1a3a6a",
          borderRadius: "16px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(212,168,67,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 shrink-0"
          style={{
            borderBottom: "1px solid #151f38",
            background: "rgba(6,9,20,0.95)",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#d4a843]" style={{ filter: "drop-shadow(0 0 6px rgba(212,168,67,0.5))" }} />
            <span
              className="text-[#d4a843] text-[11px] font-extrabold tracking-[0.18em] uppercase"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Intelligence Search
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#4a6080] hover:text-[#c8d8f0] hover:bg-[rgba(74,96,128,0.1)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#1a3a6a transparent" }}>
          {messages.length === 0 ? (
            /* Empty state with example questions */
            <div className="flex flex-col items-center justify-center h-full gap-5 py-6">
              <div className="flex flex-col items-center gap-2">
                <Sparkles size={32} className="text-[#1a3a6a]" />
                <span
                  className="text-[#4a6080] text-[11px] font-semibold tracking-wider uppercase"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Ask anything about your network
                </span>
                <span
                  className="text-[#2a3a54] text-[10px] text-center max-w-[300px]"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  AI-powered search across all contacts, roles, organizations, locations, and notes
                </span>
              </div>

              <div className="w-full max-w-[360px] space-y-2">
                <span
                  className="text-[#2a3a54] text-[9px] font-bold tracking-[0.15em] uppercase block mb-2"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Try asking:
                </span>
                {exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-[11px] transition-all hover:bg-[rgba(212,168,67,0.06)] active:bg-[rgba(212,168,67,0.1)]"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#4a6080",
                      background: "rgba(6,9,20,0.6)",
                      border: "1px solid #151f38",
                    }}
                  >
                    <span className="text-[#d4a843] mr-1.5">→</span> {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] px-3.5 py-2.5 rounded-xl text-[12px] leading-relaxed"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      ...(msg.role === "user"
                        ? {
                            background: "rgba(212,168,67,0.12)",
                            border: "1px solid rgba(212,168,67,0.25)",
                            color: "#c8d8f0",
                            borderBottomRightRadius: "4px",
                          }
                        : {
                            background: "#0d1020",
                            border: "1px solid #151f38",
                            color: "#8a9ab0",
                            borderBottomLeftRadius: "4px",
                          }),
                    }}
                  >
                    {msg.role === "assistant" ? (
                      <div className="whitespace-pre-wrap">
                        <ParsedContent content={msg.content} />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
                    style={{
                      background: "#0d1020",
                      border: "1px solid #151f38",
                      borderBottomLeftRadius: "4px",
                    }}
                  >
                    <Loader2 size={14} className="text-[#d4a843] animate-spin" />
                    <span
                      className="text-[#4a6080] text-[11px]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Analyzing network...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="shrink-0 flex items-center gap-2 px-3 py-3"
          style={{
            borderTop: "1px solid #151f38",
            background: "rgba(6,9,20,0.95)",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your contacts..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-[#c8d8f0] text-[12px] placeholder-[#2a3a54] disabled:opacity-50"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg transition-all disabled:opacity-30 hover:bg-[rgba(212,168,67,0.12)] active:bg-[rgba(212,168,67,0.2)]"
            style={{
              color: input.trim() ? "#d4a843" : "#2a3a54",
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN EXPORT — combines button + overlay
// ═══════════════════════════════════════════════════════════════════════

export default function IntelligentSearch() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {!isOpen && <FloatingButton onClick={() => setIsOpen(true)} />}
      {isOpen && <ChatOverlay onClose={() => setIsOpen(false)} />}
    </>
  );
}
