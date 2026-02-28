/**
 * Shared UI primitives for the intelligence theme.
 * Eliminates repeated inline styles across pages.
 */
import { Loader2 } from "lucide-react";

// ─── Page Shell ──────────────────────────────────────────────────────

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0c18] text-[#c8d8f0]">
      {children}
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────

export function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[#151f38] bg-[#060914]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
        {children}
      </div>
    </div>
  );
}

// ─── Accent Bar ──────────────────────────────────────────────────────

export function AccentBar({ height = 20 }: { height?: number }) {
  return (
    <div
      className="w-[3px] rounded-sm bg-[#d4a843]"
      style={{ height, boxShadow: "0 0 10px rgba(212,168,67,0.5)" }}
    />
  );
}

// ─── Section Label ───────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[#d4a843] font-mono text-[10px] font-extrabold tracking-[0.22em] uppercase">
      {children}
    </span>
  );
}

// ─── Muted Text ──────────────────────────────────────────────────────

export function MutedText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[#4a6080] font-mono text-[10px] tracking-[0.08em] ${className}`}>
      {children}
    </span>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────

export function LoadingScreen({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-[#0a0c18] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4a843]" />
        <span className="text-[#4a6080] font-mono text-xs tracking-[0.2em] uppercase">
          {text}
        </span>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8 rounded-lg bg-[#060914] border border-[#151f38]">
      <span className="text-[#2a3a54] font-mono text-sm">{text}</span>
    </div>
  );
}

// ─── Section Header with count ───────────────────────────────────────

export function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <AccentBar height={16} />
      <SectionLabel>{title}</SectionLabel>
      {count !== undefined && (
        <MutedText>[{count}]</MutedText>
      )}
    </div>
  );
}

// ─── Panel Card ──────────────────────────────────────────────────────

export function PanelCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 rounded-lg bg-[#060914] border border-[#151f38] ${className}`}>
      {children}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────

const BADGE_STYLES = {
  success: "bg-[#0d1f0d] border-[#1a4a1a] text-[#4ade80]",
  info: "bg-[#0d1828] border-[#1a3a5a] text-[#60a5fa]",
  warning: "bg-[#1f1a0d] border-[#4a3a1a] text-[#d4a843]",
  danger: "bg-[#1f0d0d] border-[#4a1a1a] text-[#f87171]",
  muted: "bg-[#0a0c18] border-[#151f38] text-[#4a6080]",
} as const;

export function StatusBadge({ variant, children }: { variant: keyof typeof BADGE_STYLES; children: React.ReactNode }) {
  return (
    <span className={`font-mono text-[9px] font-extrabold tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm border ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}
