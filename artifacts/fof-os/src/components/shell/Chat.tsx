import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, Check, ChevronRight, FileText, LayoutPanelLeft, Mic, Paperclip, Square, Volume2, VolumeX, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStore, type Attachment, type Message } from '@/state/store';
import { respond, respondToFiles, SAMPLES, type Effects } from '@/data/scribe';
import { SUGGESTIONS } from '@/data/screens';
import { LEVELS } from '@/data/trust';
import { SAMPLE_EMAIL, SAMPLE_MEMO } from '@/data/signals';
import { SourceChip } from '@/components/kit';
import mark from '@/assets/brand/favicon.png';

const uid = () => Math.random().toString(36).slice(2, 10);

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export function Chat({ current, wsOpen, onToggleScreens }: { current: number | null; wsOpen: boolean; onToggleScreens: () => void }) {
  const store = useStore();
  const { threads, activeThread, level, voice, setVoice, pushMessage, patchMessage } = store;
  const thread = threads.find((t) => t.id === activeThread)!;
  const [text, setText] = useState('');
  const [files, setFiles] = useState<Attachment[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [rec, setRec] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef<SpeechRec | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  const busy = thread.msgs.some((m) => m.streaming);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [thread.msgs.length, activeThread]);

  const fx = (): Effects => {
    const s = storeRef.current;
    return {
      openScreen: s.openScreen,
      setUI: (p) => s.setUI(p),
      addSample: (w) => s.addConversation(w === 'email' ? SAMPLE_EMAIL : SAMPLE_MEMO),
      draftLetter: () => s.setLetterAgent(true),
      block: s.block,
      pause: s.pause,
      log: (a, o, d) => s.logEvent('Scribe', a, o, d),
    };
  };

  const send = async (override?: string) => {
    const body = (override ?? text).trim();
    if ((!body && files.length === 0) || busy) return;
    const atts = files;
    const raws = rawFiles;
    pushMessage({ id: uid(), role: 'user', text: body, attachments: atts.length ? atts : undefined });
    setText(''); setFiles([]); setRawFiles([]);
    let reply;
    if (atts.length && !body) {
      let preview: string | undefined;
      const tf = raws.find((f) => f.type.startsWith('text') || /\.(txt|md|csv|eml|json)$/i.test(f.name));
      if (tf) preview = (await tf.text()).slice(0, 220).replace(/\s+/g, ' ');
      reply = respondToFiles(atts.map((a) => a.name), preview);
    } else reply = respond(body, level);
    const id = uid();
    window.setTimeout(() => {
      pushMessage({ id, role: 'scribe', streaming: true, ...reply.msg });
      if (reply.run) window.setTimeout(() => reply.run?.(fx()), 300 + (reply.msg.steps?.length ?? 0) * 320);
    }, 260);
  };

  const onDone = (m: Message) => {
    patchMessage(m.id, { streaming: false });
    if (voice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(m.text);
      u.lang = 'en-GB';
      window.speechSynthesis.speak(u);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setRawFiles((r) => [...r, ...arr]);
    setFiles((f) => [...f, ...arr.map((x) => ({ name: x.name, size: x.size, type: x.type, url: x.type.startsWith('image/') ? URL.createObjectURL(x) : undefined }))]);
  };

  const toggleMic = () => {
    if (rec) { recRef.current?.stop(); return; }
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) { setInterim('Voice input is not available in this browser. Try the sample voice memo.'); window.setTimeout(() => setInterim(''), 3200); return; }
    const r = new Ctor();
    r.lang = 'en-GB'; r.interimResults = true; r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results).map((x) => x[0].transcript).join(' ');
      setInterim(t); setText(t);
    };
    r.onend = () => { setRec(false); setInterim(''); };
    r.onerror = () => { setRec(false); setInterim(''); };
    recRef.current = r;
    r.start(); setRec(true);
  };

  const suggestions = SUGGESTIONS[current ?? 0] ?? SUGGESTIONS[0];
  const paused = level === 0;

  return (
    <section
      className="relative flex min-w-0 flex-1 flex-col bg-background"
      onDragOver={(e: DragEvent) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
    >
      {drag && (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--sage)] bg-[#EEF6EE]/90 text-[14px] font-medium text-[var(--ink-2)]">
          Drop documents, photos or recordings. They stay in your browser.
        </div>
      )}
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b bg-card/70 px-4 backdrop-blur">
        <span className="relative flex h-2 w-2">
          {!paused && <span className="breathe absolute inset-0 rounded-full bg-[var(--sage)]" />}
          <span className={cn('relative h-2 w-2 rounded-full', paused ? 'bg-muted-foreground/50' : 'bg-[var(--sage)]')} />
        </span>
        <span className="text-[13px] font-semibold">Scribe</span>
        <span className="hidden truncate text-[12px] text-muted-foreground md:inline" data-testid="text-scribe-status">
          {paused ? 'paused by a partner' : `L${level} ${LEVELS[level].n}`} · reads, drafts, proposes; never sends
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setVoice(!voice)} data-testid="button-voice-replies"
            className={cn('flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] transition-colors', voice ? 'bg-[var(--mint)]/50 text-foreground' : 'text-muted-foreground hover:bg-secondary')}>
            {voice ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden whitespace-nowrap xl:inline">Voice replies: {voice ? 'on' : 'off'}</span>
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary" data-testid="button-samples">
                <FileText className="h-3.5 w-3.5" /> Samples
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 border-card-border p-1.5">
              <div className="eyebrow px-2 pb-1 pt-1.5">Prepared synthetic inputs</div>
              {SAMPLES.map((s) => (
                <button key={s.key} onClick={() => send(s.prompt)} data-testid={`button-sample-${s.key}`}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-secondary">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--sage)]" />
                  <span><span className="block text-[12.5px] font-medium">{s.label}</span><span className="block text-[11.5px] text-muted-foreground">{s.hint}</span></span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button onClick={onToggleScreens} data-testid="button-toggle-screens"
            className={cn('flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors', wsOpen ? 'bg-[var(--ink)] text-[var(--pale-2)]' : 'text-muted-foreground hover:bg-secondary')}>
            <LayoutPanelLeft className="h-3.5 w-3.5" /> Screens
          </button>
        </div>
      </div>

      <div ref={streamRef} className="scroll-quiet flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-5 pb-6 pt-7">
          {thread.msgs.length === 0 ? <Landing onAsk={send} /> : thread.msgs.map((m) =>
            m.role === 'user' ? <UserMsg key={m.id} m={m} /> : <ScribeMsg key={m.id} m={m} onDone={onDone} />,
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-2 flex gap-1.5 overflow-x-auto scroll-quiet pb-0.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={busy} data-testid={`button-suggestion-${s.slice(0, 18)}`}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[11.5px] text-foreground/80 transition-colors hover:border-[var(--sage)] hover:text-foreground disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card px-3 pb-2 pt-2.5 shadow-[0_8px_30px_-12px_hsl(128_30%_12%/0.18)] transition-colors focus-within:border-[var(--sage)]">
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {files.map((f, i) => (
                  <span key={i} className="flex items-center gap-2 rounded-lg border bg-secondary/60 py-1 pl-1.5 pr-1 text-[11.5px]">
                    {f.url ? <img src={f.url} alt="" className="h-6 w-6 rounded object-cover" /> : <FileText className="h-3.5 w-3.5 text-[var(--sage)]" />}
                    <span className="max-w-[160px] truncate">{f.name}</span>
                    <span className="text-muted-foreground">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                    <button onClick={() => { setFiles((x) => x.filter((_, j) => j !== i)); setRawFiles((x) => x.filter((_, j) => j !== i)); }} className="rounded p-0.5 hover:bg-card" aria-label="Remove"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Message Scribe, or drop a report, an email, a photo or a recording"
              className="max-h-40 min-h-[40px] w-full resize-none bg-transparent px-1 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
              data-testid="input-message"
            />
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <button onClick={() => fileRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title="Add files: documents, photos, recordings" data-testid="button-attach"><Paperclip className="h-4 w-4" /></button>
              <button onClick={toggleMic} title="Talk to Scribe: click to start, click again to stop" data-testid="button-mic"
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', rec ? 'bg-[hsl(var(--bad))] text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                {rec ? <Square className="h-3 w-3 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
              <span className="ml-1 min-w-0 flex-1 truncate text-[11.5px] italic text-muted-foreground">{rec ? (interim || 'Listening...') : interim}</span>
              <button onClick={() => send()} disabled={busy || (!text.trim() && files.length === 0)} data-testid="button-send"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--pale-2)] transition-[opacity,transform] hover:bg-[var(--ink-2)] active:scale-95 disabled:opacity-30" aria-label="Send">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Scribe reads, drafts and proposes. It never sends a message, writes a record or takes a decision without you.</p>
        </div>
      </div>
    </section>
  );
}

function Landing({ onAsk }: { onAsk: (s: string) => void }) {
  const roles: [string, string, string[]][] = [
    ['Managing partner', 'Monday 08:30', ['Give me the Monday brief', 'Who is raising a successor fund?']],
    ['Investment team', 'Monday 08:00', ['What do we know about Meridian Ridge Partners?', 'Prepare the reference call for Meridian Ridge']],
    ['Portfolio and LP', 'Monday 09:00', ['Why is Harbor Peak Ventures flagged?', 'Draft the manager developments paragraph for the LP letter']],
    ['Operations', 'Monday 09:30', ['Check the Northwind capital call notice', 'Which managers are overdue on their Q3 report?']],
  ];
  return (
    <div className="rise pt-4">
      <div className="mb-1 flex items-center gap-2.5">
        <img src={mark} alt="" className="h-6 w-6" />
        <span className="eyebrow">Monday 2 November 2026 · demo clock</span>
      </div>
      <h2 className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-foreground text-balance">
        Scribe prepares the work. <span className="text-[var(--sage)]">A person decides.</span> The log remembers.
      </h2>
      <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed text-muted-foreground">
        Ask about a manager, a figure or a notice, or hand over an email or a recording. Every answer shows its steps and where each figure comes from.
      </p>
      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
        {roles.map(([r, when, qs], i) => (
          <div key={r} className="rise rounded-xl border border-card-border bg-card p-3.5" style={{ animationDelay: `${80 + i * 60}ms` }}>
            <div className="mb-2 flex items-baseline justify-between"><span className="text-[12.5px] font-semibold">{r}</span><span className="text-[10.5px] text-muted-foreground">{when}</span></div>
            {qs.map((q) => (
              <button key={q} onClick={() => onAsk(q)} data-testid={`button-starter-${q.slice(0, 16)}`}
                className="group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-foreground/80 transition-colors hover:bg-[#EEF6EE] hover:text-foreground">
                <span>{q}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sage)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserMsg({ m }: { m: Message }) {
  return (
    <div className="rise flex max-w-[78%] flex-col items-end gap-1.5 self-end">
      {m.attachments && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {m.attachments.map((a, i) => a.url
            ? <img key={i} src={a.url} alt={a.name} className="max-h-44 rounded-xl border" />
            : <span key={i} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-[12px]"><FileText className="h-3.5 w-3.5 text-[var(--sage)]" />{a.name}<span className="text-muted-foreground">{Math.max(1, Math.round(a.size / 1024))} KB · local</span></span>)}
        </div>
      )}
      {m.text && <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--ink)] px-3.5 py-2 text-[13.5px] leading-relaxed text-[var(--pale-2)]">{m.text}</div>}
    </div>
  );
}

function ScribeMsg({ m, onDone }: { m: Message; onDone: (m: Message) => void }) {
  const { openScreen } = useStore();
  const steps = m.steps ?? [];
  const [stepN, setStepN] = useState(m.streaming ? 0 : steps.length);
  const [chars, setChars] = useState(m.streaming ? 0 : m.text.length);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const msgRef = useRef(m);
  msgRef.current = m;

  useEffect(() => {
    if (!m.streaming) return;
    let cancelled = false;
    let s = 0, c = 0;
    const tick = () => {
      if (cancelled) return;
      if (s < steps.length) { s++; setStepN(s); window.setTimeout(tick, 320); return; }
      if (c < m.text.length) { c = Math.min(m.text.length, c + 4); setChars(c); window.setTimeout(tick, 14); return; }
      doneRef.current(msgRef.current);
    };
    window.setTimeout(tick, 200);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.id]);

  const typing = m.streaming && chars < m.text.length;
  const complete = !m.streaming || chars >= m.text.length;

  return (
    <div className="rise grid grid-cols-[28px_1fr] gap-3" data-testid={`message-scribe-${m.id}`}>
      <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-full', m.refused ? 'bg-[hsl(var(--bad-bg))]' : 'bg-[var(--ink)]')}>
        <img src={mark} alt="" className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <div className="mb-1.5 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Scribe</span> · draft for your review</div>
        {steps.length > 0 && (
          <div className="mb-2.5 inline-flex min-w-[260px] flex-col gap-0.5 rounded-lg border bg-card px-3 py-2 text-[11.5px] text-muted-foreground">
            {steps.map((s, i) => (
              <div key={i} className={cn('flex items-center gap-2 transition-opacity duration-300', i < stepN ? 'opacity-100' : 'opacity-0')}>
                {i < stepN - 1 || (i === stepN - 1 && chars > 0) || !m.streaming ? <Check className="h-3 w-3 text-[var(--sage)]" /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--sage)] mx-[3px]" />}
                {s}
              </div>
            ))}
          </div>
        )}
        <p className={cn('text-[13.5px] leading-[1.65] text-foreground', typing && 'caret')}>{m.text.slice(0, chars)}</p>
        {complete && (
          <div className="rise">
            {m.blocks?.map((b, i) => {
              if (b.kind === 'list') return <ul key={i} className="mt-2.5 space-y-1 border-l-2 border-[var(--mint)] pl-3 text-[12.5px] leading-relaxed text-foreground/85">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>;
              if (b.kind === 'kv') return (
                <div key={i} className="mt-2.5 divide-y rounded-lg border bg-card text-[12.5px]">
                  {b.rows.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-1.5"><span className="text-muted-foreground">{k}</span><span className="tnum">{v}</span></div>)}
                </div>
              );
              return <div key={i} className={cn('mt-2.5 rounded-lg px-3 py-2 text-[12.5px]', `bg-[hsl(var(--${b.tone}-bg))] text-[hsl(var(--${b.tone}))]`)}>{b.text}</div>;
            })}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3">
                <div className="eyebrow mb-1.5">Where this comes from</div>
                <div className="flex flex-wrap gap-1">{m.sources.map((s, i) => <SourceChip key={i} source={s} />)}</div>
              </div>
            )}
            {m.screen != null && (
              <button onClick={() => openScreen(m.screen!)} data-testid={`button-open-screen-${m.screen}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium transition-colors hover:border-[var(--sage)]">
                <span className="tnum flex h-4 w-4 items-center justify-center rounded bg-[var(--ink)] text-[9.5px] text-[var(--mint)]">{m.screen}</span>
                Open {m.screenLabel}
                <ChevronRight className="h-3 w-3 text-[var(--sage)]" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
