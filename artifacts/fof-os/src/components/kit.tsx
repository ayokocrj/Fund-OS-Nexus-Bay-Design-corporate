import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useStore, type LogEntry, type Source } from '@/state/store';
import type { Tone } from '@/data/portfolio';
import { DEMO_NOTE } from '@/lib/format';

const toneCls: Record<Tone, string> = {
  ok: 'bg-[hsl(var(--ok-bg))] text-[hsl(var(--ok))]',
  warn: 'bg-[hsl(var(--warn-bg))] text-[hsl(var(--warn))]',
  bad: 'bg-[hsl(var(--bad-bg))] text-[hsl(var(--bad))]',
  info: 'bg-[#E3F2E5] text-[#283429]',
  neutral: 'bg-secondary text-muted-foreground',
};

export function Tag({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[1px] text-[11px] font-medium leading-[18px]', toneCls[tone], className)}>
      {tone !== 'neutral' && tone !== 'info' && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function Panel({ title, aside, children, className, pad = true }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn('rounded-xl border border-card-border bg-card shadow-[0_1px_0_hsl(128_20%_12%/0.03)]', className)}>
      {(title || aside) && (
        <header className={cn('flex items-center justify-between gap-3', pad ? 'px-4 pt-3.5 pb-2' : 'px-4 py-3 border-b')}>
          {title && <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>}
          {aside && <div className="flex items-center gap-1.5">{aside}</div>}
        </header>
      )}
      <div className={pad ? 'px-4 pb-4' : ''}>{children}</div>
    </section>
  );
}

export function Kpi({ value, label, detail, tone }: { value: ReactNode; label: string; detail?: string; tone?: 'ok' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-xl border border-card-border bg-card px-3.5 py-3">
      <div className={cn('tnum text-[22px] font-semibold leading-none tracking-[-0.03em]', tone && `text-[hsl(var(--${tone}))]`)}>{value}</div>
      <div className="mt-1.5 text-[11.5px] font-medium text-foreground/80">{label}</div>
      {detail && <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>}
    </div>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4">{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' | 'quiet-bad'; size?: 'sm' | 'md' };
export function Btn({ variant = 'outline', size = 'sm', className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,border-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-3.5 text-[13px]',
        variant === 'primary' && 'bg-[var(--ink)] text-[var(--pale-2)] hover:bg-[var(--ink-2)]',
        variant === 'outline' && 'border border-border bg-card text-foreground hover:border-[var(--sage)] hover:bg-[#F2F7F2]',
        variant === 'ghost' && 'text-foreground/80 hover:bg-secondary',
        variant === 'quiet-bad' && 'border border-[hsl(var(--bad)/0.3)] bg-card text-[hsl(var(--bad))] hover:bg-[hsl(var(--bad-bg))]',
        className,
      )}
    />
  );
}

export function Segmented<T extends string>({ value, options, onChange, testid }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; testid?: string }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/60 p-0.5" data-testid={testid}>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} data-testid={`${testid}-${o.v}`}
          className={cn('h-6 rounded-md px-2.5 text-[11.5px] font-medium transition-colors', value === o.v ? 'bg-card text-foreground shadow-[0_1px_2px_hsl(128_20%_12%/0.12)]' : 'text-muted-foreground hover:text-foreground')}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function SourceChip({ source, className }: { source: Source; className?: string }) {
  const { openSource } = useStore();
  return (
    <button onClick={() => openSource(source)} data-testid={`source-${source.label}`}
      className={cn('inline-flex max-w-full items-center gap-1 truncate rounded-md border px-1.5 py-[1px] text-[11px] transition-colors',
        source.ind ? 'border-[hsl(var(--warn)/0.35)] bg-[hsl(var(--warn-bg))] text-[hsl(var(--warn))]' : 'border-border bg-card text-foreground/75 hover:border-[var(--sage)] hover:text-foreground', className)}>
      <span className="h-1 w-1 shrink-0 rounded-full bg-[var(--sage)]" />
      <span className="truncate">{source.label}</span>
    </button>
  );
}

export function FigureChip({ children, source, unresolved }: { children: ReactNode; source?: Source; unresolved?: boolean }) {
  const { openSource } = useStore();
  if (unresolved || !source)
    return <span title="No source attached" className="rounded-sm border-b-2 border-[hsl(var(--warn))] bg-[hsl(var(--warn-bg))] px-0.5 font-medium">{children}</span>;
  return (
    <button onClick={() => openSource(source)} className="rounded-sm border-b-2 border-[var(--sage)] bg-[#E9F5EA] px-0.5 font-medium text-foreground transition-colors hover:bg-[var(--mint)]">
      {children}
    </button>
  );
}

export function ScreenHead({ n, title, lead }: { n: number; title: string; lead: string }) {
  return (
    <div className="mb-5 rise">
      <div className="eyebrow mb-1.5 flex items-center gap-2"><span className="tnum">Screen {n}</span><span className="h-px w-6 bg-border" /><span>Synthetic data</span></div>
      <h1 className="text-[21px] font-semibold leading-[1.2] tracking-[-0.025em] text-foreground text-balance">{title}</h1>
      <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">{lead}</p>
    </div>
  );
}

export function Foot({ children }: { children?: ReactNode }) {
  return <p className="mt-6 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">{DEMO_NOTE} {children}</p>;
}

export function Bar({ value, tone = 'ink' }: { value: number; tone?: 'ink' | 'sage' | 'warn' }) {
  const bg = tone === 'ink' ? 'var(--ink-2)' : tone === 'sage' ? 'var(--sage)' : 'hsl(var(--warn))';
  return (
    <div className="h-1.5 min-w-[56px] overflow-hidden rounded-full bg-secondary">
      <div className="h-full origin-left rounded-full transition-transform duration-500" style={{ background: bg, transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
    </div>
  );
}

export function Sparkline({ data, height = 64 }: { data: number[]; height?: number }) {
  const w = 320, h = height, pad = 6;
  const mn = Math.min(...data), mx = Math.max(...data);
  const pts = data.map((v, i) => [pad + (i * (w - pad * 2)) / (data.length - 1), h - pad - ((v - mn) / Math.max(1e-4, mx - mn)) * (h - pad * 2)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" style={{ height }} preserveAspectRatio="none">
      <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#B9E8BF" stopOpacity=".7" /><stop offset="1" stopColor="#B9E8BF" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L ${last[0]} ${h} L ${pts[0][0]} ${h} Z`} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#283429" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#769B7B" stroke="#F2FFF4" strokeWidth="1.5" />
    </svg>
  );
}

export function ActivityLog({ entries, max = 10 }: { entries: LogEntry[]; max?: number }) {
  const L = entries.slice(-max).reverse();
  return (
    <div className="scroll-quiet max-h-[280px] overflow-auto rounded-lg bg-[var(--ink)] px-3 py-2.5 font-mono text-[10.5px] leading-[1.65] text-[#CFE0D1]">
      {L.length === 0 && <div className="py-3 text-center text-[#7E9481]">No entries for this filter.</div>}
      {L.map((e) => (
        <div key={e.h + e.ts} className={cn('grid grid-cols-[52px_62px_1fr_58px] gap-2 border-b border-white/[0.05] py-[2px] rise', e.kind === 'blocked' && 'text-[#E9A99C]', e.kind === 'partner' && 'text-[var(--mint)]')}>
          <span className="text-[#7E9481]">{e.ts}</span>
          <span className="truncate">{e.actor}</span>
          <span className="truncate"><span className={e.kind === 'system' ? 'text-[#9CC6A2]' : ''}>{e.action}</span> <span className="text-[#E6ECE7]">{e.object}</span> <span className="text-[#7E9481]">{e.detail}</span></span>
          <span className="text-right text-[#5F7562]">{e.h}</span>
        </div>
      ))}
    </div>
  );
}

export function Field({ k, children, src }: { k: string; children: ReactNode; src?: Source }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 border-b border-border/60 py-1.5 text-[12.5px] last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <div className="min-w-0"><div className="tnum">{children}</div>{src && <SourceChip source={src} className="mt-1" />}</div>
    </div>
  );
}
