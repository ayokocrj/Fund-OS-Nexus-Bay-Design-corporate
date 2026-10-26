"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCoreSession, useSelectDemoIdentity } from "@workspace/api-client-react";
import { ErrorBox, Skeleton } from "./util";

const NAV = [
  { href: "/builder/episodes", label: "Episodes", group: "Builder" },
  { href: "/analyst/review", label: "Review queue", group: "Analyst" },
  { href: "/analyst/outbox", label: "Outbox", group: "Analyst" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const qc = useQueryClient();
  const session = useCoreSession({ query: { retry: 1, queryKey: ["/api/core/session"] } });
  const select = useSelectDemoIdentity({
    mutation: { onSuccess: async () => { await qc.invalidateQueries(); } },
  });
  const s = session.data;

  return (
    <div className="min-h-[100dvh]">
      <div data-testid="banner-synthetic" className="mono px-4 py-1.5 text-center text-[11px]" style={{ background: "hsl(var(--navy))", color: "hsl(var(--panel) / .85)" }}>
        PHASE 0 · SYNTHETIC DATA ONLY · All five gateway modalities are deterministic mocks — no live model, data or adapter calls
      </div>
      <header className="border-b" style={{ borderColor: "hsl(var(--line))", background: "hsl(var(--panel))" }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
          <Link href="/builder/episodes" className="flex items-center gap-3" data-testid="link-home">
            <img src="/nexus-bay-dark.svg" alt="Nexus Bay" className="h-6 w-auto" />
            <span className="border-l pl-3 text-sm font-medium" style={{ borderColor: "hsl(var(--line))", color: "hsl(var(--muted))" }}>Fund OS · Agent Core</span>
          </Link>
          <nav className="flex gap-1 text-sm">
            {NAV.map((n) => {
              const active = path?.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} data-testid={`link-${n.label.toLowerCase().replace(/ /g, "-")}`}
                  className="rounded px-3 py-1.5"
                  style={active ? { background: "hsl(var(--navy) / .08)", color: "hsl(var(--navy))", fontWeight: 600 } : { color: "hsl(var(--muted))" }}>
                  <span className="mr-1 text-[10px] uppercase tracking-wider opacity-60">{n.group}</span>{n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {s && (
              <>
                <span className="label hidden sm:inline">Demo identity</span>
                <select data-testid="select-identity" className="input" value={s.identity.userId} disabled={select.isPending}
                  onChange={(e) => select.mutate({ data: { userId: e.target.value } })}>
                  {s.identities.map((i) => (
                    <option key={i.userId} value={i.userId}>{i.name} — {i.role} · {i.firmName}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
        {s && (
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 px-4 pb-2 text-xs" style={{ color: "hsl(var(--muted))" }}>
            <span data-testid="text-session-mode">Mode: <b className="mono">{s.mode}</b> (synthetic identity selector, not authentication; tenant mode unavailable)</span>
            <span data-testid="text-session-role">Role: <b className="mono">{s.identity.role}</b> (assigned by server)</span>
            <span>Firm: <b className="mono">{s.identity.firmId}</b></span>
          </div>
        )}
        {select.isError && <div className="mx-auto max-w-6xl px-4 pb-3"><ErrorBox error={select.error} /></div>}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {session.isLoading && <Skeleton rows={4} />}
        {session.isError && <ErrorBox error={session.error} onRetry={() => session.refetch()} />}
        {s && !select.isPending && children}
        {select.isPending && <Skeleton rows={4} />}
      </main>
    </div>
  );
}
