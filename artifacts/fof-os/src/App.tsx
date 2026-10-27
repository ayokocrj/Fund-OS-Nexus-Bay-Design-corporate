import { useEffect, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation, useRoute } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { StoreProvider, useStore } from '@/state/store';
import { TopBar } from '@/components/shell/TopBar';
import { Rail } from '@/components/shell/Rail';
import { Chat } from '@/components/shell/Chat';
import { Workspace } from '@/components/shell/Workspace';
import { SourceDialog } from '@/components/shell/SourceDialog';

function Shell() {
  const [match, params] = useRoute<{ id: string }>('/screens/:id');
  const [location] = useLocation();
  const id = match ? Number(params.id) : null;
  const screenId = id != null && Number.isInteger(id) ? id : null;
  const { openScreen, closeScreens } = useStore();
  const [menu, setMenu] = useState(false);
  const lastScreen = useRef(0);
  useEffect(() => { if (screenId != null && screenId >= 0 && screenId <= 11) lastScreen.current = screenId; }, [screenId]);

  return (
    <div className="flex h-[100dvh] flex-col">
      <TopBar onMenu={() => setMenu(true)} />
      <div className="flex min-h-0 flex-1">
        <div className="hidden lg:flex"><Rail current={screenId} /></div>
        {menu && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenu(false)}>
            <div className="absolute inset-0 bg-[var(--ink)]/40" />
            <div className="absolute inset-y-0 left-0 flex" onClick={(e) => e.stopPropagation()}><Rail current={screenId} onNavigate={() => setMenu(false)} /></div>
          </div>
        )}
        <Chat current={screenId} wsOpen={match} onToggleScreens={() => (match ? closeScreens() : openScreen(lastScreen.current))} />
        {match && screenId != null && (
          <ErrorBoundary resetKey={location}>
            <Workspace id={screenId} />
          </ErrorBoundary>
        )}
      </div>
      <SourceDialog />
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <StoreProvider>
          <Switch>
            <Route path="/" component={Shell} />
            <Route path="/screens/:id" component={Shell} />
            <Route component={NotFound} />
          </Switch>
        </StoreProvider>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
