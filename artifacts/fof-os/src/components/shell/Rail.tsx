import { MessageSquare, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { SCREENS, SCREEN_GROUPS } from '@/data/screens';
import { useStore } from '@/state/store';

export function Rail({ current, onNavigate }: { current: number | null; onNavigate?: () => void }) {
  const { threads, activeThread, newThread, selectThread } = useStore();
  return (
    <nav className="scroll-quiet flex h-full w-[248px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-2.5 pb-3 pt-3">
      <button onClick={() => { newThread(); onNavigate?.(); }} data-testid="button-new-conversation"
        className="flex h-9 items-center gap-2 rounded-lg border border-[var(--sage)]/40 bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:border-[var(--sage)] hover:bg-[#F7FBF7]">
        <Plus className="h-3.5 w-3.5 text-[var(--sage)]" /> New conversation
      </button>

      <div className="eyebrow mb-1 mt-5 px-2">Recent</div>
      <div className="flex flex-col">
        {threads.slice(0, 6).map((t) => (
          <button key={t.id} onClick={() => { selectThread(t.id); onNavigate?.(); }} data-testid={`button-thread-${t.id}`}
            className={cn('group flex items-center gap-2 rounded-md px-2 py-[5px] text-left text-[12.5px] transition-colors', t.id === activeThread ? 'bg-sidebar-accent text-foreground' : 'text-foreground/75 hover:bg-sidebar-accent/60')}>
            <MessageSquare className="h-3 w-3 shrink-0 text-[var(--sage)]" />
            <span className="min-w-0 flex-1 truncate">{t.title}</span>
            <span className="text-[10.5px] text-muted-foreground">{t.when}</span>
          </button>
        ))}
      </div>

      <div className="eyebrow mb-1 mt-5 px-2">The firm's screens</div>
      {SCREEN_GROUPS.map((g) => (
        <div key={g} className="mb-1.5">
          <div className="px-2 pb-0.5 pt-1.5 text-[10.5px] font-medium text-muted-foreground/80">{g}</div>
          {SCREENS.filter((s) => s.group === g).map((s) => {
            const on = current === s.id;
            return (
              <Link key={s.id} href={`/screens/${s.id}`} onClick={onNavigate} data-testid={`link-screen-${s.id}`}
                className={cn('relative flex items-center gap-2.5 rounded-md px-2 py-[5px] text-[12.5px] transition-colors', on ? 'bg-[var(--ink)] text-[var(--pale-2)]' : 'text-foreground/80 hover:bg-sidebar-accent/70')}>
                <span className={cn('tnum flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold', on ? 'bg-[var(--mint)] text-[var(--ink)]' : 'bg-card text-muted-foreground ring-1 ring-border')}>{s.id}</span>
                <span className="truncate">{s.title}</span>
              </Link>
            );
          })}
        </div>
      ))}

      <p className="mt-auto border-t border-sidebar-border px-1.5 pt-3 text-[10.5px] leading-[1.5] text-muted-foreground">
        Synthetic firm data: managers, companies, people and figures are invented. Files you share are opened in your browser only; nothing is uploaded. In production Scribe runs inside the firm's tenant behind the rules on screen 9.
      </p>
    </nav>
  );
}
