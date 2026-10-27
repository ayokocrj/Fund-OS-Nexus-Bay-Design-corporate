"use client";
import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const POLL_MS = 15_000;

type Errish = { status?: number; data?: unknown; message?: string } | null | undefined;

export function errStatus(e: unknown): number | undefined {
  return (e as Errish)?.status;
}

export function errMessage(e: unknown): string {
  const x = e as Errish;
  const d = x?.data as { error?: unknown } | null | undefined;
  if (d && typeof d.error === "string") return d.error;
  if (x?.status === 403) return "Forbidden: your demo identity's role is not permitted to do this.";
  if (x?.status === 409) return "Version conflict: this record changed on the server. Reloaded the latest version.";
  return x?.message || "Network request failed.";
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const s = errStatus(error);
  return (
    <div data-testid="status-error" className="panel flex items-start gap-3 p-3 text-sm" style={{ borderColor: "hsl(var(--bad) / .4)" }}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--bad))" }} />
      <div className="flex-1">
        <div className="font-medium">{s ? `Error ${s}` : "Request failed"}</div>
        <div style={{ color: "hsl(var(--muted))" }}>{errMessage(error)}</div>
      </div>
      {onRetry && (
        <button data-testid="button-retry" className="btn" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" data-testid="status-loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel h-14" />
      ))}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div data-testid="status-empty" className="panel border-dashed p-8 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-sm" style={{ color: "hsl(var(--muted))" }}>{children}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  ok: "var(--ok)", pass: "var(--ok)", passed: "var(--ok)", approved: "var(--ok)", accepted: "var(--ok)", completed: "var(--ok)", succeeded: "var(--ok)", confirmed: "var(--ok)", edited: "var(--accent)",
  rejected: "var(--bad)", failed: "var(--bad)", fail: "var(--bad)", error: "var(--bad)", block: "var(--bad)",
  pending: "var(--warn)", proposed: "var(--warn)", running: "var(--warn)", draft: "var(--warn)", stopped: "var(--warn)", pass_with_notes: "var(--warn)",
};
export function StatusPill({ value, testId }: { value: string | null | undefined; testId?: string }) {
  const v = value ?? "none";
  const c = TONES[v.toLowerCase()] ?? "var(--muted)";
  return (
    <span data-testid={testId} className="mono inline-block rounded px-1.5 py-0.5 text-[11px] font-medium" style={{ color: `hsl(${c})`, background: `hsl(${c} / .1)` }}>
      {v}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-4" style={{ borderColor: "hsl(var(--line))" }}>
      <div>
        <div className="label">{eyebrow}</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function payloadText(p: Record<string, unknown>): string {
  return typeof p.text === "string" ? p.text : "";
}
export function payloadCitations(p: Record<string, unknown>): string[] {
  return Array.isArray(p.citations) ? p.citations.filter((c): c is string => typeof c === "string") : [];
}
