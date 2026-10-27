import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ArrowUp, Check, ChevronRight, FileSpreadsheet, FileText, KeyRound, LayoutPanelLeft, Mic, Paperclip, Sparkles, Square, Target, Volume2, VolumeX, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useStore, type Attachment, type Message } from '@/state/store';
import { respond, respondToFiles, SAMPLES, type Effects } from '@/data/scribe';
import { SUGGESTIONS } from '@/data/screens';
import { LEVELS } from '@/data/trust';
import { SAMPLE_EMAIL, SAMPLE_MEMO, type Conversation } from '@/data/signals';
import { SourceChip } from '@/components/kit';
import mark from '@/assets/brand/favicon.png';

const uid = () => Math.random().toString(36).slice(2, 10);
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file
const LS_GEMINI_KEY = 'nexus_gemini_api_key';
const LS_PROSPECT_TARGET = 'nexus_prospect_target';
const LS_DEAL_NAME = 'nexus_deal_name';

export interface HinckleyModelItem {
  id: string;
  filename: string;
  moduleCode: string;
  title: string;
  category: string;
  useCaseHook: string;
}

const DEFAULT_HINCKLEY_MODELS: HinckleyModelItem[] = [
  {
    id: 'growth-before-after-v6',
    filename: 'Financial-modeling-Growth-Before-After-v6.xlsx',
    moduleCode: 'M1',
    title: 'Master Growth Model (Before/After + Pre-Money Options + Cohorts + Valuation)',
    category: 'Cap Table, Pre-Money Options & Valuation',
    useCaseHook: 'Compare Post-Money vs Pre-Money Option Pool dilution, Cohort Retention (End), IRR/MOIC Sensitivities & Valuation.',
  },
  {
    id: 'saas-practice-2-solution',
    filename: 'Financial-modeling-SaaS-practice-2-SOLUTION-v2.xlsx',
    moduleCode: 'M2',
    title: 'SaaS Practice 2 Solution (Billing Waterfall, R&D Capitalizations, SaaS KPIs, Cohorts, ARR)',
    category: 'SaaS Complete Diligence (QoE + Billings + Cohorts)',
    useCaseHook: 'Audit Billing Waterfall vs GAAP Revenue, Capitalized R&D impact on EBITDA, Magic Number, and Cohort NRR/GRR.',
  },
  {
    id: 'saas-practice-3-solution',
    filename: 'Financial-modeling-SaaS-practice-3-SOLUTION-v3-1.xlsx',
    moduleCode: 'M3',
    title: 'SaaS Practice 3 Solution (Transaction, Billing Waterfall, Capitalizations, Cohorts, 197 Customers)',
    category: 'SaaS Complete Diligence v3 (Series B/C Deal)',
    useCaseHook: 'Reconcile 197 customer ARR rows to ARR Waterfall, Deferred Revenue bridge, and Burdened Cash EBITDA.',
  },
  {
    id: 'saas-practice-1-solution',
    filename: 'Financial-modeling-SaaS-practice-1-SOLUTION.xlsx',
    moduleCode: 'M4',
    title: 'SaaS Practice 1 Solution (ARR Waterfall, Cohort Matrix & 4,995 Customer ARR Rows)',
    category: 'Customer Cohort & ARR Bridge (4,995 rows)',
    useCaseHook: 'Stress-test Beginning ARR + New + Expansion - Churn = Ending ARR and detect logo churn vs net dollar retention.',
  },
  {
    id: 'growth-practice-1-end',
    filename: 'Financial-Modeling-Growth-Practice-1-End-v2.xlsx',
    moduleCode: 'M5',
    title: 'Growth Modeling Practice 1 Solution (3-Statement Model + Revenue Build)',
    category: '3-Statement & Revenue Build',
    useCaseHook: 'Evaluate 3-statement operating model (203 rows, 717 formulas) and bottom-up Revenue Build.',
  },
  {
    id: 'growth-practice-2-end',
    filename: 'Financial-Modeling-Growth-Practice-2-End-v3.xlsx',
    moduleCode: 'M6',
    title: 'Growth Modeling Practice 2 Solution (Operating Model + Multi-Segment Revenue Build)',
    category: 'Operating Model & Revenue Build',
    useCaseHook: 'Challenge management revenue build (46 rows, 225 formulas) and operating margin trajectory.',
  },
  {
    id: 'paper-lbo',
    filename: 'Financial-modeling-Paper-LBO-BEFORE.xlsx',
    moduleCode: 'M7',
    title: 'Paper LBO Model (Guided & Blank Growth Buyout Templates)',
    category: 'Paper LBO & IRR / MOIC Returns',
    useCaseHook: 'Run rapid IC Paper LBO test: entry multiple, debt paydown, EBITDA growth, exit multiple, MOIC & IRR.',
  },
  {
    id: 'saas-vfinal-headcount',
    filename: 'Financial-modeling-SaaS-vFinal-Start (1).xlsx',
    moduleCode: 'M8',
    title: 'SaaS vFinal Operating Model (Raw Customer ARR, Financials, Headcount Ramp, Expenses)',
    category: 'SaaS Financials, Headcount & OpEx Burn',
    useCaseHook: 'Analyze headcount hiring plan (30 rows, 215 formulas), departmental OpEx burn, and sales capacity.',
  },
  {
    id: 'growth-practice-1-start',
    filename: 'Financial-Modeling-Growth-Practice-1-Start-3.xlsx',
    moduleCode: 'M9',
    title: 'Growth Modeling Practice 1 (Start Template)',
    category: 'Data Room Start Template',
    useCaseHook: 'Unadjusted management base case before growth equity diligence adjustments.',
  },
  {
    id: 'growth-practice-2-start',
    filename: 'Financial-Modeling-Growth-Practice-2-Start.xlsx',
    moduleCode: 'M10',
    title: 'Growth Modeling Practice 2 (Start Template)',
    category: 'Data Room Start Template',
    useCaseHook: 'Initial operating model and revenue build before stress-testing.',
  },
  {
    id: 'saas-practice-1-start',
    filename: 'Financial-modeling-SaaS-practice-1-START.xlsx',
    moduleCode: 'M11',
    title: 'SaaS Practice 1 (Raw Customer ARR Export - 4,995 rows)',
    category: 'Raw Data Room Export',
    useCaseHook: 'Raw customer-level ARR dump before cohort and waterfall structuring.',
  },
  {
    id: 'saas-practice-2-start',
    filename: 'Financial-modeling-SaaS-practice-2-START.xlsx',
    moduleCode: 'M12',
    title: 'SaaS Practice 2 (Primary Assumptions & Raw Customer ARR)',
    category: 'Raw Data Room Export',
    useCaseHook: 'Unadjusted company model and raw customer ARR table from the data room.',
  },
  {
    id: 'saas-practice-3-start',
    filename: 'Financial-modeling-SaaS-practice-3-START-1.xlsx',
    moduleCode: 'M13',
    title: 'SaaS Practice 3 (Raw Data Room Model & Customer ARR)',
    category: 'Raw Data Room Export',
    useCaseHook: 'Initial management model before QoE and billing waterfall adjustments.',
  },
  {
    id: 'saas-vfinal-start-2',
    filename: 'Financial-modeling-SaaS-vFinal-Start (2).xlsx',
    moduleCode: 'M14',
    title: 'SaaS vFinal Operating Model (Copy 2)',
    category: 'Data Room Start Template',
    useCaseHook: 'Full SaaS financials, headcount, and expense build template.',
  },
];

const PROSPECT_PRESETS = [
  'Nexus Bay (FoF & Growth Co-Invest)',
  'PROfounders Capital',
  'Summit Partners',
  'General Atlantic',
  'Eurazeo Growth',
  'Partech Growth',
  'PSG Equity',
];

interface ServerReadFact {
  field: string;
  value: string;
  confidence: number;
  quote: string;
  page_or_time: string;
  indicative?: boolean;
}

interface ServerReadResponse {
  mode?: 'live' | 'local';
  model?: string;
  summary?: string;
  document_type?: string;
  facts?: ServerReadFact[];
  entities?: string[];
  tasks?: Array<string | { task?: string; t?: string; owner?: string }>;
  transcript?: string | null;
  quotes_rejected?: number;
  indicative?: boolean;
  error?: string;
  message?: string;
}

interface ServerAskResponse {
  mode?: 'live' | 'local';
  model?: string;
  answer?: string;
  text?: string;
  steps?: string[];
  sources?: Array<{ label: string; doc: string; loc?: string; snip?: string; conf?: number; ind?: boolean }>;
  refused?: boolean;
  screen?: number;
  screenLabel?: string;
  error?: string;
  message?: string;
}

function matchOrgId(entities: string[] = [], text = ''): string | null {
  const joined = `${entities.join(' ')} ${text}`.toLowerCase();
  if (joined.includes('meridian')) return 'm01';
  if (joined.includes('harbor')) return 'm02';
  if (joined.includes('coral bend')) return 'm03';
  if (joined.includes('northwind')) return 'm04';
  if (joined.includes('granite fork')) return 'm05';
  if (joined.includes('lantern hill')) return 'm06';
  if (joined.includes('saltmarsh')) return 'm07';
  if (joined.includes('bluefern')) return 'm08';
  return 'm01';
}

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

function isLikelyFrench(text: string): boolean {
  return /[éèêëàâùûçœ]|(\b(le|la|les|des|une|nous|vous|est|sont|dans|pour|avec|sur|cette|modèle|analyse|fonds)\b)/i.test(text);
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return;
  try {
    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      try {
        const cleanText = text.replace(/[#*`|_~]/g, ' ').replace(/\s+/g, ' ').trim();
        const u = new SpeechSynthesisUtterance(cleanText);
        const fr = isLikelyFrench(cleanText);
        u.lang = fr ? 'fr-FR' : 'en-GB';
        u.rate = 1.03;
        const voices = window.speechSynthesis.getVoices?.() ?? [];
        const preferred = fr
          ? (voices.find((v) => v.lang.toLowerCase().startsWith('fr') && /natural|google|denise|henri|eloise/i.test(v.name)) ??
             voices.find((v) => v.lang.toLowerCase().startsWith('fr')))
          : (voices.find((v) => v.lang.toLowerCase().startsWith('en-gb') && /natural|google|libby|sonia|ryan/i.test(v.name)) ??
             voices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ??
             voices.find((v) => v.lang.toLowerCase().startsWith('en')));
        if (preferred) u.voice = preferred;
        window.speechSynthesis.speak(u);
      } catch {
        // ignore speech synthesis errors
      }
    }, 60);
  } catch {
    // ignore speech synthesis errors
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result ?? '');
      const idx = res.indexOf(',');
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let cachedBrowserGeminiModel = 'gemini-2.5-flash-lite';

async function callGeminiDirectFromBrowser(opts: {
  apiKey: string;
  prompt: string;
  systemInstruction?: string;
  inlineMedia?: { mimeType: string; dataBase64: string };
}): Promise<string> {
  const parts: Array<Record<string, unknown>> = [];
  if (opts.inlineMedia) {
    parts.push({
      inlineData: {
        mimeType: opts.inlineMedia.mimeType,
        data: opts.inlineMedia.dataBase64,
      },
    });
  }
  parts.push({ text: opts.prompt });

  const bodyStr = JSON.stringify({
    ...(opts.systemInstruction
      ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } }
      : {}),
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.2 },
  });

  const tryCall = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: bodyStr,
      },
    );

  let res = await tryCall(cachedBrowserGeminiModel);
  if (res.status === 404) {
    const errText = await res.text().catch(() => '');
    const recMatches = [...errText.matchAll(/models\/([a-zA-Z0-9._-]+)/g)]
      .map((m) => m[1])
      .filter((m) => m && m !== cachedBrowserGeminiModel);

    const candidates = [
      ...recMatches,
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
    ];

    for (const c of candidates) {
      if (!c) continue;
      const retry = await tryCall(c);
      if (retry.ok) {
        cachedBrowserGeminiModel = c;
        res = retry;
        break;
      }
    }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }
  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || '';
}

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
  const [fromMic, setFromMic] = useState(false);

  // Live Gemini API Key & Growth Equity Studio state
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_GEMINI_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [keyInput, setKeyInput] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_GEMINI_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [serverLive, setServerLive] = useState(false);
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [prospectTarget, setProspectTarget] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_PROSPECT_TARGET) || 'Nexus Bay (FoF & Growth Co-Invest)';
    } catch {
      return 'Nexus Bay (FoF & Growth Co-Invest)';
    }
  });
  const [dealName, setDealName] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_DEAL_NAME) || 'Nimbus Ledger (Series B SaaS)';
    } catch {
      return 'Nimbus Ledger (Series B SaaS)';
    }
  });
  const [hinckleyModels, setHinckleyModels] = useState<HinckleyModelItem[]>(DEFAULT_HINCKLEY_MODELS);
  const [activeExcelModel, setActiveExcelModel] = useState<{ title: string; filename: string; markdown: string } | null>(null);
  const [thinkingText, setThinkingText] = useState<string | null>(null);

  const recRef = useRef<SpeechRec | null>(null);
  const recActiveRef = useRef(false);
  const micTranscriptRef = useRef('');
  const recTimerRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  const isGeminiReady = Boolean(apiKey.trim()) || serverLive;
  const busy = Boolean(thinkingText) || thread.msgs.some((m) => m.streaming);

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [thread.msgs.length, activeThread, thinkingText]);

  // Sync API key & fetch Hinckley models catalog on mount
  useEffect(() => {
    fetch('/healthz')
      .then((r) => r.json())
      .then((d: { hasApiKey?: boolean; mode?: string }) => {
        if (d.hasApiKey || d.mode === 'live') setServerLive(true);
      })
      .catch(() => {});

    fetch('/growth-models')
      .then((r) => r.json())
      .then((d: { models?: HinckleyModelItem[] }) => {
        if (Array.isArray(d.models) && d.models.length > 0) {
          setHinckleyModels(d.models);
        }
      })
      .catch(() => {});

    const savedKey = localStorage.getItem(LS_GEMINI_KEY)?.trim();
    if (savedKey) {
      fetch('/api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apiKey: savedKey }),
      })
        .then((r) => r.json())
        .then((d: { hasApiKey?: boolean }) => {
          if (d.hasApiKey) setServerLive(true);
        })
        .catch(() => {});
    }
  }, []);

  const saveGeminiKey = async (rawKey: string) => {
    const clean = rawKey.trim();
    setApiKey(clean);
    setKeyInput(clean);
    try {
      if (clean) localStorage.setItem(LS_GEMINI_KEY, clean);
      else localStorage.removeItem(LS_GEMINI_KEY);
    } catch {
      // ignore storage errors
    }
    try {
      const res = await fetch('/api-key', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ apiKey: clean }),
      });
      if (res.ok) {
        const d = (await res.json()) as { hasApiKey?: boolean };
        setServerLive(Boolean(d.hasApiKey));
      }
    } catch {
      // Direct browser calls will still work with apiKey
    }
    setKeyPopoverOpen(false);
  };

  const updateProspectTarget = (val: string) => {
    setProspectTarget(val);
    try {
      localStorage.setItem(LS_PROSPECT_TARGET, val);
    } catch {
      // ignore
    }
  };

  const updateDealName = (val: string) => {
    setDealName(val);
    try {
      localStorage.setItem(LS_DEAL_NAME, val);
    } catch {
      // ignore
    }
  };

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

  const loadHinckleyExcelUseCase = async (model: HinckleyModelItem, customPrompt?: string) => {
    if (busy) return;
    setStudioOpen(false);
    const userPrompt =
      customPrompt ||
      `[Cible de prospection : ${prospectTarget} · Deal : ${dealName}] Charge et analyse le livrable Excel de Mike Hinckley "${model.filename}" (${model.category}). ${model.useCaseHook}`;

    pushMessage({
      id: uid(),
      role: 'user',
      text: userPrompt,
      attachments: [{ name: model.filename, size: 84 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }],
    });
    setThinkingText(`⏳ Lecture des onglets Excel de "${model.filename}" et analyse Gemini en cours...`);

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (apiKey.trim()) headers['x-gemini-api-key'] = apiKey.trim();

      const res = await fetch('/read', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          hinckleyModelId: model.id,
          text: userPrompt,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as ServerReadResponse;
        const factsList = Array.isArray(data.facts) ? data.facts : [];
        const modelName = data.mode === 'live' ? (data.model || 'gemini-2.5-flash') : 'Excel Parser + Scribe';

        if (data.transcript) {
          setActiveExcelModel({
            title: model.title,
            filename: model.filename,
            markdown: data.transcript,
          });
        }

        const conv: Conversation = {
          id: 'c-' + uid(),
          when: 'just now',
          ch: 'Excel (.xlsx)',
          from: `${model.category} · ${dealName}`,
          subj: `${prospectTarget} — ${model.title.slice(0, 56)}`,
          org: 'm01',
          status: 'to confirm',
          text: data.transcript || data.summary || model.title,
          facts: factsList.map((f, i) => ({
            id: `f${i + 1}`,
            f: f.field || 'Metric',
            v: String(f.value),
            conf: typeof f.confidence === 'number' ? f.confidence : 0.95,
            span: f.quote || f.page_or_time || model.filename,
            state: 'proposed' as const,
          })),
          tasks: (Array.isArray(data.tasks) ? data.tasks : []).map((t) =>
            typeof t === 'string'
              ? { t, owner: prospectTarget, state: 'proposed' as const }
              : { t: String(t.task ?? t.t ?? ''), owner: String(t.owner ?? prospectTarget), state: 'proposed' as const },
          ),
          crm: 'none',
        };

        storeRef.current.addConversation(conv);
        storeRef.current.openScreen(1);

        let detailedText = `${data.summary ?? `Modèle Excel ${model.filename} analysé.`}`;

        if (data.mode !== 'live' && apiKey.trim() && data.transcript) {
          try {
            const directAnalysis = await callGeminiDirectFromBrowser({
              apiKey: apiKey.trim(),
              systemInstruction:
                `Tu es un Partner Growth Equity & Fund-of-Funds utilisant les modèles financiers Excel de Mike Hinckley (Growth Equity Guide). ` +
                `Adapte ton analyse pour une démo destinée à la cible de prospection "${prospectTarget}" sur le deal "${dealName}". Sois précis, cite les chiffres exacts des onglets Excel et structure les points de due diligence.`,
              prompt: `Voici les données extraites du fichier Excel "${model.filename}" :\n\n${data.transcript.slice(0, 14000)}\n\nDemande : ${userPrompt}`,
            });
            if (directAnalysis) detailedText = directAnalysis;
          } catch {
            // keep summary from /read
          }
        }

        setThinkingText(null);
        pushMessage({
          id: uid(),
          role: 'scribe',
          streaming: true,
          text: detailedText,
          steps: [
            `Parsed "${model.filename}" tabs & formulas from Growth Equity Guide`,
            `Tailored diligence case for target: ${prospectTarget} (${dealName})`,
            `Analyzed with ${modelName} (${factsList.length} key spreadsheet rows extracted)`,
            'Loaded full Excel model into active memory for follow-up voice/text Q&A',
          ],
          blocks: factsList.length
            ? [
                {
                  kind: 'kv',
                  rows: factsList.map((f) => [
                    f.field,
                    `${f.value} (${f.page_or_time || 'Sheet'})`,
                  ] as [string, string]),
                },
              ]
            : undefined,
          sources: factsList.map((f) => ({
            label: f.field,
            doc: model.filename,
            loc: f.page_or_time || 'Excel Tab',
            snip: f.quote ? `"${f.quote}"` : undefined,
            conf: f.confidence,
          })),
          screen: 1,
          screenLabel: 'Signal capture',
        });
        return;
      }
    } catch {
      // fallback below
    } finally {
      setThinkingText(null);
    }
  };

  const send = async (override?: string, opts?: { fromVoice?: boolean; audioBlob?: Blob | null }) => {
    const body = (override ?? text).trim();
    if ((!body && files.length === 0 && !opts?.audioBlob) || busy) return;
    const atts = files;
    const raws = rawFiles;
    const isMicTranscript = Boolean(opts?.fromVoice || (fromMic && !override));
    setFromMic(false);
    pushMessage({
      id: uid(),
      role: 'user',
      text: body || (opts?.audioBlob ? '🎤 Message vocal (Audio Multimodal Gemini)' : ''),
      attachments: atts.length ? atts : undefined,
    });
    setText(''); setFiles([]); setRawFiles([]);

    const oversized = raws.find((f) => f.size > MAX_FILE_BYTES);
    if (oversized) {
      pushMessage({
        id: uid(),
        role: 'scribe',
        refused: true,
        text: `File "${oversized.name}" exceeds the 15 MB limit per file (${Math.round(oversized.size / (1024 * 1024))} MB). Please upload a file under 15 MB.`,
        steps: ['Checked file size limit (15 MB max per file)', 'Rejected oversized file before upload'],
      });
      return;
    }

    setThinkingText(
      opts?.audioBlob
        ? '🎤 Transcription vocale et analyse Gemini en cours...'
        : atts.length > 0
          ? `⏳ Lecture et analyse de "${atts[0].name}" avec Gemini en cours...`
          : '⏳ Réflexion de Gemini en cours...',
    );

    try {
      // If user recorded real audio from microphone, send voice-note.webm to backend /read (or browser Gemini)
      if (opts?.audioBlob && opts.audioBlob.size > 0 && !body) {
        const excelCtx = activeExcelModel
          ? `\n\nModèle Excel actif (${activeExcelModel.filename}) :\n${activeExcelModel.markdown.slice(0, 12000)}`
          : '';
        const voiceContextPrompt =
          `Cible de prospection : "${prospectTarget}". Deal analysé : "${dealName}". ` +
          `Transcris exactement ce que je viens de dire dans cet enregistrement vocal puis réponds immédiatement de manière complète et structurée.${excelCtx}`;

        try {
          const form = new FormData();
          const voiceFile = new File([opts.audioBlob], 'voice-note.webm', {
            type: opts.audioBlob.type || 'audio/webm',
          });
          form.append('file', voiceFile);
          form.append('text', voiceContextPrompt);
          if (apiKey.trim()) form.append('apiKey', apiKey.trim());
          const headers: Record<string, string> = {};
          if (apiKey.trim()) headers['x-gemini-api-key'] = apiKey.trim();

          const vRes = await fetch('/read', { method: 'POST', headers, body: form });
          if (vRes.ok) {
            const vData = (await vRes.json()) as ServerReadResponse;
            if (vData.mode === 'live' && vData.summary) {
              setThinkingText(null);
              pushMessage({
                id: uid(),
                role: 'scribe',
                streaming: true,
                text: vData.summary,
                steps: [
                  `Transcribed & answered live voice audio via ${vData.model || 'Gemini Multimodal'}`,
                  activeExcelModel
                    ? `Cross-checked with loaded Excel model: ${activeExcelModel.filename}`
                    : `Tailored for prospect target: ${prospectTarget}`,
                ],
                sources: activeExcelModel
                  ? [{ label: activeExcelModel.title, doc: activeExcelModel.filename, loc: 'Active Excel Model' }]
                  : [{ label: vData.model || 'Gemini Flash Audio', doc: 'Live voice session', loc: 'Microphone' }],
              });
              return;
            }
          }
        } catch {
          // fallback to browser direct call below
        }

        if (apiKey.trim()) {
          try {
            const b64Audio = await blobToBase64(opts.audioBlob);
            const answer = await callGeminiDirectFromBrowser({
              apiKey: apiKey.trim(),
              systemInstruction:
                `Tu es Scribe, l'agent multimodal Growth Equity & Fund-of-Funds propulsé par Gemini. ` +
                `Cible de prospection : "${prospectTarget}". Deal analysé : "${dealName}". ` +
                `Écoute cet enregistrement vocal, affiche d'abord "🎤 **Transcription :** ..." puis réponds directement avec une précision d'investissement institutionnelle.${excelCtx}`,
              prompt: `Transcris ce que je viens de dire dans cet audio puis réponds à ma demande de manière complète et structurée.`,
              inlineMedia: {
                mimeType: opts.audioBlob.type || 'audio/webm',
                dataBase64: b64Audio,
              },
            });
            if (answer) {
              setThinkingText(null);
              pushMessage({
                id: uid(),
                role: 'scribe',
                streaming: true,
                text: answer,
                steps: [
                  'Processed live microphone audio via Gemini Multimodal',
                  activeExcelModel ? `Cross-checked with loaded Excel model: ${activeExcelModel.filename}` : `Tailored for prospect target: ${prospectTarget}`,
                ],
                sources: activeExcelModel
                  ? [{ label: activeExcelModel.title, doc: activeExcelModel.filename, loc: 'Active Excel Model' }]
                  : [{ label: 'Gemini Flash Audio', doc: 'Live voice session', loc: 'Microphone' }],
              });
              return;
            }
          } catch {
            // continue to fallback
          }
        }
      }

      const runLocalFallback = async () => {
        if (apiKey.trim()) {
          try {
            let inlineMedia: { mimeType: string; dataBase64: string } | undefined;
            if (raws.length > 0 && (raws[0].type.startsWith('image/') || raws[0].type === 'application/pdf' || raws[0].type.startsWith('audio/'))) {
              inlineMedia = {
                mimeType: raws[0].type,
                dataBase64: await blobToBase64(raws[0]),
              };
            }
            const excelCtx = activeExcelModel
              ? `\n\nModèle Excel actif (${activeExcelModel.filename}) :\n${activeExcelModel.markdown.slice(0, 14000)}`
              : '';
            const directAnswer = await callGeminiDirectFromBrowser({
              apiKey: apiKey.trim(),
              systemInstruction:
                `Tu es Scribe, l'agent multimodal Growth Equity & Fund-of-Funds propulsé par Gemini. ` +
                `Cible de prospection : "${prospectTarget}". Deal analysé : "${dealName}". ` +
                `Tu maîtrises les 14 modèles Excel du Growth Equity Guide de Mike Hinckley (ARR Waterfall, Cohortes NRR/GRR, Billings vs GAAP Revenue, R&D Capitalization, Option Pool Pre/Post-Money, Paper LBO, QoE) ainsi que le portefeuille Nexus Bay. ` +
                `Réponds dans la langue de l'utilisateur (français ou anglais). Ne refuse jamais d'analyser ou de calculer.${excelCtx}`,
              prompt: body || `Analyse le fichier joint (${atts.map((a) => a.name).join(', ')}) pour notre démo destinée à ${prospectTarget}.`,
              inlineMedia,
            });
            if (directAnswer) {
              setThinkingText(null);
              pushMessage({
                id: uid(),
                role: 'scribe',
                streaming: true,
                text: directAnswer,
                steps: [
                  'Answered live by Gemini',
                  activeExcelModel ? `Used active Excel model: ${activeExcelModel.filename}` : `Prospect context: ${prospectTarget}`,
                ],
                sources: activeExcelModel
                  ? [{ label: activeExcelModel.title, doc: activeExcelModel.filename, loc: 'Excel Model' }]
                  : [{ label: 'Gemini', doc: `Prospect: ${prospectTarget}`, loc: 'Live Model' }],
              });
              return;
            }
          } catch {
            // fallback to local deterministic responder if API key is invalid
          }
        }

        let reply;
        if (atts.length && !body) {
          let preview: string | undefined;
          const tf = raws.find((f) => f.type.startsWith('text') || /\.(txt|md|csv|eml|json)$/i.test(f.name));
          if (tf) preview = (await tf.text()).slice(0, 220).replace(/\s+/g, ' ');
          reply = respondToFiles(atts.map((a) => a.name), preview);
        } else {
          reply = respond(body || 'Use a sample voice memo', level, isMicTranscript);
        }
        setThinkingText(null);
        const id = uid();
        window.setTimeout(() => {
          pushMessage({ id, role: 'scribe', streaming: true, ...reply.msg });
          if (reply.run) window.setTimeout(() => reply.run?.(fx()), 300 + (reply.msg.steps?.length ?? 0) * 320);
        }, 120);
      };

      // File uploads (Excel .xlsx, PDF, Image, Audio, Video, Text) go to /read
      if (atts.length > 0) {
        try {
          let res: Response;
          let localExtractedText = body;
          const headers: Record<string, string> = {};
          if (apiKey.trim()) headers['x-gemini-api-key'] = apiKey.trim();

          const promptWithTarget = body
            ? `[Cible : ${prospectTarget} · Deal : ${dealName}] ${body}`
            : `[Cible : ${prospectTarget} · Deal : ${dealName}] Analyse ce document en détail.`;

          if (raws.length > 0) {
            const tf = raws.find((f) => f.type.startsWith('text') || /\.(txt|md|csv|eml|json)$/i.test(f.name));
            if (tf && !localExtractedText) localExtractedText = await tf.text();
            const form = new FormData();
            form.append('file', raws[0]);
            form.append('text', promptWithTarget);
            if (apiKey.trim()) form.append('apiKey', apiKey.trim());
            res = await fetch('/read', { method: 'POST', headers, body: form });
          } else {
            headers['content-type'] = 'application/json';
            res = await fetch('/read', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                filename: atts[0]?.name || 'document.txt',
                mimeType: atts[0]?.type || 'text/plain',
                text: promptWithTarget,
                apiKey: apiKey.trim() || undefined,
              }),
            });
          }

          if (res.status === 413 || res.status === 429) {
            const err = (await res.json().catch(() => ({}))) as ServerReadResponse;
            setThinkingText(null);
            pushMessage({
              id: uid(),
              role: 'scribe',
              refused: true,
              text: res.status === 413
                ? 'File exceeds the 15 MB per-file limit.'
                : (err.message || 'Rate limit reached. Please wait before sending another request.'),
              steps: [res.status === 413 ? 'Checked 15 MB file limit' : 'Checked gateway rate limit'],
            });
            return;
          }

          if (!res.ok) {
            await runLocalFallback();
            return;
          }

          const data = (await res.json()) as ServerReadResponse;
          const isExcel = data.document_type === 'excel' || /\.xlsx?$/i.test(atts[0]?.name ?? '');
          if (data.mode === 'local' && !isExcel) {
            await runLocalFallback();
            return;
          }

          if (isExcel && data.transcript) {
            setActiveExcelModel({
              title: atts[0]?.name || 'Uploaded Excel Model',
              filename: atts[0]?.name || 'model.xlsx',
              markdown: data.transcript,
            });
          }

          const modelName = data.mode === 'live' ? (data.model || 'gemini-2.5-flash') : 'Excel Native Parser';
          const factsList = Array.isArray(data.facts) ? data.facts : [];
          const quotesRejected = data.quotes_rejected ?? 0;
          const readLine = `Read by ${modelName}, ${factsList.length} facts extracted`;
          const isImage = data.document_type === 'image' || Boolean(data.indicative);
          const docLabel = atts[0]?.name || 'Uploaded document';

          const conv: Conversation = {
            id: 'c-' + uid(),
            when: 'just now',
            ch: isExcel ? 'Excel (.xlsx)' : (data.document_type || 'Document'),
            from: data.entities?.[0] || docLabel,
            subj: data.summary ? data.summary.slice(0, 72) : docLabel,
            org: matchOrgId(data.entities, `${data.summary ?? ''} ${localExtractedText}`),
            status: 'to confirm',
            text: data.transcript || localExtractedText || data.summary || docLabel,
            facts: factsList.map((f, i) => ({
              id: `f${i + 1}`,
              f: f.field || 'Fact',
              v: (f.indicative || isImage) && !String(f.value).includes('indicative')
                ? `${f.value} (indicative)`
                : String(f.value),
              conf: typeof f.confidence === 'number' ? f.confidence : 0.85,
              span: f.quote || f.page_or_time || '',
              state: 'proposed' as const,
            })),
            tasks: (Array.isArray(data.tasks) ? data.tasks : [])
              .map((t) =>
                typeof t === 'string'
                  ? { t, owner: 'Investment team', state: 'proposed' as const }
                  : { t: String(t.task ?? t.t ?? ''), owner: String(t.owner ?? 'Investment team'), state: 'proposed' as const },
              )
              .filter((t) => Boolean(t.t)),
            crm: 'none',
          };

          storeRef.current.addConversation(conv);
          storeRef.current.openScreen(1);

          let finalSummaryText = data.mode === 'live' && isExcel
            ? (data.summary ?? 'Modèle Excel analysé.')
            : `${readLine}.\n\n${data.summary ?? 'Extracted candidate facts for review.'}`;

          if (isExcel && data.mode !== 'live' && apiKey.trim() && data.transcript) {
            try {
              const deepExcelAnalysis = await callGeminiDirectFromBrowser({
                apiKey: apiKey.trim(),
                systemInstruction:
                  `Tu es un Partner Growth Equity & Fund-of-Funds expert des modèles financiers de Mike Hinckley (Growth Equity Guide). ` +
                  `Cible de prospection : "${prospectTarget}". Deal analysé : "${dealName}". ` +
                  `Analyse en profondeur ce modèle Excel (.xlsx) : détaille ses onglets, ses chiffres exacts, identifie les anomalies ou red flags de due diligence, et propose 4 questions incisives pour le CFO/GP.`,
                prompt: `Fichier Excel : "${docLabel}"\n${body ? `Demande spécifique : "${body}"\n` : ''}\nDonnées extraites des onglets Excel :\n${data.transcript.slice(0, 14000)}`,
              });
              if (deepExcelAnalysis) {
                finalSummaryText = deepExcelAnalysis;
              }
            } catch {
              // keep data.summary
            }
          }

          setThinkingText(null);
          pushMessage({
            id: uid(),
            role: 'scribe',
            streaming: true,
            text: finalSummaryText,
            steps: [
              readLine,
              isImage ? 'Tagged image-extracted values as indicative' : isExcel ? 'Parsed all Excel worksheets, formulas, and key metric rows' : `Verified verbatim quotes against source (${quotesRejected} quotes rejected)`,
              'Landed proposed facts in Signals (screen 1) & loaded model into active memory',
            ],
            blocks: factsList.length
              ? [
                  {
                    kind: 'kv',
                    rows: factsList.map((f) => [
                      f.field,
                      `${f.value}${f.indicative || isImage ? ' (indicative)' : ''} (${Math.round((f.confidence ?? 0.85) * 100)}%)`,
                    ] as [string, string]),
                  },
                ]
              : undefined,
            sources: factsList.map((f) => ({
              label: f.field,
              doc: docLabel,
              loc: f.page_or_time || 'Source',
              snip: f.quote ? `"${f.quote}"` : undefined,
              conf: f.confidence,
              ind: Boolean(f.indicative || isImage),
            })),
            screen: 1,
            screenLabel: 'Signal capture',
          });
          return;
        } catch {
          await runLocalFallback();
          return;
        }
      }

      // Text or spoken questions go to /ask (with activeExcelModel & prospectTarget context)
      try {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (apiKey.trim()) headers['x-gemini-api-key'] = apiKey.trim();

        const res = await fetch('/ask', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            question: body,
            apiKey: apiKey.trim() || undefined,
            context: {
              currentScreen: current,
              level,
              activeThread,
              prospectTarget,
              dealName,
              activeExcelModel: activeExcelModel
                ? {
                    filename: activeExcelModel.filename,
                    title: activeExcelModel.title,
                    markdownExcerpt: activeExcelModel.markdown.slice(0, 14000),
                  }
                : null,
            },
            level,
          }),
        });

        if (res.status === 429) {
          const err = (await res.json().catch(() => ({}))) as ServerAskResponse;
          setThinkingText(null);
          pushMessage({
            id: uid(),
            role: 'scribe',
            refused: true,
            text: err.message || 'Rate limit reached. Please wait before sending another question.',
            steps: ['Checked gateway rate limit'],
          });
          return;
        }

        if (!res.ok) {
          await runLocalFallback();
          return;
        }

        const data = (await res.json()) as ServerAskResponse;
        if (data.mode === 'local') {
          await runLocalFallback();
          return;
        }

        setThinkingText(null);
        pushMessage({
          id: uid(),
          role: 'scribe',
          streaming: true,
          refused: data.refused,
          text: data.answer || data.text || '',
          steps: data.steps ?? [`Answered by ${data.model || 'gemini-2.5-flash'} via function calling`],
          sources: data.sources,
          screen: data.screen,
          screenLabel: data.screenLabel,
        });
      } catch {
        await runLocalFallback();
      }
    } finally {
      setThinkingText(null);
    }
  };

  const onDone = (m: Message) => {
    patchMessage(m.id, { streaming: false });
    if (voice) {
      speakText(m.text);
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setRawFiles((r) => [...r, ...arr]);
    setFiles((f) => [...f, ...arr.map((x) => ({ name: x.name, size: x.size, type: x.type, url: x.type.startsWith('image/') ? URL.createObjectURL(x) : undefined }))]);
  };

  const stopMicHardware = () => {
    recActiveRef.current = false;
    if (recTimerRef.current != null) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
    recRef.current = null;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    if (rec) {
      stopMicHardware();
      setRec(false);
      const captured = (micTranscriptRef.current || text).trim();
      micTranscriptRef.current = '';
      setInterim('');

      // Give MediaRecorder 120ms to flush the final audio chunk
      window.setTimeout(() => {
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        const audioBlob = chunks.length > 0 ? new Blob(chunks, { type: 'audio/webm' }) : null;
        if (captured) {
          void send(captured, { fromVoice: true, audioBlob });
        } else if (audioBlob && audioBlob.size > 0 && (apiKey.trim() || isGeminiReady)) {
          void send('', { fromVoice: true, audioBlob });
        } else {
          void send(SAMPLE_MEMO.text, { fromVoice: true });
        }
      }, 120);
      return;
    }

    if (!voice) setVoice(true);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    recActiveRef.current = true;
    micTranscriptRef.current = '';
    audioChunksRef.current = [];
    setRec(true);
    setFromMic(true);
    let secs = 0;
    setInterim('Écoute en cours (0:00)... Parlez puis cliquez sur ■ pour envoyer');

    recTimerRef.current = window.setInterval(() => {
      secs += 1;
      const mm = Math.floor(secs / 60);
      const ss = String(secs % 60).padStart(2, '0');
      if (!micTranscriptRef.current) {
        setInterim(`Écoute en cours (${mm}:${ss})... Parlez puis cliquez sur ■ pour envoyer`);
      }
    }, 1000);

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!recActiveRef.current) {
            stream.getTracks().forEach((tr) => tr.stop());
            return;
          }
          mediaStreamRef.current = stream;
          if (typeof MediaRecorder !== 'undefined') {
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = (ev) => {
              if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
            };
            mediaRecorderRef.current = mr;
            mr.start(250);
          }
        })
        .catch(() => {
          // Microphone permission or hardware unavailable; live timer + fallback transcript remain active
        });
    }

    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (Ctor) {
      try {
        const r = new Ctor();
        r.lang = 'fr-FR';
        r.interimResults = true;
        r.continuous = true;
        r.onresult = (e) => {
          const t = Array.from(e.results).map((x) => x[0].transcript).join(' ').trim();
          if (t) {
            micTranscriptRef.current = t;
            setInterim(t);
            setText(t);
            setFromMic(true);
          }
        };
        r.onend = () => {
          if (recActiveRef.current) {
            try {
              r.start();
            } catch {
              // ignore restart error
            }
          }
        };
        r.onerror = () => {
          // Keep recording session open so MediaRecorder / fallback works seamlessly
        };
        recRef.current = r;
        r.start();
      } catch {
        // ignore Web Speech init error
      }
    }
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
          Déposez vos fichiers Excel (.xlsx), PDF, images ou enregistrements audio/vidéo pour les analyser avec Gemini.
        </div>
      )}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-card/70 px-4 backdrop-blur">
        <span className="relative flex h-2 w-2">
          {!paused && <span className="breathe absolute inset-0 rounded-full bg-[var(--sage)]" />}
          <span className={cn('relative h-2 w-2 rounded-full', paused ? 'bg-muted-foreground/50' : 'bg-[var(--sage)]')} />
        </span>
        <span className="text-[13px] font-semibold">Scribe</span>
        <span className="hidden truncate text-[11.5px] text-muted-foreground lg:inline" data-testid="text-scribe-status">
          {activeExcelModel ? `📊 Excel actif : ${activeExcelModel.filename} · Cible : ${prospectTarget}` : `Cible : ${prospectTarget} · ${dealName}`}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {/* 1. Gemini Live API Key Connector */}
          <Popover open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                data-testid="button-gemini-key"
                className={cn(
                  'flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11.5px] font-medium transition-colors',
                  isGeminiReady
                    ? 'bg-[#EEF6EE] text-[var(--ink)] border border-[var(--sage)]/50'
                    : 'bg-amber-500/15 text-amber-900 border border-amber-500/40 hover:bg-amber-500/25',
                )}
              >
                <KeyRound className="h-3.5 w-3.5 text-[var(--sage)]" />
                <span>{isGeminiReady ? 'Gemini 2.5 Flash : Actif' : 'Clé API Gemini'}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 border-card-border p-3.5">
              <div className="flex items-center gap-2 text-[13px] font-semibold">
                <Sparkles className="h-4 w-4 text-[var(--sage)]" />
                Agent Multimodal Gemini 2.5 Flash
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Collez votre clé API Google Gemini (`AIza...`) pour activer l&apos;analyse multimodale en direct (fichiers Excel `.xlsx` de Mike Hinckley, PDF, images, et voix/audio).
              </p>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                data-testid="input-gemini-key"
                className="mt-2.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--sage)]"
              />
              <div className="mt-2.5 flex items-center justify-between gap-2">
                {apiKey && (
                  <button
                    onClick={() => void saveGeminiKey('')}
                    className="rounded-md px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-secondary"
                  >
                    Effacer
                  </button>
                )}
                <button
                  onClick={() => void saveGeminiKey(keyInput)}
                  data-testid="button-save-gemini-key"
                  className="ml-auto rounded-md bg-[var(--ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--pale-2)] hover:bg-[var(--ink-2)]"
                >
                  Activer Gemini 2.5 Flash
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* 2. Growth Equity Excel Studio & Prospect Target Duplicator */}
          <Popover open={studioOpen} onOpenChange={setStudioOpen}>
            <PopoverTrigger asChild>
              <button
                data-testid="button-growth-studio"
                className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--ink)] px-2.5 text-[11.5px] font-medium text-[var(--pale-2)] transition-colors hover:bg-[var(--ink-2)]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--mint)]" />
                <span>Excel Growth Equity (14) &amp; Cible</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[460px] max-h-[82vh] overflow-y-auto border-card-border p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  <Target className="h-4 w-4 text-[var(--sage)]" />
                  1. Personnaliser pour votre cible de prospection
                </div>
                <span className="rounded bg-[#EEF6EE] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--ink)]">Duplicable en 1 clic</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-medium text-muted-foreground">Fonds / GP prospecté</label>
                  <input
                    value={prospectTarget}
                    onChange={(e) => updateProspectTarget(e.target.value)}
                    placeholder="Ex: PROfounders, Nexus Bay..."
                    data-testid="input-prospect-target"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-[12px] outline-none focus:border-[var(--sage)]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-medium text-muted-foreground">Deal / Société analysée</label>
                  <input
                    value={dealName}
                    onChange={(e) => updateDealName(e.target.value)}
                    placeholder="Ex: Nimbus Ledger (Series B)"
                    data-testid="input-deal-name"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-[12px] outline-none focus:border-[var(--sage)]"
                  />
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {PROSPECT_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => updateProspectTarget(p)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10.5px] transition-colors',
                      prospectTarget === p ? 'border-[var(--sage)] bg-[#EEF6EE] font-medium text-[var(--ink)]' : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="mt-3.5 border-t pt-2.5">
                <div className="eyebrow mb-1.5">2. Livrables Excel de Mike Hinckley (Growth Equity Guide — 14 fichiers .xlsx)</div>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Cliquez sur un modèle Excel pour lire ses vrais onglets et formules et lancer le cas d&apos;usage adapté à <strong>{prospectTarget}</strong> :
                </p>
                <div className="space-y-1.5">
                  {hinckleyModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => void loadHinckleyExcelUseCase(m)}
                      data-testid={`button-hinckley-${m.id}`}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-border/70 bg-card p-2 text-left transition-colors hover:border-[var(--sage)] hover:bg-[#EEF6EE]/50"
                    >
                      <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sage)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] font-semibold text-foreground">{m.category}</span>
                          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{m.filename}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{m.useCaseHook}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <button
            onClick={() => {
              const next = !voice;
              setVoice(next);
              if (!next) {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              } else {
                const lastScribe = [...thread.msgs].reverse().find((m) => m.role === 'scribe');
                if (lastScribe?.text) speakText(lastScribe.text);
              }
            }}
            data-testid="button-voice-replies"
            className={cn('flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] transition-colors', voice ? 'bg-[var(--mint)]/50 text-foreground' : 'text-muted-foreground hover:bg-secondary')}>
            {voice ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden whitespace-nowrap xl:inline">Voix: {voice ? 'on' : 'off'}</span>
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
          {thread.msgs.length === 0 ? (
            <Landing
              onAsk={send}
              prospectTarget={prospectTarget}
              dealName={dealName}
              hinckleyModels={hinckleyModels}
              onSelectHinckleyModel={(m) => void loadHinckleyExcelUseCase(m)}
              onOpenStudio={() => setStudioOpen(true)}
              onOpenKey={() => setKeyPopoverOpen(true)}
              isGeminiReady={isGeminiReady}
            />
          ) : (
            thread.msgs.map((m) =>
              m.role === 'user' ? <UserMsg key={m.id} m={m} /> : <ScribeMsg key={m.id} m={m} onDone={onDone} />,
            )
          )}
          {thinkingText && (
            <div className="fade-up flex items-center gap-3 rounded-xl border border-[var(--sage)]/40 bg-[#EEF6EE]/70 px-4 py-3 text-[13px] font-medium text-[var(--ink)] shadow-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="breathe absolute inset-0 rounded-full bg-[var(--sage)]" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--sage)]" />
              </span>
              <span>{thinkingText}</span>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="mx-auto max-w-[760px]">
          {activeExcelModel && (
            <div className="mb-1.5 flex items-center justify-between rounded-lg border border-[var(--sage)]/40 bg-[#EEF6EE] px-3 py-1 text-[11.5px] text-[var(--ink)]">
              <span className="flex items-center gap-1.5 truncate">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[var(--sage)]" />
                <strong>Modèle Excel actif :</strong> {activeExcelModel.filename} · Cible : <strong>{prospectTarget}</strong>
              </span>
              <button
                onClick={() => setActiveExcelModel(null)}
                className="ml-2 rounded px-1.5 py-0.5 text-[10.5px] text-muted-foreground hover:bg-card"
              >
                Retirer
              </button>
            </div>
          )}
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
              onChange={(e) => { setText(e.target.value); setFromMic(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Posez une question à Gemini, dictez au micro, ou glissez un modèle Excel (.xlsx), PDF, image ou audio..."
              className="max-h-40 min-h-[40px] w-full resize-none bg-transparent px-1 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
              data-testid="input-message"
            />
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <button onClick={() => fileRef.current?.click()} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" title="Joindre un fichier Excel (.xlsx), PDF, image ou audio" data-testid="button-attach"><Paperclip className="h-4 w-4" /></button>
              <button onClick={toggleMic} title="Parler à Scribe : cliquez pour parler, recliquez sur ■ pour envoyer" data-testid="button-mic"
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', rec ? 'bg-[hsl(var(--bad))] text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                {rec ? <Square className="h-3 w-3 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
              <span className="ml-1 min-w-0 flex-1 truncate text-[11.5px] italic text-muted-foreground">{rec ? (interim || 'Écoute en cours...') : interim}</span>
              <button onClick={() => send()} disabled={busy || (!text.trim() && files.length === 0)} data-testid="button-send"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-[var(--pale-2)] transition-[opacity,transform] hover:bg-[var(--ink-2)] active:scale-95 disabled:opacity-30" aria-label="Send">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-border/70 bg-secondary/40 px-3 py-1.5 text-center text-[11px] text-muted-foreground" data-testid="banner-provider-terms">
            Upload non-confidential or synthetic files only (max 15 MB per file). When a live model is enabled, prompts and files are processed under the model provider&apos;s terms. Scribe reads, drafts and proposes; it never sends a message, writes a record or takes a decision without you.
          </div>
        </div>
      </div>
    </section>
  );
}

function Landing({
  onAsk,
  prospectTarget,
  dealName,
  hinckleyModels,
  onSelectHinckleyModel,
  onOpenStudio,
  onOpenKey,
  isGeminiReady,
}: {
  onAsk: (s: string) => void;
  prospectTarget: string;
  dealName: string;
  hinckleyModels: HinckleyModelItem[];
  onSelectHinckleyModel: (m: HinckleyModelItem) => void;
  onOpenStudio: () => void;
  onOpenKey: () => void;
  isGeminiReady: boolean;
}) {
  const topModels = hinckleyModels.slice(0, 4);
  const roles: [string, string, string[]][] = [
    ['Managing partner', 'Monday 08:30', ['Give me the Monday brief', 'Who is raising a successor fund?']],
    ['Investment team', 'Monday 08:00', ['What do we know about Meridian Ridge Partners?', 'Prepare the reference call for Meridian Ridge']],
    ['Portfolio and LP', 'Monday 09:00', ['Why is Harbor Peak Ventures flagged?', 'Draft the manager developments paragraph for the LP letter']],
    ['Operations', 'Monday 09:30', ['Check the Northwind capital call notice', 'Which managers are overdue on their Q3 report?']],
  ];
  return (
    <div className="rise pt-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <img src={mark} alt="" className="h-6 w-6" />
          <span className="eyebrow">Cible active : {prospectTarget} · Deal : {dealName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenKey}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
              isGeminiReady ? 'bg-[#EEF6EE] text-[var(--ink)]' : 'bg-amber-500/15 text-amber-900 hover:bg-amber-500/25',
            )}
          >
            <KeyRound className="h-3 w-3 text-[var(--sage)]" />
            {isGeminiReady ? 'Gemini 2.5 Flash : Connecté' : '1. Connecter Clé API Gemini'}
          </button>
          <button
            onClick={onOpenStudio}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-2.5 py-1 text-[11px] font-medium text-[var(--pale-2)] hover:bg-[var(--ink-2)]"
          >
            <Target className="h-3 w-3 text-[var(--mint)]" />
            2. Changer de cible / Voir les 14 Excel
          </button>
        </div>
      </div>

      <h2 className="mt-2.5 text-[28px] font-normal leading-[1.15] tracking-[-0.03em] text-foreground text-balance">
        Scribe prepares the work. <span className="text-[var(--sage)]">A person decides.</span> The log remembers.
      </h2>
      <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-muted-foreground">
        Chargez en 1 clic l&apos;un des <strong>14 modèles Excel (.xlsx) du Growth Equity Guide de Mike Hinckley</strong> ci-dessous (ou glissez n&apos;importe quel fichier Excel, PDF, image ou audio) pour générer votre cas d&apos;usage sur mesure pour <strong>{prospectTarget}</strong>.
      </p>

      {/* Featured Mike Hinckley Growth Equity Excel Use Cases */}
      <div className="mt-4 rounded-xl border border-[var(--sage)]/40 bg-[#EEF6EE]/50 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink)]">
            <FileSpreadsheet className="h-4 w-4 text-[var(--sage)]" />
            Use Cases Growth Equity (Livrables Excel Mike Hinckley) — Cible : {prospectTarget}
          </span>
          <button onClick={onOpenStudio} className="text-[11.5px] font-medium text-[var(--sage)] hover:underline">
            Voir les 14 fichiers .xlsx →
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {topModels.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectHinckleyModel(m)}
              data-testid={`button-landing-excel-${m.id}`}
              className="group flex flex-col justify-between rounded-lg border border-card-border bg-card p-2.5 text-left transition-all hover:border-[var(--sage)] hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[12px] font-semibold text-foreground">{m.category}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--sage)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{m.useCaseHook}</p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[var(--sage)]">
                <FileSpreadsheet className="h-3 w-3" />
                <span className="truncate">{m.filename}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {roles.map(([r, when, qs], i) => (
          <div key={r} className="rise rounded-xl border border-card-border bg-card p-3" style={{ animationDelay: `${80 + i * 60}ms` }}>
            <div className="mb-1.5 flex items-baseline justify-between"><span className="text-[12.5px] font-semibold">{r}</span><span className="text-[10.5px] text-muted-foreground">{when}</span></div>
            {qs.map((q) => (
              <button key={q} onClick={() => onAsk(q)} data-testid={`button-starter-${q.slice(0, 16)}`}
                className="group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[12px] text-foreground/80 transition-colors hover:bg-[#EEF6EE] hover:text-foreground">
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
            : <span key={i} className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-[12px]"><FileSpreadsheet className="h-3.5 w-3.5 text-[var(--sage)]" />{a.name}<span className="text-muted-foreground">{Math.max(1, Math.round(a.size / 1024))} KB</span></span>)}
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
      if (s < steps.length) { s++; setStepN(s); window.setTimeout(tick, 260); return; }
      if (c < m.text.length) { c = Math.min(m.text.length, c + 8); setChars(c); window.setTimeout(tick, 12); return; }
      doneRef.current(msgRef.current);
    };
    window.setTimeout(tick, 160);
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
        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span><span className="font-semibold text-foreground">Scribe</span> · draft for your review</span>
          {complete && (
            <button
              onClick={() => speakText(m.text)}
              title="Read this response aloud"
              data-testid={`button-speak-${m.id}`}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Volume2 className="h-3 w-3" /> Listen
            </button>
          )}
        </div>
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
        <div className={cn('whitespace-pre-wrap text-[13.5px] leading-[1.65] text-foreground', typing && 'caret')}>{m.text.slice(0, chars)}</div>
        {complete && (
          <div className="rise">
            {m.blocks?.map((b, i) => {
              if (b.kind === 'list') return <ul key={i} className="mt-2.5 space-y-1 border-l-2 border-[var(--mint)] pl-3 text-[12.5px] leading-relaxed text-foreground/85">{b.items.map((x) => <li key={x}>{x}</li>)}</ul>;
              if (b.kind === 'kv') return (
                <div key={i} className="mt-2.5 divide-y rounded-lg border bg-card text-[12.5px]">
                  {b.rows.map(([k, v]) => <div key={k} className="grid grid-cols-[180px_1fr] gap-3 px-3 py-1.5"><span className="truncate text-muted-foreground">{k}</span><span className="tnum">{v}</span></div>)}
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
