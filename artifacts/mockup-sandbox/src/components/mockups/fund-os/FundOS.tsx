import "./_group.css";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight,
  BarChart3, Bell, BriefcaseBusiness, CalendarDays, Check, CheckCheck,
  ChevronDown, ChevronRight, CircleHelp, Clock3, FileCheck2, FileText,
  Filter, Fingerprint, Globe2, Handshake, Inbox, Layers3, ListChecks,
  LockKeyhole, Menu, MoreHorizontal, Pencil, Plus, Search, ShieldCheck,
  SlidersHorizontal, Sparkles, Target, Users, X, XCircle,
} from "lucide-react";

type Section = "overview" | "signals" | "managers" | "holdings" | "diligence" | "readouts" | "audit";
type SignalStatus = "À examiner" | "Accepté" | "Modifié" | "Écarté";
type Signal = {
  id: string;
  title: string;
  origin: string;
  kind: string;
  summary: string;
  date: string;
  owner: string;
  source: string;
  quote: string;
  status: SignalStatus;
  confidence: string;
};

const seedSignals: Signal[] = [
  {
    id: "sig-01", title: "Changement de cadence chez Meridian", origin: "Entretien partenaire", kind: "Manager",
    summary: "Le fonds explore une première clôture plus tôt que prévu. À confirmer lors du prochain point LP.",
    date: "Aujourd'hui · 09:42", owner: "Camille Laurent", source: "Note d'entretien · 12 juin 2025",
    quote: "« Nous envisageons d'avancer la première clôture si les deux derniers LPs confirment avant la fin du mois. »",
    status: "À examiner", confidence: "Confiance modérée",
  },
  {
    id: "sig-02", title: "Nouvelle thèse : infrastructure climat", origin: "Lettre trimestrielle", kind: "Thèse",
    summary: "Harbourlight fait évoluer sa thèse vers les outils de mesure carbone pour les chaînes d'approvisionnement.",
    date: "Hier · 16:08", owner: "Louis Bernard", source: "Harbourlight · Lettre Q2 2025",
    quote: "« Notre prochain véhicule consacrera une part plus importante aux données carbone et à la conformité fournisseurs. »",
    status: "À examiner", confidence: "Confiance élevée",
  },
  {
    id: "sig-03", title: "Introduction à Aster Materials", origin: "Compte rendu de rencontre", kind: "Société",
    summary: "Équipe issue de l'EPFL, matériaux de construction bas-carbone. Aucun suivi d'investissement n'a été convenu.",
    date: "Hier · 11:23", owner: "Nora Petit", source: "Compte rendu · Aster Materials · 11 juin 2025",
    quote: "« Nous cherchons à mieux comprendre les voies de commercialisation avant toute discussion de financement. »",
    status: "À examiner", confidence: "À qualifier",
  },
  {
    id: "sig-04", title: "Rotation de l'équipe chez Cedar Ridge", origin: "Appel annuel", kind: "Manager",
    summary: "Une associée quitte l'équipe d'investissement. Impact sur la continuité de la stratégie à documenter.",
    date: "10 juin · 14:10", owner: "Camille Laurent", source: "Mémo d'appel annuel · 10 juin 2025",
    quote: "« Sophie termine son rôle à la fin du trimestre ; la couverture des sociétés sera redistribuée en interne. »",
    status: "À examiner", confidence: "Confiance modérée",
  },
];

const managerRows = [
  { initials: "MR", name: "Meridian Ridge Partners", focus: "Venture · Pré-amorçage", region: "Europe", stage: "Suivi actif", tone: "active", signals: "2 ouverts", next: "Point LP · 24 juin" },
  { initials: "HL", name: "Harbourlight Ventures", focus: "Climat · Série A", region: "Europe / US", stage: "En diligence", tone: "warn", signals: "1 ouvert", next: "Références · 19 juin" },
  { initials: "CR", name: "Cedar Ridge Capital", focus: "Logiciel · Seed", region: "Amérique du Nord", stage: "Portefeuille", tone: "neutral", signals: "1 ouvert", next: "Revue annuelle · 02 juil." },
  { initials: "PL", name: "Pine & Lake Ventures", focus: "Santé numérique", region: "Europe", stage: "Portefeuille", tone: "neutral", signals: "Aucun", next: "Lettre Q2 attendue" },
  { initials: "AR", name: "Alder Run Capital", focus: "Fintech · Seed", region: "Royaume-Uni", stage: "À qualifier", tone: "warn", signals: "Aucun", next: "Introduction · 27 juin" },
];

const fundHoldings = [
  { initials: "MR", name: "Meridian Ridge III", type: "Fonds · Pré-amorçage", sector: "Logiciel", status: "Suivi actif", vintage: "2023", commitment: "Engagement suivi" },
  { initials: "HL", name: "Harbourlight Climate I", type: "Fonds · Climat", sector: "Climat", status: "En diligence", vintage: "2025", commitment: "Diligence" },
  { initials: "CR", name: "Cedar Ridge Seed II", type: "Fonds · Seed", sector: "B2B SaaS", status: "Portefeuille", vintage: "2022", commitment: "Portefeuille" },
];
const companyHoldings = [
  { initials: "AS", name: "Aster Materials", type: "Direct · Matériaux", sector: "Climat", status: "Suivi exploratoire", vintage: "—", commitment: "Suivi exploratoire" },
  { initials: "FL", name: "Fieldnote Health", type: "Direct · Santé numérique", sector: "Santé", status: "Portefeuille", vintage: "2024", commitment: "Portefeuille" },
  { initials: "NO", name: "Northline Robotics", type: "Direct · Robotique", sector: "Industrie", status: "Portefeuille", vintage: "2023", commitment: "Portefeuille" },
];

const navItems: { id: Section; label: string; icon: typeof Activity; count?: string }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: BarChart3 },
  { id: "signals", label: "Signaux", icon: Activity, count: "04" },
  { id: "managers", label: "Managers", icon: Users },
  { id: "holdings", label: "Holdings", icon: BriefcaseBusiness },
  { id: "diligence", label: "Diligence", icon: ListChecks },
  { id: "readouts", label: "Read-outs", icon: FileText },
  { id: "audit", label: "Audit trail", icon: Fingerprint },
];

const sectionCopy: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: "Vue d’ensemble", subtitle: "Les éléments à voir, les décisions à garder humaines." },
  signals: { title: "Signaux à examiner", subtitle: "Des informations sourcées, proposées à la revue — jamais décidées automatiquement." },
  managers: { title: "Managers", subtitle: "Relations, thèses et diligence de votre portefeuille de fonds." },
  holdings: { title: "Holdings", subtitle: "Vue consolidée des fonds et des sociétés suivis par l’équipe." },
  diligence: { title: "Diligence", subtitle: "Travaux en cours, preuves à réunir et prochaines étapes." },
  readouts: { title: "Read-outs", subtitle: "Synthèses de portefeuille préparées pour la lecture de l’équipe." },
  audit: { title: "Audit trail", subtitle: "Historique local des actions humaines dans cette démonstration." },
};

function Status({ label, tone = "active" }: { label: string; tone?: string }) {
  return <span className={`fo-status ${tone === "warn" ? "warn" : tone === "neutral" ? "neutral" : ""}`}><i />{label}</span>;
}

function SignalIcon({ kind }: { kind: string }) {
  const Icon = kind === "Société" ? Target : kind === "Thèse" ? Sparkles : Handshake;
  return <div className="fo-signal-type"><Icon /></div>;
}

function OverviewMetric({ label, value, foot, icon: Icon }: { label: string; value: string; foot: string; icon: typeof Activity }) {
  return <div className="fo-metric"><div className="fo-metric-label"><Icon size={11} />{label}</div><div className="fo-metric-value">{value}</div><div className="fo-metric-foot">{foot}</div></div>;
}

export function FundOS() {
  const [section, setSection] = useState<Section>("overview");
  const [profile, setProfile] = useState<"Bay Harbour Capital" | "Northstar Ventures">("Bay Harbour Capital");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signals, setSignals] = useState(seedSignals);
  const [drawer, setDrawer] = useState<Signal | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [holdingMode, setHoldingMode] = useState<"Fonds" | "Directs" | "Tout">("Tout");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [auditEvents, setAuditEvents] = useState<string[]>([
    "Camille Laurent a ouvert la revue du jour · 09:42",
    "Louis Bernard a ajouté une source à Harbourlight · Hier",
    "Nora Petit a créé le read-out Q2 · 11 juin",
  ]);

  const profileCode = profile === "Bay Harbour Capital" ? "BH" : "NS";
  const profileType = profile === "Bay Harbour Capital" ? "Venture fund-of-funds" : "Venture capital";
  const pending = signals.filter((item) => item.status === "À examiner");
  const visibleSignals = useMemo(() => signals.filter((item) => {
    const matchesQuery = `${item.title} ${item.summary} ${item.origin} ${item.kind}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "Tous" || item.status === filter);
  }), [signals, query, filter]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const announce = (message: string) => {
    setToast(message);
    setAuditEvents((events) => [`Vous · ${message} · À l’instant`, ...events].slice(0, 8));
  };

  const updateSignal = (id: string, status: SignalStatus) => {
    const item = signals.find((signal) => signal.id === id);
    if (!item) return;
    setSignals((current) => current.map((signal) => signal.id === id ? { ...signal, status } : signal));
    announce(status === "Accepté" ? "Signal accepté pour le dossier" : status === "Écarté" ? "Signal écarté avec trace conservée" : "Signal modifié et sauvegardé");
    if (drawer?.id === id) setDrawer({ ...item, status });
  };

  const openTrace = (signal: Signal) => {
    setDrawer(signal);
    setEditing(false);
    setDraft(signal.summary);
  };

  const openSignalForEdit = (signal: Signal) => {
    setDrawer(signal);
    setEditing(true);
    setDraft(signal.summary);
  };

  const saveEdit = () => {
    if (!drawer) return;
    setSignals((current) => current.map((signal) => signal.id === drawer.id ? { ...signal, summary: draft, status: "Modifié" } : signal));
    setDrawer({ ...drawer, summary: draft, status: "Modifié" });
    setEditing(false);
    announce("Note éditoriale enregistrée");
  };

  const filteredManagers = managerRows.filter((row) => `${row.name} ${row.focus} ${row.region}`.toLowerCase().includes(query.toLowerCase()));
  const currentSection = sectionCopy[section];
  const selectSection = (id: Section) => { setSection(id); setMobileNav(false); setQuery(""); };

  const renderSignalRows = (items: Signal[], compact = false) => items.map((signal) => (
    <div className="fo-signal" key={signal.id}>
      <SignalIcon kind={signal.kind} />
      <div className="fo-signal-content">
        <div className="fo-signal-line"><strong>{signal.title}</strong><span className="fo-signal-origin">· {signal.origin}</span></div>
        <p className="fo-signal-desc">{signal.summary}</p>
        <div className="fo-signal-foot"><span className="fo-tag"><i className="fo-tag-dot" />{signal.status}</span><span>{signal.date}</span></div>
      </div>
      <div className="fo-signal-controls">
        <button className="fo-mini-action" aria-label={`Voir la source : ${signal.title}`} title="Voir la source" onClick={() => openTrace(signal)}><FileText /></button>
        {!compact && signal.status === "À examiner" && <>
          <button className="fo-mini-action accept" aria-label={`Accepter ${signal.title}`} title="Accepter" onClick={() => updateSignal(signal.id, "Accepté")}><Check /></button>
          <button className="fo-mini-action" aria-label={`Modifier ${signal.title}`} title="Modifier" onClick={() => openSignalForEdit(signal)}><Pencil /></button>
          <button className="fo-mini-action reject" aria-label={`Écarter ${signal.title}`} title="Écarter" onClick={() => updateSignal(signal.id, "Écarté")}><X /></button>
        </>}
      </div>
    </div>
  ));

  const renderHoldingsTable = (rows: typeof fundHoldings) => (
    <div className="fo-table-wrap">
      <table className="fo-table">
        <thead><tr><th>Holding</th><th>Type</th><th>Thèse</th><th>État</th><th>Millésime</th><th>Suivi</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name} onClick={() => announce(`Dossier ${row.name} ouvert en aperçu`)} style={{ cursor: "pointer" }}>
          <td><div className="fo-table-name"><span className="fo-holding-mark">{row.initials}</span><div><b>{row.name}</b><span>{profile === "Bay Harbour Capital" ? "Bay Harbour Capital" : "Northstar Ventures"}</span></div></div></td>
          <td>{row.type}</td><td>{row.sector}</td>
          <td><Status label={row.status} tone={row.status.includes("diligence") ? "warn" : row.status === "Portefeuille" ? "neutral" : "active"} /></td>
          <td className="fo-mono">{row.vintage}</td><td>{row.commitment}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="fo-heading-row">
        <div className="fo-heading">
          <div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Espace partenaire <span>·</span> {profile}</div>
          <h1>Bonjour, Camille</h1>
          <p>Voici ce qui mérite votre attention aujourd’hui.</p>
        </div>
        <div className="fo-date-control"><CalendarDays />Semaine du 16 juin 2025<ChevronDown size={12} /></div>
      </div>
      <div className="fo-disclaimer"><ShieldCheck />Démonstration — données fictives et indicatives. Les décisions restent toujours humaines ; aucun envoi ni automatisation.</div>
      <div className="fo-grid">
        <div className="fo-column">
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Vue du portefeuille</h2><p className="fo-panel-subtitle">Périmètre suivi · sans métriques de valorisation</p></div><button className="fo-text-btn" onClick={() => selectSection("holdings")}>Ouvrir les holdings <ArrowRight /></button></div>
            <div className="fo-metrics">
              <OverviewMetric label="Managers suivis" value="12" foot="4 relations actives" icon={Users} />
              <OverviewMetric label="Fonds au portefeuille" value="08" foot="3 millésimes représentés" icon={Layers3} />
              <OverviewMetric label="Sociétés directes" value="06" foot="Suivi non financier" icon={Target} />
              <OverviewMetric label="À examiner" value={`${String(pending.length).padStart(2, "0")}`} foot="Signaux, revue humaine" icon={Inbox} />
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Signaux à examiner <span className="fo-signal-count">· {pending.length}</span></h2><p className="fo-panel-subtitle">Intelligence sourcée, en attente de votre lecture</p></div><button className="fo-text-btn" onClick={() => selectSection("signals")}>Tout voir <ArrowRight /></button></div>
            <div className="fo-activity">{renderSignalRows(pending.slice(0, 3))}</div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Holdings suivis</h2><p className="fo-panel-subtitle">Fonds et expositions directes · exemples fictifs</p></div><button className="fo-text-btn" onClick={() => selectSection("holdings")}>Vue consolidée <ArrowRight /></button></div>
            <div className="fo-holdings">
              {[...fundHoldings.slice(0, 2), companyHoldings[0]].map((row) => <div className="fo-holding" key={row.name}>
                <div className="fo-holding-name"><span className="fo-holding-mark">{row.initials}</span><div><strong>{row.name}</strong><span>{row.type}</span></div></div>
                <div className="fo-holding-meta">{row.sector}<small>{row.status}</small></div>
                <div className="fo-holding-meta">{row.vintage === "—" ? "Direct" : `Millésime ${row.vintage}`}<small>Dossier suivi</small></div>
                <div className="fo-commit"><ChevronRight size={13} /></div>
              </div>)}
            </div>
          </section>
        </div>
        <div className="fo-column">
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Read-out de portefeuille</h2><p className="fo-panel-subtitle">Activité documentée · trimestre courant</p></div><button className="fo-icon-btn" aria-label="Options du read-out" onClick={() => announce("Options du read-out ouvertes")}><MoreHorizontal /></button></div>
            <div className="fo-chart-wrap">
              <div className="fo-chart-legend"><span><i className="fo-legend-dot" />Managers avec activité</span><span><i className="fo-legend-dot light" />Sources revues</span></div>
              <svg className="fo-chart" viewBox="0 0 360 130" role="img" aria-label="Activité de suivi documentaire, avril à juin">
                <defs><linearGradient id="foArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#769b7b" stopOpacity=".15" /><stop offset="100%" stopColor="#769b7b" stopOpacity="0" /></linearGradient></defs>
                {[20, 52, 84, 116].map((y) => <line key={y} x1="31" y1={y} x2="350" y2={y} className="fo-chart-grid" />)}
                <text x="0" y="23" className="fo-chart-label">12</text><text x="5" y="55" className="fo-chart-label">08</text><text x="5" y="87" className="fo-chart-label">04</text><text x="9" y="119" className="fo-chart-label">00</text>
                <path className="fo-chart-area" d="M32 88 C60 80,72 70,98 74 S140 44,164 54 S210 43,231 50 S274 22,294 34 S327 19,350 24 L350 117 L32 117 Z" />
                <path className="fo-chart-line" d="M32 88 C60 80,72 70,98 74 S140 44,164 54 S210 43,231 50 S274 22,294 34 S327 19,350 24" />
                <path className="fo-chart-line2" d="M32 101 C57 93,74 100,98 91 S139 81,164 87 S204 68,231 78 S270 62,294 68 S328 52,350 57" />
                <text x="28" y="129" className="fo-chart-label">AVR.</text><text x="128" y="129" className="fo-chart-label">MAI</text><text x="224" y="129" className="fo-chart-label">JUIN</text><text x="321" y="129" className="fo-chart-label">SUIVI</text>
              </svg>
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Prochaines étapes</h2><p className="fo-panel-subtitle">Dossiers actifs de l’équipe</p></div><button className="fo-text-btn" onClick={() => selectSection("diligence")}>Diligence <ArrowRight /></button></div>
            <div className="fo-worklist">
              <div className="fo-work-item"><div className="fo-work-mark"><Handshake /></div><div className="fo-work-copy"><b>Références · Harbourlight Climate I</b><span>4 contacts à documenter · Louis Bernard</span></div><span className="fo-work-date">19 juin</span></div>
              <div className="fo-work-item"><div className="fo-work-mark"><FileCheck2 /></div><div className="fo-work-copy"><b>Point LP · Meridian Ridge III</b><span>Première clôture à revalider · Camille Laurent</span></div><span className="fo-work-date">24 juin</span></div>
              <div className="fo-work-item"><div className="fo-work-mark"><Clock3 /></div><div className="fo-work-copy"><b>Revue annuelle · Cedar Ridge</b><span>Préparer les questions de suivi</span></div><span className="fo-work-date">02 juil.</span></div>
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Journal récent</h2><p className="fo-panel-subtitle">Actions humaines consignées localement</p></div><button className="fo-text-btn" onClick={() => selectSection("audit")}>Tout le journal <ArrowRight /></button></div>
            <div className="fo-worklist">
              {auditEvents.slice(0, 3).map((event, index) => <div className="fo-work-item" key={`${event}-${index}`}><div className="fo-work-mark"><Fingerprint /></div><div className="fo-work-copy"><b>{event.split(" · ")[0]}</b><span>{event.split(" · ").slice(1).join(" · ")}</span></div></div>)}
            </div>
          </section>
        </div>
      </div>
    </>
  );

  const renderSignalsPage = () => (
    <>
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Intelligence · Revue humaine</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions">
        <div className="fo-search"><Search /><input aria-label="Rechercher un signal" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un signal…" /></div>
        <select className="fo-filter" aria-label="Filtrer par statut" value={filter} onChange={(event) => setFilter(event.target.value)}><option>Tous</option><option>À examiner</option><option>Accepté</option><option>Modifié</option><option>Écarté</option></select>
      </div></div>
      <div className="fo-disclaimer"><ShieldCheck />Chaque signal conserve sa source, son contexte et son statut de revue. Aucune synthèse n’est traitée comme une décision.</div>
      {visibleSignals.length ? <div className="fo-review-list">{visibleSignals.map((signal) => <article className="fo-panel fo-review-card" key={signal.id}>
        <div className="fo-review-card-top"><div><div className="fo-eyebrow">{signal.kind} <span>·</span> {signal.origin}</div><h3>{signal.title}</h3><p>{signal.summary}</p></div><Status label={signal.status} tone={signal.status === "À examiner" ? "warn" : signal.status === "Écarté" ? "neutral" : "active"} /></div>
        <div className="fo-review-meta"><span><Clock3 size={11} /> {signal.date}</span><span><Users size={11} /> {signal.owner}</span><span><Sparkles size={11} /> {signal.confidence}</span></div>
        <div className="fo-review-actions">
          <button className="fo-btn" onClick={() => openTrace(signal)}><FileText />Source & traçabilité</button>
          {signal.status === "À examiner" && <><button className="fo-btn primary" onClick={() => updateSignal(signal.id, "Accepté")}><Check />Accepter</button><button className="fo-btn" onClick={() => openSignalForEdit(signal)}><Pencil />Modifier</button><button className="fo-btn ghost" onClick={() => updateSignal(signal.id, "Écarté")}><XCircle />Écarter</button></>}
          {signal.status !== "À examiner" && <button className="fo-btn" onClick={() => updateSignal(signal.id, "À examiner")}><ArrowDownRight />Rouvrir la revue</button>}
        </div>
      </article>)}</div> : <div className="fo-panel fo-empty"><div className="fo-empty-mark"><Inbox /></div><b>Aucun signal dans cette vue</b><span>Modifiez les filtres ou la recherche pour continuer.</span></div>}
    </>
  );

  const renderManagersPage = () => (
    <>
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Relations · Fonds</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions"><div className="fo-search"><Search /><input aria-label="Rechercher un manager" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, thèse, région…" /></div><button className="fo-btn" onClick={() => announce("Création de manager disponible dans ce prototype")}><Plus />Nouveau dossier</button></div></div>
      <div className="fo-disclaimer"><ShieldCheck />Données de démonstration fictives. Les statuts indiquent uniquement une organisation de travail, pas une recommandation d’investissement.</div>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Relations du portefeuille</h2><p className="fo-panel-subtitle">{filteredManagers.length} dossiers · informations synthétiques</p></div><button className="fo-icon-btn" aria-label="Options de filtre" onClick={() => announce("Filtres de managers prêts à être configurés")}><SlidersHorizontal /></button></div>
        <div className="fo-table-wrap"><table className="fo-table"><thead><tr><th>Manager</th><th>Thèse</th><th>Région</th><th>État</th><th>Signaux</th><th>Prochain jalon</th><th /></tr></thead><tbody>{filteredManagers.map((row) => <tr key={row.name} onClick={() => announce(`Dossier ${row.name} sélectionné`)} style={{ cursor: "pointer" }}><td><div className="fo-table-name"><span className="fo-holding-mark">{row.initials}</span><div><b>{row.name}</b><span>Relation partenaire</span></div></div></td><td>{row.focus}</td><td>{row.region}</td><td><Status label={row.stage} tone={row.tone} /></td><td>{row.signals}</td><td>{row.next}</td><td><ChevronRight size={13} /></td></tr>)}</tbody></table></div>
        {filteredManagers.length === 0 && <div className="fo-empty"><div className="fo-empty-mark"><Search /></div><b>Aucun dossier trouvé</b><span>Essayez un autre nom ou une autre thèse.</span></div>}
      </section>
      <div className="fo-grid" style={{ marginTop: 16 }}>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Cadence de suivi</h2><p className="fo-panel-subtitle">Un rappel de couverture, pas un score de performance</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CalendarDays /></div><div className="fo-work-copy"><b>4 conversations à documenter</b><span>Entretiens partenaires prévus sur les deux prochaines semaines</span></div></div><div className="fo-work-item"><div className="fo-work-mark"><FileText /></div><div className="fo-work-copy"><b>2 lettres trimestrielles attendues</b><span>Dernière source : mai 2025</span></div></div></div></section>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">À propos des statuts</h2><p className="fo-panel-subtitle">Chaque libellé est un repère de workflow</p></div></div><div className="fo-worklist"><div className="fo-work-item"><Status label="En diligence" tone="warn" /><div className="fo-work-copy"><span>Étapes de recherche documentées, sans conclusion automatisée.</span></div></div><div className="fo-work-item"><Status label="Suivi actif" /><div className="fo-work-copy"><span>Relation active ou point de suivi planifié.</span></div></div></div></section>
      </div>
    </>
  );

  const renderHoldingsPage = () => {
    const fundRows = holdingMode === "Directs" ? [] : fundHoldings;
    const directRows = holdingMode === "Fonds" ? [] : companyHoldings;
    const visibleRows = [...fundRows, ...directRows].filter((row) => `${row.name} ${row.type} ${row.sector} ${row.status}`.toLowerCase().includes(query.toLowerCase()));
    return <>
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Portefeuille · Consolidé</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions"><div className="fo-search"><Search /><input aria-label="Rechercher un holding" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, secteur…" /></div><button className="fo-btn" onClick={() => announce("Ajout de holding — aucune donnée n’est envoyée")}><Plus />Ajouter au suivi</button></div></div>
      <div className="fo-disclaimer"><ShieldCheck />Démonstration — holdings et dates entièrement fictifs. Aucun prix, coût, valorisation ni recommandation n’est affiché.</div>
      <div className="fo-panel" style={{ marginBottom: 16 }}><div className="fo-panel-head"><div><h2 className="fo-panel-title">Vue de portefeuille</h2><p className="fo-panel-subtitle">Structure de couverture · pas de données financières</p></div><div className="fo-split-tabs">{(["Tout", "Fonds", "Directs"] as const).map((mode) => <button className={holdingMode === mode ? "active" : ""} key={mode} onClick={() => setHoldingMode(mode)}>{mode}</button>)}</div></div>
        <div className="fo-metrics"><OverviewMetric label="Fonds suivis" value="08" foot="Venture et fonds spécialisés" icon={Layers3} /><OverviewMetric label="Sociétés directes" value="06" foot="Dossiers de suivi" icon={Target} /><OverviewMetric label="Régions documentées" value="04" foot="Selon les sources disponibles" icon={Globe2} /><OverviewMetric label="Sources à relire" value="03" foot="Aucune synthèse automatique" icon={FileText} /></div>
      </div>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">{holdingMode === "Fonds" ? "Fonds suivis" : holdingMode === "Directs" ? "Sociétés directes" : "Holdings suivis"}</h2><p className="fo-panel-subtitle">{visibleRows.length} dossiers dans cette vue</p></div><button className="fo-icon-btn" aria-label="Filtres holdings" onClick={() => announce("Vue filtrée par statut de suivi")}><Filter /></button></div>
        {visibleRows.length ? renderHoldingsTable(visibleRows) : <div className="fo-empty"><div className="fo-empty-mark"><Search /></div><b>Aucun holding trouvé</b><span>Essayez une autre recherche.</span></div>}
      </section>
      <div className="fo-grid" style={{ marginTop: 16 }}>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Fonds & sociétés, côte à côte</h2><p className="fo-panel-subtitle">La structure du FoF sans masquer les expositions directes</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><Layers3 /></div><div className="fo-work-copy"><b>Engagements dans des fonds</b><span>Thèse, millésime, documents LP et relation manager.</span></div><span className="fo-work-date">08</span></div><div className="fo-work-item"><div className="fo-work-mark"><Target /></div><div className="fo-work-copy"><b>Sociétés suivies directement</b><span>Contexte, introduction et échanges consignés séparément.</span></div><span className="fo-work-date">06</span></div></div></section>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Provenance des données</h2><p className="fo-panel-subtitle">Les chiffres d’inventaire sont fictifs</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><LockKeyhole /></div><div className="fo-work-copy"><b>Aucune synchronisation externe</b><span>Ce prototype ne lit ni n’envoie de données.</span></div></div></div></section>
      </div>
    </>;
  };

  const renderDiligence = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Recherche · Travail humain</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("Nouvelle étape ajoutée au brouillon local")}><Plus />Nouvelle étape</button></div>
    <div className="fo-disclaimer"><ShieldCheck />État du travail uniquement. Aucun score d’investissement, recommandation ou conclusion générée.</div>
    <div className="fo-grid"><div className="fo-column">
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">En cours</h2><p className="fo-panel-subtitle">Éléments à documenter avant une discussion d’équipe</p></div><span className="fo-tag">3 dossiers</span></div><div className="fo-worklist">
        <div className="fo-work-item"><div className="fo-work-mark"><Handshake /></div><div className="fo-work-copy"><b>Harbourlight Climate I · Références</b><span>4 prises de référence à consigner · Owner : Louis Bernard</span></div><span className="fo-work-date">19 juin</span></div>
        <div className="fo-work-item"><div className="fo-work-mark"><FileText /></div><div className="fo-work-copy"><b>Meridian Ridge III · Note de stratégie</b><span>Confirmer les hypothèses de taille de fonds · Camille Laurent</span></div><span className="fo-work-date">24 juin</span></div>
        <div className="fo-work-item"><div className="fo-work-mark"><Users /></div><div className="fo-work-copy"><b>Aster Materials · Cartographie équipe</b><span>Introduction exploratoire, sans processus de financement identifié</span></div><span className="fo-work-date">27 juin</span></div>
      </div></section>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">À réunir</h2><p className="fo-panel-subtitle">Liste de vérification indicative</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CheckCheck /></div><div className="fo-work-copy"><b>Historique des fonds précédents</b><span>Source LP attribuée · Meridian Ridge Partners</span></div><Status label="Reçu" /></div><div className="fo-work-item"><div className="fo-work-mark"><Clock3 /></div><div className="fo-work-copy"><b>Références fondateurs</b><span>À compléter · Harbourlight Ventures</span></div><Status label="En attente" tone="warn" /></div></div></section>
    </div><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Principes de diligence</h2><p className="fo-panel-subtitle">Un cadre pour garder les décisions explicites</p></div></div><div className="fo-worklist">{["Source attribuée à chaque affirmation", "Faits et interprétations distingués", "Responsable humain pour chaque suivi", "Décision conservée hors de l’automatisation"].map((line) => <div className="fo-work-item" key={line}><div className="fo-work-mark"><Check /></div><div className="fo-work-copy"><b>{line}</b><span>Repère de méthode · à confirmer par l’équipe</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Journal de diligence</h2><p className="fo-panel-subtitle">Événements récents</p></div></div><div className="fo-worklist">{auditEvents.slice(0, 3).map((event) => <div className="fo-work-item" key={event}><div className="fo-work-mark"><Fingerprint /></div><div className="fo-work-copy"><b>{event.split(" · ")[0]}</b><span>{event.split(" · ").slice(1).join(" · ")}</span></div></div>)}</div></section></div></div>
  </>;

  const renderReadouts = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Reporting · Relecture</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("Nouveau read-out créé dans le brouillon local")}><Plus />Créer un read-out</button></div>
    <div className="fo-disclaimer"><ShieldCheck />Toutes les synthèses ci-dessous sont des maquettes éditoriales fictives. Aucune donnée ne sera envoyée.</div>
    <div className="fo-grid"><div className="fo-column">{[
      ["Read-out portefeuille · Q2", "En relecture", "Synthèse des activités documentées, des changements de thèse et des prochaines étapes à valider par l’équipe."],
      ["Meridian Ridge · Point de suivi", "Brouillon", "Éléments de contexte pour la prochaine conversation LP ; signal de clôture explicitement non confirmé."],
      ["Harbourlight · Note de thèse", "Prêt à relire", "Lecture des thèmes climat mentionnés dans la lettre trimestrielle, avec référence à la source originale."],
    ].map(([title, status, desc]) => <article className="fo-panel fo-review-card" key={title}><div className="fo-review-card-top"><div><div className="fo-eyebrow">Document · Synthèse interne</div><h3>{title}</h3><p>{desc}</p></div><Status label={status} tone={status === "Brouillon" ? "neutral" : "warn"} /></div><div className="fo-review-meta"><span><Clock3 size={11} /> Mis à jour le 12 juin 2025</span><span><Users size={11} /> Responsable : Camille Laurent</span></div><div className="fo-review-actions"><button className="fo-btn" onClick={() => announce(`Lecture du document « ${title} »`)}><FileText />Lire le document</button><button className="fo-btn" onClick={() => announce("Relecture humaine demandée")}><Check />Marquer pour relecture</button></div></article>)}</div><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Qualité éditoriale</h2><p className="fo-panel-subtitle">Garde-fous avant partage interne</p></div></div><div className="fo-worklist">{["Sources liées au passage concerné", "Points à confirmer explicitement signalés", "Aucune recommandation ni valorisation", "Validation par un partenaire responsable"].map((text) => <div className="fo-work-item" key={text}><div className="fo-work-mark"><ShieldCheck /></div><div className="fo-work-copy"><b>{text}</b><span>Contrôle de préparation</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Contexte du read-out</h2><p className="fo-panel-subtitle">Rythme de partage de l’équipe</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CalendarDays /></div><div className="fo-work-copy"><b>Revue partenaire Q2</b><span>Prévue le 30 juin · note non finalisée</span></div></div></div></section></div></div>
  </>;

  const renderAudit = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Confiance · Traçabilité</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("Journal local rafraîchi")}><Activity />Actualiser</button></div>
    <div className="fo-disclaimer"><ShieldCheck />Ce journal est une démonstration locale. Il illustre la traçabilité, sans connexion ni écriture vers un système externe.</div>
    <div className="fo-grid"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Événements récents</h2><p className="fo-panel-subtitle">Actions visibles et attribuées dans cette session</p></div><span className="fo-tag"><i className="fo-tag-dot" />Local</span></div><div className="fo-worklist">{auditEvents.map((event, index) => <div className="fo-work-item" key={`${event}-${index}`}><div className="fo-work-mark"><Fingerprint /></div><div className="fo-work-copy"><b>{event.split(" · ")[0]}</b><span>{event.split(" · ").slice(1).join(" · ")}</span></div><span className="fo-work-date">{index === 0 ? "Maintenant" : "Enregistré"}</span></div>)}</div></section><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Ce que ce journal garde</h2><p className="fo-panel-subtitle">Une décision doit rester explicable</p></div></div><div className="fo-worklist">{["Qui a agi", "Quel élément a été examiné", "La source mobilisée", "Le statut choisi et son horodatage"].map((text) => <div className="fo-work-item" key={text}><div className="fo-work-mark"><Check /></div><div className="fo-work-copy"><b>{text}</b><span>Trace de travail, jamais un substitut au jugement</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Contrôle d’accès</h2><p className="fo-panel-subtitle">Rôle actif dans la démonstration</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><LockKeyhole /></div><div className="fo-work-copy"><b>Partenaire · Accès complet</b><span>Profil affiché : {profile}</span></div><Status label="Session locale" /></div></div></section></div></div>
  </>;

  return (
    <div className="fundos">
      <div className="fo-app">
        <aside className={`fo-sidebar ${mobileNav ? "is-open" : ""}`} aria-label="Navigation principale">
          <div className="fo-brand"><img src="/__mockup/images/nexus-bay-lite.svg" alt="Nexus Bay Capital" /><p className="fo-brand-caption">Fund OS · workspace</p></div>
          <button className="fo-profile-switch" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Changer de profil de démonstration">
            <span className="fo-profile-mark">{profileCode}</span><span className="fo-profile-meta"><b>{profile}</b><span>{profileType}</span></span><ChevronDown size={13} />
          </button>
          <div className="fo-nav-label">Workspace</div>
          <nav className="fo-nav">{navItems.map(({ id, label, icon: Icon, count }) => <button className={`fo-nav-item ${section === id ? "is-active" : ""}`} key={id} onClick={() => selectSection(id)} aria-current={section === id ? "page" : undefined}><Icon /><span>{label}</span>{count && <i className="fo-nav-count">{pending.length.toString().padStart(2, "0")}</i>}</button>)}</nav>
          <div className="fo-nav-divider" />
          <div className="fo-nav-label">Espace</div>
          <nav className="fo-nav"><button className="fo-nav-item" onClick={() => announce("Paramètres du workspace prêts à configurer")}><SlidersHorizontal /><span>Paramètres</span></button><button className="fo-nav-item" onClick={() => announce("Centre d’aide ouvert dans le prototype")}><CircleHelp /><span>Centre d’aide</span></button></nav>
          <div className="fo-sidebar-bottom">
            <div className="fo-review-note"><div className="fo-review-note-top"><i className="fo-review-dot" />Humain dans la boucle</div><p>Chaque signal attend une décision explicite. La provenance reste visible.</p></div>
            <div className="fo-user"><div className="fo-avatar">CL</div><div><b>Camille Laurent</b><span>Partner · Administratrice</span></div><button className="fo-icon-btn" aria-label="Profil utilisateur" onClick={() => announce("Profil Camille Laurent · rôle partenaire")}><MoreHorizontal /></button></div>
          </div>
        </aside>
        {profileOpen && <><button className="fo-drawer-backdrop" style={{ zIndex: 8, background: "transparent" }} aria-label="Fermer le sélecteur" onClick={() => setProfileOpen(false)} /><div className="fo-profile-menu">
          {(["Bay Harbour Capital", "Northstar Ventures"] as const).map((name) => <button key={name} onClick={() => { setProfile(name); setProfileOpen(false); announce(`Profil ${name} sélectionné`); }}><span className="fo-profile-mark">{name === "Bay Harbour Capital" ? "BH" : "NS"}</span><span>{name}<small>{name === "Bay Harbour Capital" ? "Venture fund-of-funds" : "Venture capital"}</small></span>{profile === name && <Check size={13} />}</button>)}
        </div></>}
        <main className="fo-main">
          <header className="fo-topbar">
            <div className="fo-breadcrumb"><span>Workspace</span><ChevronRight size={12} /><strong>{navItems.find((item) => item.id === section)?.label}</strong></div>
            <div className="fo-top-actions"><span className="fo-sync"><i />Espace à jour</span><button className="fo-icon-btn" aria-label="Notifications" onClick={() => { setSection("signals"); setToast(`${pending.length} signaux attendent une revue humaine`); }}><Bell /></button><button className="fo-icon-btn" aria-label="Menu" onClick={() => setMobileNav(!mobileNav)}><Menu /></button></div>
          </header>
          <div className="fo-content">
            {section === "overview" && renderOverview()}
            {section === "signals" && renderSignalsPage()}
            {section === "managers" && renderManagersPage()}
            {section === "holdings" && renderHoldingsPage()}
            {section === "diligence" && renderDiligence()}
            {section === "readouts" && renderReadouts()}
            {section === "audit" && renderAudit()}
            <div style={{ borderTop: "1px solid #e4e8e3", marginTop: 23, paddingTop: 12, display: "flex", justifyContent: "space-between", gap: 12, color: "#929b93", fontSize: 9 }}>
              <span>Prototype Fund OS · {profile} · Données fictives</span><span>Décisions humaines · Sources traçables · Aucune valorisation</span>
            </div>
          </div>
        </main>
      </div>
      {drawer && <>
        <button className="fo-drawer-backdrop" aria-label="Fermer la source" onClick={() => setDrawer(null)} />
        <aside className="fo-drawer" aria-label="Source et traçabilité" role="dialog" aria-modal="true" aria-labelledby="fo-drawer-title">
          <div className="fo-drawer-head"><div><div className="fo-drawer-kicker">Signal · {drawer.kind}</div><h2 id="fo-drawer-title">{editing ? "Modifier le signal" : "Source & traçabilité"}</h2></div><button className="fo-icon-btn" aria-label="Fermer" onClick={() => setDrawer(null)}><X /></button></div>
          <div className="fo-drawer-body">
            <div className="fo-drawer-section"><div className="fo-drawer-label">Élément examiné</div><div className="fo-source-card"><div className="fo-source-top"><div className="fo-source-icon"><Activity /></div><div><b>{drawer.title}</b><span>{drawer.origin} · {drawer.date}</span></div></div>{editing ? <textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Modifier la note du signal" style={{ width: "100%", minHeight: 102, marginTop: 12, padding: 10, resize: "vertical", border: "1px solid #dfe6df", borderRadius: 7, background: "#fbfcfa", color: "#435247", fontSize: 11, lineHeight: 1.55 }} /> : <p className="fo-quote">{drawer.summary}</p>}</div></div>
            <div className="fo-drawer-section"><div className="fo-drawer-label">Source originale</div><div className="fo-source-card"><div className="fo-source-top"><div className="fo-source-icon"><FileText /></div><div><b>{drawer.source}</b><span>Ajoutée par {drawer.owner} · Pièce fictive</span></div></div><blockquote className="fo-quote">{drawer.quote}</blockquote></div></div>
            <div className="fo-drawer-section"><div className="fo-drawer-label">Provenance & contexte</div>
              <div className="fo-trace-row"><span>Origine</span><b>{drawer.origin}</b></div><div className="fo-trace-row"><span>Responsable</span><b>{drawer.owner}</b></div><div className="fo-trace-row"><span>Confiance du signal</span><b>{drawer.confidence}</b></div><div className="fo-trace-row"><span>Statut de revue</span><b>{drawer.status}</b></div><div className="fo-trace-row"><span>Dernière mise à jour</span><b>{drawer.date}</b></div>
            </div>
            <div className="fo-disclaimer" style={{ marginTop: 2 }}><AlertCircle />Information de démonstration. À vérifier dans sa source avant toute utilisation.</div>
          </div>
          <div className="fo-drawer-foot">{editing ? <><span>Modification locale, attribuée à Camille</span><div style={{ display: "flex", gap: 7 }}><button className="fo-btn" onClick={() => { setEditing(false); setDraft(drawer.summary); }}>Annuler</button><button className="fo-btn primary" onClick={saveEdit}><Check />Enregistrer</button></div></> : <><span>Traçabilité conservée · jamais une décision automatique</span><button className="fo-btn" onClick={() => openSignalForEdit(drawer)}><Pencil />Modifier</button></>}</div>
        </aside>
      </>}
      {toast && <div className="fo-toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
