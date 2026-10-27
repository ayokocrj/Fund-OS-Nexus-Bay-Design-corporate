import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCREENS, SCREEN_GROUPS } from '@/data/screens';
import { useStore } from '@/state/store';
import { HomeScreen } from '@/screens/HomeScreen';
import { SignalsScreen } from '@/screens/SignalsScreen';
import { ManagersScreen } from '@/screens/ManagersScreen';
import { DiligenceScreen } from '@/screens/DiligenceScreen';
import { MonitorScreen } from '@/screens/MonitorScreen';
import { LetterScreen } from '@/screens/LetterScreen';
import { LpQuestionsScreen } from '@/screens/LpQuestionsScreen';
import { OperationsScreen } from '@/screens/OperationsScreen';
import { StartupScreen } from '@/screens/StartupScreen';
import { HarnessScreen } from '@/screens/HarnessScreen';
import { ReadoutScreen } from '@/screens/ReadoutScreen';
import { RoadmapScreen } from '@/screens/RoadmapScreen';

const VIEWS = [HomeScreen, SignalsScreen, ManagersScreen, DiligenceScreen, MonitorScreen, LetterScreen, LpQuestionsScreen, OperationsScreen, StartupScreen, HarnessScreen, ReadoutScreen, RoadmapScreen];

export function Workspace({ id }: { id: number }) {
  const { closeScreens } = useStore();
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [id]);
  const View = VIEWS[id];
  return (
    <aside className="fixed inset-x-0 bottom-0 top-[52px] z-20 flex flex-col border-l bg-[#F7FAF7] shadow-[-12px_0_40px_-20px_hsl(128_30%_10%/0.25)] xl:static xl:z-auto xl:w-[52%] xl:max-w-[920px] xl:shrink-0 xl:shadow-none" data-testid="panel-workspace">
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-card px-2.5 py-1.5 scroll-quiet">
        {SCREEN_GROUPS.map((g, gi) => (
          <div key={g} className="flex shrink-0 items-center gap-0.5">
            {gi > 0 && <span className="mx-1.5 h-4 w-px bg-border" />}
            {SCREENS.filter((s) => s.group === g).map((s) => (
              <Link key={s.id} href={`/screens/${s.id}`} data-testid={`tab-screen-${s.id}`}
                className={cn('flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] transition-colors', s.id === id ? 'bg-[var(--ink)] text-[var(--pale-2)]' : 'text-foreground/70 hover:bg-secondary hover:text-foreground')}>
                <span className={cn('tnum text-[10px]', s.id === id ? 'text-[var(--mint)]' : 'text-muted-foreground')}>{s.id}</span>{s.short}
              </Link>
            ))}
          </div>
        ))}
        <button onClick={closeScreens} className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close screens" data-testid="button-close-workspace"><X className="h-4 w-4" /></button>
      </div>
      <div ref={mainRef} className="scroll-quiet flex-1 overflow-y-auto">
        <div key={id} className="px-5 pb-12 pt-5 md:px-7">
          {View ? <View /> : <div className="py-20 text-center text-sm text-muted-foreground">There is no screen {id}. The firm's screens are numbered 0 to 11.</div>}
        </div>
      </div>
    </aside>
  );
}
