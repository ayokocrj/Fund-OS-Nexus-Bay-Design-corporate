import { Menu } from 'lucide-react';
import logoLight from '@/assets/brand/nexus-bay-light.svg';
import { useStore } from '@/state/store';

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { blocked, log, letterUnv, level } = useStore();
  const unv = Object.values(letterUnv).filter(Boolean).length;
  const items: [string, string | number, boolean?][] = [
    ['Sent by the system', 0],
    ['Blocked attempts', blocked, blocked > 0],
    ['Activity entries', log.length],
    ['Figures without a source', unv, unv > 0],
    ['Scribe', level === 0 ? 'Paused' : `L${level}`, level === 0],
  ];
  return (
    <header className="relative z-30 flex h-[52px] shrink-0 items-center gap-4 bg-[var(--ink)] px-4 text-[var(--pale)]">
      <button onClick={onMenu} className="-ml-1 rounded-md p-1.5 text-[var(--pale)]/80 hover:bg-white/5 lg:hidden" data-testid="button-menu" aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
      <div className="flex shrink-0 items-center gap-3">
        <img src={logoLight} alt="Nexus Bay" className="h-[19px] w-auto" />
        <span className="h-4 w-px bg-white/15" />
        <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--pale-2)]">FoF OS</span>
        <span className="hidden rounded-full border border-[var(--mint)]/25 px-2 py-[1px] text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--mint)]/90 sm:inline">Demo · synthetic data</span>
      </div>
      <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex" data-testid="strip-guarantees">
        {items.map(([k, v, hot]) => (
          <div key={k} className="flex items-center gap-1.5 px-2.5 text-[11.5px] text-[var(--pale)]/60">
            <span>{k}</span>
            <span className={'tnum font-semibold ' + (hot ? 'text-[#F0C7BE]' : 'text-[var(--mint)]')} data-testid={`text-guarantee-${k}`}>{v}</span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2.5 text-[12px] text-[var(--pale)]/60 xl:ml-0">
        <span className="hidden sm:inline">Signed in as</span>
        <span className="font-medium text-[var(--pale-2)]">Partner (demo)</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sage)]/30 text-[11px] font-semibold text-[var(--mint)]">PD</span>
      </div>
    </header>
  );
}
