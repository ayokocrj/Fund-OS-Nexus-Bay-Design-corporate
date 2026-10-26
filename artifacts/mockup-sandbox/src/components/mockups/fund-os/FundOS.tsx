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
type SignalStatus = "Needs review" | "Accepted" | "Edited" | "Dismissed";
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
    id: "sig-01", title: "A shift in Meridian's fundraising timeline", origin: "Partner conversation", kind: "Manager",
    summary: "The fund is exploring an earlier first close than planned. Revisit at the next LP update.",
    date: "Today · 09:42", owner: "Camille Laurent", source: "Conversation note · June 12, 2025",
    quote: "“We may bring the first close forward if the last two LPs confirm before month-end.”",
    status: "Needs review", confidence: "Medium confidence",
  },
  {
    id: "sig-02", title: "A new thesis in climate infrastructure", origin: "Quarterly letter", kind: "Thesis",
    summary: "Harbourlight is expanding its thesis toward carbon measurement tools for supply chains.",
    date: "Yesterday · 16:08", owner: "Louis Bernard", source: "Harbourlight · Q2 2025 letter",
    quote: "“Our next vehicle will devote more attention to carbon data and supplier compliance.”",
    status: "Needs review", confidence: "High confidence",
  },
  {
    id: "sig-03", title: "Introduction to Aster Materials", origin: "Meeting notes", kind: "Company",
    summary: "An EPFL-founded team developing lower-carbon building materials. No investment follow-up was agreed.",
    date: "Yesterday · 11:23", owner: "Nora Petit", source: "Meeting notes · Aster Materials · June 11, 2025",
    quote: "“We want to better understand the route to market before discussing any fundraising.”",
    status: "Needs review", confidence: "Unassessed",
  },
  {
    id: "sig-04", title: "A team change at Cedar Ridge", origin: "Annual review call", kind: "Manager",
    summary: "An investment partner is leaving. Document any implications for continuity of the strategy.",
    date: "June 10 · 14:10", owner: "Camille Laurent", source: "Annual review memo · June 10, 2025",
    quote: "“Sophie will finish at quarter-end; company coverage will be redistributed across the team.”",
    status: "Needs review", confidence: "Medium confidence",
  },
];

const managerRows = [
  { initials: "MR", name: "Meridian Ridge Partners", focus: "Venture · Pre-seed", region: "Europe", stage: "Active coverage", tone: "active", signals: "2 open", next: "LP update · Jun 24" },
  { initials: "HL", name: "Harbourlight Ventures", focus: "Climate · Series A", region: "Europe / US", stage: "In diligence", tone: "warn", signals: "1 open", next: "References · Jun 19" },
  { initials: "CR", name: "Cedar Ridge Capital", focus: "Software · Seed", region: "North America", stage: "Portfolio", tone: "neutral", signals: "1 open", next: "Annual review · Jul 2" },
  { initials: "PL", name: "Pine & Lake Ventures", focus: "Digital health", region: "Europe", stage: "Portfolio", tone: "neutral", signals: "None", next: "Q2 letter expected" },
  { initials: "AR", name: "Alder Run Capital", focus: "Fintech · Seed", region: "United Kingdom", stage: "To qualify", tone: "warn", signals: "None", next: "Introduction · Jun 27" },
];

const fundHoldings = [
  { initials: "MR", name: "Meridian Ridge III", type: "Fund · Pre-seed", sector: "Software", status: "Active coverage", vintage: "2023", commitment: "Commitment tracked" },
  { initials: "HL", name: "Harbourlight Climate I", type: "Fund · Climate", sector: "Climate", status: "In diligence", vintage: "2025", commitment: "Diligence" },
  { initials: "CR", name: "Cedar Ridge Seed II", type: "Fund · Seed", sector: "B2B SaaS", status: "Portfolio", vintage: "2022", commitment: "Portfolio" },
];
const companyHoldings = [
  { initials: "AS", name: "Aster Materials", type: "Direct · Materials", sector: "Climate", status: "Exploratory coverage", vintage: "—", commitment: "Exploratory coverage" },
  { initials: "FL", name: "Fieldnote Health", type: "Direct · Digital health", sector: "Health", status: "Portfolio", vintage: "2024", commitment: "Portfolio" },
  { initials: "NO", name: "Northline Robotics", type: "Direct · Robotics", sector: "Industry", status: "Portfolio", vintage: "2023", commitment: "Portfolio" },
];

const navItems: { id: Section; label: string; icon: typeof Activity; count?: string }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "signals", label: "Signals", icon: Activity, count: "04" },
  { id: "managers", label: "Managers", icon: Users },
  { id: "holdings", label: "Portfolio", icon: BriefcaseBusiness },
  { id: "diligence", label: "Diligence", icon: ListChecks },
  { id: "readouts", label: "Readouts", icon: FileText },
  { id: "audit", label: "Audit trail", icon: Fingerprint },
];

const sectionCopy: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "The details worth your attention, with every decision kept human." },
  signals: { title: "Signals for review", subtitle: "Sourced information surfaced for review — never decided automatically." },
  managers: { title: "Managers", subtitle: "Relationships, investment theses, and fund diligence." },
  holdings: { title: "Portfolio", subtitle: "A consolidated view of the funds and companies the team follows." },
  diligence: { title: "Diligence", subtitle: "Work in progress, evidence to gather, and what comes next." },
  readouts: { title: "Readouts", subtitle: "Portfolio briefs prepared for the team to review." },
  audit: { title: "Audit trail", subtitle: "A local history of human actions in this demonstration." },
};

function Status({ label, tone = "active" }: { label: string; tone?: string }) {
  return <span className={`fo-status ${tone === "warn" ? "warn" : tone === "neutral" ? "neutral" : ""}`}><i />{label}</span>;
}

function SignalIcon({ kind }: { kind: string }) {
  const Icon = kind === "Company" ? Target : kind === "Thesis" ? Sparkles : Handshake;
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
  const [filter, setFilter] = useState("All");
  const [holdingMode, setHoldingMode] = useState<"Funds" | "Direct" | "All">("All");
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [auditEvents, setAuditEvents] = useState<string[]>([
    "Camille Laurent opened today's review · 09:42",
    "Louis Bernard added a source to Harbourlight · Yesterday",
    "Nora Petit created the Q2 readout · June 11",
  ]);

  const profileCode = profile === "Bay Harbour Capital" ? "BH" : "NS";
  const profileType = profile === "Bay Harbour Capital" ? "Venture fund-of-funds" : "Venture capital";
  const pending = signals.filter((item) => item.status === "Needs review");
  const visibleSignals = useMemo(() => signals.filter((item) => {
    const matchesQuery = `${item.title} ${item.summary} ${item.origin} ${item.kind}`.toLowerCase().includes(query.toLowerCase());
     return matchesQuery && (filter === "All" || item.status === filter);
  }), [signals, query, filter]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const announce = (message: string) => {
    setToast(message);
    setAuditEvents((events) => [`You · ${message} · Just now`, ...events].slice(0, 8));
  };

  const updateSignal = (id: string, status: SignalStatus) => {
    const item = signals.find((signal) => signal.id === id);
    if (!item) return;
    setSignals((current) => current.map((signal) => signal.id === id ? { ...signal, status } : signal));
    announce(status === "Accepted" ? "Signal accepted for the record" : status === "Dismissed" ? "Signal dismissed; audit trail retained" : status === "Needs review" ? "Signal returned to review" : "Signal updated and saved");
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
    setSignals((current) => current.map((signal) => signal.id === drawer.id ? { ...signal, summary: draft, status: "Edited" } : signal));
    setDrawer({ ...drawer, summary: draft, status: "Edited" });
    setEditing(false);
    announce("Editorial note saved");
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
        {!compact && signal.status === "Needs review" && <>
          <button className="fo-mini-action accept" aria-label={`Accept ${signal.title}`} title="Accept" onClick={() => updateSignal(signal.id, "Accepted")}><Check /></button>
          <button className="fo-mini-action" aria-label={`Edit ${signal.title}`} title="Edit" onClick={() => openSignalForEdit(signal)}><Pencil /></button>
          <button className="fo-mini-action reject" aria-label={`Dismiss ${signal.title}`} title="Dismiss" onClick={() => updateSignal(signal.id, "Dismissed")}><X /></button>
        </>}
      </div>
    </div>
  ));

  const renderHoldingsTable = (rows: typeof fundHoldings) => (
    <div className="fo-table-wrap">
      <table className="fo-table">
        <thead><tr><th>Portfolio record</th><th>Type</th><th>Thesis</th><th>Status</th><th>Vintage</th><th>Coverage</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name} onClick={() => announce(`${row.name} record opened in preview`)} style={{ cursor: "pointer" }}>
          <td><div className="fo-table-name"><span className="fo-holding-mark">{row.initials}</span><div><b>{row.name}</b><span>{profile === "Bay Harbour Capital" ? "Bay Harbour Capital" : "Northstar Ventures"}</span></div></div></td>
          <td>{row.type}</td><td>{row.sector}</td>
          <td><Status label={row.status} tone={row.status.includes("diligence") ? "warn" : row.status === "Portfolio" ? "neutral" : "active"} /></td>
          <td className="fo-mono">{row.vintage}</td><td>{row.commitment}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="fo-heading-row">
        <div className="fo-heading">
          <div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Partner workspace <span>·</span> {profile}</div>
          <h1>Good morning, Camille</h1>
          <p>Here’s what deserves your attention today.</p>
        </div>
        <div className="fo-date-control"><CalendarDays />Week of June 16, 2025<ChevronDown size={12} /></div>
      </div>
      <div className="fo-disclaimer"><ShieldCheck />Synthetic demo data · Human review is required. No external actions or automated decisions are enabled.</div>
      <div className="fo-grid">
        <div className="fo-column">
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Portfolio coverage</h2><p className="fo-panel-subtitle">Coverage at a glance · no valuation metrics</p></div><button className="fo-text-btn" onClick={() => selectSection("holdings")}>View portfolio <ArrowRight /></button></div>
            <div className="fo-metrics">
              <OverviewMetric label="Managers covered" value="12" foot="4 active relationships" icon={Users} />
              <OverviewMetric label="Funds tracked" value="08" foot="3 vintages represented" icon={Layers3} />
              <OverviewMetric label="Direct companies" value="06" foot="Non-financial coverage" icon={Target} />
              <OverviewMetric label="For review" value={`${String(pending.length).padStart(2, "0")}`} foot="Signals awaiting a person" icon={Inbox} />
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Signals to review <span className="fo-signal-count">· {pending.length}</span></h2><p className="fo-panel-subtitle">Sourced context, waiting for your read</p></div><button className="fo-text-btn" onClick={() => selectSection("signals")}>View all <ArrowRight /></button></div>
            <div className="fo-activity">{renderSignalRows(pending.slice(0, 3))}</div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Selected coverage</h2><p className="fo-panel-subtitle">Funds and direct company relationships · synthetic examples</p></div><button className="fo-text-btn" onClick={() => selectSection("holdings")}>Full portfolio <ArrowRight /></button></div>
            <div className="fo-holdings">
              {[...fundHoldings.slice(0, 2), companyHoldings[0]].map((row) => <div className="fo-holding" key={row.name}>
                <div className="fo-holding-name"><span className="fo-holding-mark">{row.initials}</span><div><strong>{row.name}</strong><span>{row.type}</span></div></div>
                <div className="fo-holding-meta">{row.sector}<small>{row.status}</small></div>
                 <div className="fo-holding-meta">{row.vintage === "—" ? "Direct" : `Vintage ${row.vintage}`}<small>Coverage record</small></div>
                <div className="fo-commit"><ChevronRight size={13} /></div>
              </div>)}
            </div>
          </section>
        </div>
        <div className="fo-column">
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Coverage activity</h2><p className="fo-panel-subtitle">Documented activity · illustrative only</p></div><button className="fo-icon-btn" aria-label="Readout options" onClick={() => announce("Readout options opened")}><MoreHorizontal /></button></div>
            <div className="fo-chart-wrap">
              <div className="fo-chart-legend"><span><i className="fo-legend-dot" />Managers with activity</span><span><i className="fo-legend-dot light" />Sources reviewed</span><span className="fo-illustrative">Illustrative trend</span></div>
              <svg className="fo-chart" viewBox="0 0 360 130" role="img" aria-label="Illustrative document coverage activity from April to June">
                <defs><linearGradient id="foArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#769b7b" stopOpacity=".15" /><stop offset="100%" stopColor="#769b7b" stopOpacity="0" /></linearGradient></defs>
                {[20, 52, 84, 116].map((y) => <line key={y} x1="31" y1={y} x2="350" y2={y} className="fo-chart-grid" />)}
                <text x="0" y="23" className="fo-chart-label">12</text><text x="5" y="55" className="fo-chart-label">08</text><text x="5" y="87" className="fo-chart-label">04</text><text x="9" y="119" className="fo-chart-label">00</text>
                <path className="fo-chart-area" d="M32 88 C60 80,72 70,98 74 S140 44,164 54 S210 43,231 50 S274 22,294 34 S327 19,350 24 L350 117 L32 117 Z" />
                <path className="fo-chart-line" d="M32 88 C60 80,72 70,98 74 S140 44,164 54 S210 43,231 50 S274 22,294 34 S327 19,350 24" />
                <path className="fo-chart-line2" d="M32 101 C57 93,74 100,98 91 S139 81,164 87 S204 68,231 78 S270 62,294 68 S328 52,350 57" />
                <text x="28" y="129" className="fo-chart-label">APR</text><text x="128" y="129" className="fo-chart-label">MAY</text><text x="224" y="129" className="fo-chart-label">JUN</text><text x="321" y="129" className="fo-chart-label">NEXT</text>
              </svg>
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Next steps</h2><p className="fo-panel-subtitle">Open work across the team</p></div><button className="fo-text-btn" onClick={() => selectSection("diligence")}>Diligence <ArrowRight /></button></div>
            <div className="fo-worklist">
              <div className="fo-work-item"><div className="fo-work-mark"><Handshake /></div><div className="fo-work-copy"><b>References · Harbourlight Climate I</b><span>4 contacts to document · Louis Bernard</span></div><span className="fo-work-date">Jun 19</span></div>
              <div className="fo-work-item"><div className="fo-work-mark"><FileCheck2 /></div><div className="fo-work-copy"><b>LP update · Meridian Ridge III</b><span>Revisit first-close timing · Camille Laurent</span></div><span className="fo-work-date">Jun 24</span></div>
              <div className="fo-work-item"><div className="fo-work-mark"><Clock3 /></div><div className="fo-work-copy"><b>Annual review · Cedar Ridge</b><span>Prepare follow-up questions</span></div><span className="fo-work-date">Jul 2</span></div>
            </div>
          </section>
          <section className="fo-panel">
            <div className="fo-panel-head"><div><h2 className="fo-panel-title">Recent activity</h2><p className="fo-panel-subtitle">Human actions recorded in this session</p></div><button className="fo-text-btn" onClick={() => selectSection("audit")}>Open audit trail <ArrowRight /></button></div>
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
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Intelligence · Human review</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions">
        <div className="fo-search"><Search /><input aria-label="Search signals" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search signals…" /></div>
        <select className="fo-filter" aria-label="Filter by status" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All</option><option>Needs review</option><option>Accepted</option><option>Edited</option><option>Dismissed</option></select>
      </div></div>
      <div className="fo-disclaimer"><ShieldCheck />Every signal retains its source, context, and review status. No summary is treated as a decision.</div>
      {visibleSignals.length ? <div className="fo-review-list">{visibleSignals.map((signal) => <article className="fo-panel fo-review-card" key={signal.id}>
         <div className="fo-review-card-top"><div><div className="fo-eyebrow">{signal.kind} <span>·</span> {signal.origin}</div><h3>{signal.title}</h3><p>{signal.summary}</p></div><Status label={signal.status} tone={signal.status === "Needs review" ? "warn" : signal.status === "Dismissed" ? "neutral" : "active"} /></div>
        <div className="fo-review-meta"><span><Clock3 size={11} /> {signal.date}</span><span><Users size={11} /> {signal.owner}</span><span><Sparkles size={11} /> {signal.confidence}</span></div>
        <div className="fo-review-actions">
           <button className="fo-btn" onClick={() => openTrace(signal)}><FileText />Source & audit trail</button>
           {signal.status === "Needs review" && <><button className="fo-btn primary" onClick={() => updateSignal(signal.id, "Accepted")}><Check />Accept</button><button className="fo-btn" onClick={() => openSignalForEdit(signal)}><Pencil />Edit</button><button className="fo-btn ghost" onClick={() => updateSignal(signal.id, "Dismissed")}><XCircle />Dismiss</button></>}
           {signal.status !== "Needs review" && <button className="fo-btn" onClick={() => updateSignal(signal.id, "Needs review")}><ArrowDownRight />Reopen review</button>}
        </div>
      </article>)}</div> : <div className="fo-panel fo-empty"><div className="fo-empty-mark"><Inbox /></div><b>No signals in this view</b><span>Adjust your filters or search to continue.</span></div>}
    </>
  );

  const renderManagersPage = () => (
    <>
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Relationships · Funds</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions"><div className="fo-search"><Search /><input aria-label="Search managers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, thesis, region…" /></div><button className="fo-btn" onClick={() => announce("Manager record creation is not available in this demo")}><Plus />New record</button></div></div>
      <div className="fo-disclaimer"><ShieldCheck />Synthetic demo data. Statuses organize work only; they are not investment recommendations.</div>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Portfolio relationships</h2><p className="fo-panel-subtitle">{filteredManagers.length} records · illustrative information</p></div><button className="fo-icon-btn" aria-label="Filter options" onClick={() => announce("Manager filters are not configured in this demo")}><SlidersHorizontal /></button></div>
        <div className="fo-table-wrap"><table className="fo-table"><thead><tr><th>Manager</th><th>Thesis</th><th>Region</th><th>Status</th><th>Signals</th><th>Next milestone</th><th /></tr></thead><tbody>{filteredManagers.map((row) => <tr key={row.name} onClick={() => announce(`${row.name} record selected`)} style={{ cursor: "pointer" }}><td><div className="fo-table-name"><span className="fo-holding-mark">{row.initials}</span><div><b>{row.name}</b><span>Partner relationship</span></div></div></td><td>{row.focus}</td><td>{row.region}</td><td><Status label={row.stage} tone={row.tone} /></td><td>{row.signals}</td><td>{row.next}</td><td><ChevronRight size={13} /></td></tr>)}</tbody></table></div>
        {filteredManagers.length === 0 && <div className="fo-empty"><div className="fo-empty-mark"><Search /></div><b>No records found</b><span>Try another name or thesis.</span></div>}
      </section>
      <div className="fo-grid" style={{ marginTop: 16 }}>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Coverage cadence</h2><p className="fo-panel-subtitle">A coverage reminder, not a performance score</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CalendarDays /></div><div className="fo-work-copy"><b>4 conversations to document</b><span>Partner meetings planned over the next two weeks</span></div></div><div className="fo-work-item"><div className="fo-work-mark"><FileText /></div><div className="fo-work-copy"><b>2 quarterly letters expected</b><span>Most recent source: May 2025</span></div></div></div></section>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">About these statuses</h2><p className="fo-panel-subtitle">Workflow labels, not conclusions</p></div></div><div className="fo-worklist"><div className="fo-work-item"><Status label="In diligence" tone="warn" /><div className="fo-work-copy"><span>Research steps documented; no automated conclusion.</span></div></div><div className="fo-work-item"><Status label="Active coverage" /><div className="fo-work-copy"><span>Active relationship or planned follow-up.</span></div></div></div></section>
      </div>
    </>
  );

  const renderHoldingsPage = () => {
    const fundRows = holdingMode === "Direct" ? [] : fundHoldings;
    const directRows = holdingMode === "Funds" ? [] : companyHoldings;
    const visibleRows = [...fundRows, ...directRows].filter((row) => `${row.name} ${row.type} ${row.sector} ${row.status}`.toLowerCase().includes(query.toLowerCase()));
    return <>
      <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Portfolio · Consolidated view</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><div className="fo-view-actions"><div className="fo-search"><Search /><input aria-label="Search portfolio" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, sector…" /></div><button className="fo-btn" onClick={() => announce("Adding coverage is not available in this demo; no data is sent")}><Plus />Add to coverage</button></div></div>
      <div className="fo-disclaimer"><ShieldCheck />Synthetic holdings and dates. No prices, costs, valuations, or investment recommendations are shown.</div>
      <div className="fo-panel" style={{ marginBottom: 16 }}><div className="fo-panel-head"><div><h2 className="fo-panel-title">Portfolio overview</h2><p className="fo-panel-subtitle">Coverage structure · no financial data</p></div><div className="fo-split-tabs">{(["All", "Funds", "Direct"] as const).map((mode) => <button className={holdingMode === mode ? "active" : ""} key={mode} onClick={() => setHoldingMode(mode)}>{mode}</button>)}</div></div>
        <div className="fo-metrics"><OverviewMetric label="Funds tracked" value="08" foot="Venture and specialist funds" icon={Layers3} /><OverviewMetric label="Direct companies" value="06" foot="Coverage records" icon={Target} /><OverviewMetric label="Regions documented" value="04" foot="From available sources" icon={Globe2} /><OverviewMetric label="Sources to revisit" value="03" foot="No automated summaries" icon={FileText} /></div>
      </div>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">{holdingMode === "Funds" ? "Funds tracked" : holdingMode === "Direct" ? "Direct companies" : "Coverage records"}</h2><p className="fo-panel-subtitle">{visibleRows.length} records in this view</p></div><button className="fo-icon-btn" aria-label="Coverage filters" onClick={() => announce("Coverage status filters are not configured in this demo")}><Filter /></button></div>
        {visibleRows.length ? renderHoldingsTable(visibleRows) : <div className="fo-empty"><div className="fo-empty-mark"><Search /></div><b>No portfolio records found</b><span>Try another search.</span></div>}
      </section>
      <div className="fo-grid" style={{ marginTop: 16 }}>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Funds and companies, side by side</h2><p className="fo-panel-subtitle">FoF structure without obscuring direct coverage</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><Layers3 /></div><div className="fo-work-copy"><b>Fund commitments</b><span>Thesis, vintage, LP documents, and manager relationship.</span></div><span className="fo-work-date">08</span></div><div className="fo-work-item"><div className="fo-work-mark"><Target /></div><div className="fo-work-copy"><b>Direct company coverage</b><span>Context, introductions, and conversations recorded separately.</span></div><span className="fo-work-date">06</span></div></div></section>
        <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Data provenance</h2><p className="fo-panel-subtitle">Inventory figures are synthetic</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><LockKeyhole /></div><div className="fo-work-copy"><b>No external synchronization</b><span>This prototype does not read or send data.</span></div></div></div></section>
      </div>
    </>;
  };

  const renderDiligence = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Research · Human-led work</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("A new step was added to the local demo draft")}><Plus />New step</button></div>
    <div className="fo-disclaimer"><ShieldCheck />Work status only. No investment score, recommendation, or generated conclusion.</div>
    <div className="fo-grid"><div className="fo-column">
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">In progress</h2><p className="fo-panel-subtitle">Details to document before the next team discussion</p></div><span className="fo-tag">3 records</span></div><div className="fo-worklist">
        <div className="fo-work-item"><div className="fo-work-mark"><Handshake /></div><div className="fo-work-copy"><b>Harbourlight Climate I · References</b><span>4 reference conversations to record · Louis Bernard</span></div><span className="fo-work-date">Jun 19</span></div>
        <div className="fo-work-item"><div className="fo-work-mark"><FileText /></div><div className="fo-work-copy"><b>Meridian Ridge III · Strategy note</b><span>Confirm fund-size assumptions · Camille Laurent</span></div><span className="fo-work-date">Jun 24</span></div>
        <div className="fo-work-item"><div className="fo-work-mark"><Users /></div><div className="fo-work-copy"><b>Aster Materials · Team map</b><span>Exploratory introduction; no fundraising process identified</span></div><span className="fo-work-date">Jun 27</span></div>
      </div></section>
      <section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Evidence to gather</h2><p className="fo-panel-subtitle">Illustrative checklist</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CheckCheck /></div><div className="fo-work-copy"><b>Track record of prior funds</b><span>LP source attributed · Meridian Ridge Partners</span></div><Status label="Received" /></div><div className="fo-work-item"><div className="fo-work-mark"><Clock3 /></div><div className="fo-work-copy"><b>Founder references</b><span>To complete · Harbourlight Ventures</span></div><Status label="Pending" tone="warn" /></div></div></section>
      </div><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Diligence principles</h2><p className="fo-panel-subtitle">A framework for explicit human decisions</p></div></div><div className="fo-worklist">{["Attribute a source to every claim", "Distinguish facts from interpretation", "Assign a person to each follow-up", "Keep decisions outside automation"].map((line) => <div className="fo-work-item" key={line}><div className="fo-work-mark"><Check /></div><div className="fo-work-copy"><b>{line}</b><span>Working principle · confirm with the team</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Diligence log</h2><p className="fo-panel-subtitle">Recent activity</p></div></div><div className="fo-worklist">{auditEvents.slice(0, 3).map((event) => <div className="fo-work-item" key={event}><div className="fo-work-mark"><Fingerprint /></div><div className="fo-work-copy"><b>{event.split(" · ")[0]}</b><span>{event.split(" · ").slice(1).join(" · ")}</span></div></div>)}</div></section></div></div>
  </>;

  const renderReadouts = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Reporting · Review</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("A new readout was created in the local demo draft")}><Plus />Create a readout</button></div>
    <div className="fo-disclaimer"><ShieldCheck />All briefs below are synthetic editorial mockups. No information is sent.</div>
    <div className="fo-grid"><div className="fo-column">{[
      ["Portfolio readout · Q2", "In review", "A summary of documented activity, thesis changes, and next steps for the team to validate."],
      ["Meridian Ridge · Coverage update", "Draft", "Context for the next LP conversation; the reported first-close timing remains unconfirmed."],
      ["Harbourlight · Thesis note", "Ready to review", "A reading of climate themes in the quarterly letter, linked to the original source."],
    ].map(([title, status, desc]) => <article className="fo-panel fo-review-card" key={title}><div className="fo-review-card-top"><div><div className="fo-eyebrow">Document · Internal brief</div><h3>{title}</h3><p>{desc}</p></div><Status label={status} tone={status === "Draft" ? "neutral" : "warn"} /></div><div className="fo-review-meta"><span><Clock3 size={11} /> Updated June 12, 2025</span><span><Users size={11} /> Owner: Camille Laurent</span></div><div className="fo-review-actions"><button className="fo-btn" onClick={() => announce(`Readout opened: ${title}`)}><FileText />Read brief</button><button className="fo-btn" onClick={() => announce("Human review requested")}><Check />Request review</button></div></article>)}</div><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Editorial quality</h2><p className="fo-panel-subtitle">Checks before internal circulation</p></div></div><div className="fo-worklist">{["Sources linked to relevant passages", "Open questions explicitly flagged", "No recommendations or valuations", "Reviewed by a responsible partner"].map((text) => <div className="fo-work-item" key={text}><div className="fo-work-mark"><ShieldCheck /></div><div className="fo-work-copy"><b>{text}</b><span>Preparation check</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Readout context</h2><p className="fo-panel-subtitle">Team sharing cadence</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><CalendarDays /></div><div className="fo-work-copy"><b>Q2 partner review</b><span>Scheduled for June 30 · draft not final</span></div></div></div></section></div></div>
  </>;

  const renderAudit = () => <>
    <div className="fo-view-head"><div className="fo-view-title"><div className="fo-eyebrow"><i className="fo-eyebrow-mark" />Trust · Traceability</div><h1>{currentSection.title}</h1><p>{currentSection.subtitle}</p></div><button className="fo-btn" onClick={() => announce("Local audit trail refreshed")}><Activity />Refresh</button></div>
    <div className="fo-disclaimer"><ShieldCheck />This local demo illustrates traceability without connecting to or writing to an external system.</div>
    <div className="fo-grid"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Recent events</h2><p className="fo-panel-subtitle">Visible actions attributed in this session</p></div><span className="fo-tag"><i className="fo-tag-dot" />Local</span></div><div className="fo-worklist">{auditEvents.map((event, index) => <div className="fo-work-item" key={`${event}-${index}`}><div className="fo-work-mark"><Fingerprint /></div><div className="fo-work-copy"><b>{event.split(" · ")[0]}</b><span>{event.split(" · ").slice(1).join(" · ")}</span></div><span className="fo-work-date">{index === 0 ? "Just now" : "Recorded"}</span></div>)}</div></section><div className="fo-column"><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">What this trail records</h2><p className="fo-panel-subtitle">Every decision should be explainable</p></div></div><div className="fo-worklist">{["Who took action", "What was reviewed", "Which source was used", "The status chosen and when"].map((text) => <div className="fo-work-item" key={text}><div className="fo-work-mark"><Check /></div><div className="fo-work-copy"><b>{text}</b><span>A working trace, never a substitute for judgment</span></div></div>)}</div></section><section className="fo-panel"><div className="fo-panel-head"><div><h2 className="fo-panel-title">Access context</h2><p className="fo-panel-subtitle">Role shown in this demonstration</p></div></div><div className="fo-worklist"><div className="fo-work-item"><div className="fo-work-mark"><LockKeyhole /></div><div className="fo-work-copy"><b>Partner · Full access</b><span>Active profile: {profile}</span></div><Status label="Local session" /></div></div></section></div></div>
  </>;

  return (
    <div className="fundos">
      <div className="fo-app">
        <aside className={`fo-sidebar ${mobileNav ? "is-open" : ""}`} aria-label="Primary navigation">
          <div className="fo-brand"><img src="/__mockup/images/nexus-bay-lite.svg" alt="Nexus Bay Capital" /><p className="fo-brand-caption">Fund OS · partner workspace</p></div>
          <button className="fo-profile-switch" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Switch demo profile">
            <span className="fo-profile-mark">{profileCode}</span><span className="fo-profile-meta"><b>{profile}</b><span>{profileType}</span></span><ChevronDown size={13} />
          </button>
          <div className="fo-nav-label">Workspace</div>
          <nav className="fo-nav">{navItems.map(({ id, label, icon: Icon, count }) => <button className={`fo-nav-item ${section === id ? "is-active" : ""}`} key={id} onClick={() => selectSection(id)} aria-current={section === id ? "page" : undefined}><Icon /><span>{label}</span>{count && <i className="fo-nav-count">{pending.length.toString().padStart(2, "0")}</i>}</button>)}</nav>
          <div className="fo-nav-divider" />
          <div className="fo-nav-label">Workspace</div>
          <nav className="fo-nav"><button className="fo-nav-item" onClick={() => announce("Workspace settings are illustrative and not configurable in this prototype")}><SlidersHorizontal /><span>Settings</span></button><button className="fo-nav-item" onClick={() => announce("Help content is not configured in this prototype")}><CircleHelp /><span>Help center</span></button></nav>
          <div className="fo-sidebar-bottom">
            <div className="fo-review-note"><div className="fo-review-note-top"><i className="fo-review-dot" />Human review required</div><p>Every signal needs an explicit decision. Source context stays visible.</p></div>
            <div className="fo-user"><div className="fo-avatar">CL</div><div><b>Camille Laurent</b><span>Partner · Administrator</span></div><button className="fo-icon-btn" aria-label="User profile" onClick={() => announce("Camille Laurent · partner role")}><MoreHorizontal /></button></div>
          </div>
        </aside>
        {profileOpen && <><button className="fo-drawer-backdrop" style={{ zIndex: 8, background: "transparent" }} aria-label="Close profile selector" onClick={() => setProfileOpen(false)} /><div className="fo-profile-menu">
          {(["Bay Harbour Capital", "Northstar Ventures"] as const).map((name) => <button key={name} onClick={() => { setProfile(name); setProfileOpen(false); announce(`${name} profile selected`); }}><span className="fo-profile-mark">{name === "Bay Harbour Capital" ? "BH" : "NS"}</span><span>{name}<small>{name === "Bay Harbour Capital" ? "Venture fund-of-funds" : "Venture capital"}</small></span>{profile === name && <Check size={13} />}</button>)}
        </div></>}
        <main className="fo-main">
          <header className="fo-topbar">
            <div className="fo-breadcrumb"><span>Workspace</span><ChevronRight size={12} /><strong>{navItems.find((item) => item.id === section)?.label}</strong></div>
            <div className="fo-top-actions"><span className="fo-sync"><i />Demo workspace</span><button className="fo-icon-btn" aria-label="Notifications" onClick={() => { setSection("signals"); setToast(`${pending.length} signals await human review`); }}><Bell /></button><button className="fo-icon-btn" aria-label={mobileNav ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}><Menu /></button></div>
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
              <span>Fund OS prototype · {profile} · Synthetic data</span><span>Human decisions · Traceable sources · No valuations</span>
            </div>
          </div>
        </main>
      </div>
      {drawer && <>
        <button className="fo-drawer-backdrop" aria-label="Close source panel" onClick={() => setDrawer(null)} />
        <aside className="fo-drawer" aria-label="Source and audit trail" role="dialog" aria-modal="true" aria-labelledby="fo-drawer-title">
          <div className="fo-drawer-head"><div><div className="fo-drawer-kicker">Signal · {drawer.kind}</div><h2 id="fo-drawer-title">{editing ? "Edit signal" : "Source & audit trail"}</h2></div><button className="fo-icon-btn" aria-label="Close" onClick={() => setDrawer(null)}><X /></button></div>
          <div className="fo-drawer-body">
            <div className="fo-drawer-section"><div className="fo-drawer-label">Reviewed item</div><div className="fo-source-card"><div className="fo-source-top"><div className="fo-source-icon"><Activity /></div><div><b>{drawer.title}</b><span>{drawer.origin} · {drawer.date}</span></div></div>{editing ? <textarea value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Edit signal note" style={{ width: "100%", minHeight: 102, marginTop: 12, padding: 10, resize: "vertical", border: "1px solid #dfe6df", borderRadius: 7, background: "#fbfcfa", color: "#435247", fontSize: 13, lineHeight: 1.55 }} /> : <p className="fo-quote">{drawer.summary}</p>}</div></div>
            <div className="fo-drawer-section"><div className="fo-drawer-label">Original source</div><div className="fo-source-card"><div className="fo-source-top"><div className="fo-source-icon"><FileText /></div><div><b>{drawer.source}</b><span>Added by {drawer.owner} · Synthetic source</span></div></div><blockquote className="fo-quote">{drawer.quote}</blockquote></div></div>
            <div className="fo-drawer-section"><div className="fo-drawer-label">Provenance & context</div>
              <div className="fo-trace-row"><span>Origin</span><b>{drawer.origin}</b></div><div className="fo-trace-row"><span>Owner</span><b>{drawer.owner}</b></div><div className="fo-trace-row"><span>Signal confidence</span><b>{drawer.confidence}</b></div><div className="fo-trace-row"><span>Review status</span><b>{drawer.status}</b></div><div className="fo-trace-row"><span>Last updated</span><b>{drawer.date}</b></div>
            </div>
            <div className="fo-disclaimer" style={{ marginTop: 2 }}><AlertCircle />Synthetic demo information. Verify against its source before any use.</div>
          </div>
          <div className="fo-drawer-foot">{editing ? <><span>Local edit, attributed to Camille</span><div style={{ display: "flex", gap: 7 }}><button className="fo-btn" onClick={() => { setEditing(false); setDraft(drawer.summary); }}>Cancel</button><button className="fo-btn primary" onClick={saveEdit}><Check />Save</button></div></> : <><span>Audit trail retained · never an automated decision</span><button className="fo-btn" onClick={() => openSignalForEdit(drawer)}><Pencil />Edit</button></>}</div>
        </aside>
      </>}
      {toast && <div className="fo-toast" role="status" aria-live="polite">{toast}</div>}
    </div>
  );
}
