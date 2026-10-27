import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStore } from '@/state/store';

export function SourceDialog() {
  const { source, openSource } = useStore();
  return (
    <Dialog open={!!source} onOpenChange={(o) => !o && openSource(null)}>
      <DialogContent className="max-w-md border-card-border bg-card">
        <DialogHeader>
          <div className="eyebrow">Where this comes from</div>
          <DialogTitle className="text-[17px] font-semibold tracking-[-0.02em]">{source?.label}</DialogTitle>
          <DialogDescription className="text-[12px]">Every figure Scribe shows carries this card. In production the document opens at the page or the timestamp.</DialogDescription>
        </DialogHeader>
        {source && (
          <div className="space-y-3 text-[12.5px]" data-testid="dialog-source">
            <div className="divide-y rounded-lg border">
              <Row k="Document" v={source.doc} />
              {source.loc && <Row k="Location" v={source.loc} />}
              {source.conf != null && <Row k="Confidence" v={`${Math.round(source.conf * 100)}%${source.ind ? ' · indicative: read from a chart, not confirmed' : ''}`} />}
              <Row k="Confirmed by" v={source.by ?? (source.ind ? 'Not yet confirmed' : 'Recorded in the activity log')} />
            </div>
            {source.snip && <blockquote className="rounded-r-md border-l-2 border-[var(--sage)] bg-[#F2F8F2] px-3 py-2 leading-relaxed text-foreground/85">{source.snip}</blockquote>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
