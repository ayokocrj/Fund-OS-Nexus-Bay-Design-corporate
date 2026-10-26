import { useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleHelp, Clock3,
  FileText, Flag, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  X, Zap,
} from "lucide-react";
import "./signalbrief.css";

type Signal = {
  id: string;
  title: string;
  org: string;
  category: string;
  time: string;
  source: string;
  author: string;
  excerpt: string;
  summary: string;
  priority: "Today" | "Watch" | "Routine";
  state: "New" | "Flagged" | "Filed";
};

const seed: Signal[] = [
  {
    id: "SR-024", title: "First close could move forward", org: "Meridian Ridge Partners",
    category: "Fundraising", time: "09:42", source: "Partner conversation · Jun 12",
    author: "Camille Laurent",
    excerpt: "“We may bring the first close forward if the last two LPs confirm before month-end.”",
    summary: "Earlier close is possible, contingent on two LP confirmations.",
    priority: "Today", state: "New",
  },
  {
    id: "SR-023", title: "Carbon data enters the next thesis", org: "Harbourlight Ventures",
    category: "Investment thesis", time: "Yesterday", source: "Quarterly letter · Q2 2025",
    author: "Louis Bernard",
    excerpt: "“Our next vehicle will devote more attention to carbon data and supplier compliance.”",
    summary: "Thesis is moving toward measurement and compliance across supply chains.",
    priority: "Watch", state: "New",
  },
  {
    id: "SR-022", title: "Aster is not actively fundraising", org: "Aster Materials",
    category: "Company", time: "Yesterday", source: "Meeting notes · Jun 11",
    author: "Nora Petit",
    excerpt: "“We want to better understand the route to market before discussing any fundraising.”",
    summary: "No near-term raise; route-to-market remains the central open question.",
    priority: "Routine", state: "New",
  },
  {
    id: "SR-021", title: "Partner departure at Cedar Ridge", org: "Cedar Ridge Capital",
    category: "Team change", time: "Jun 10", source: "Annual review memo · Jun 10",
    author: "Camille Laurent",
    excerpt: "“Sophie will finish at quarter-end; company coverage will be redistributed across the team.”",
    summary: "Confirm continuity of strategy ownership and company coverage.",
    priority: "Watch", state: "New",
  },
];

const tone: Record<Signal["priority"], string> = {
  Today: "sb-priority-today", Watch: "sb-priority-watch", Routine: "sb-priority-routine",
};

export function SignalBrief() {
  const [signals, setSignals] = useState(seed);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"Unfiled" | "All">("Unfiled");
  const [expanded, setExpanded] = useState<string | null>(seed[0].id);
  const [notice, setNotice] = useState("");
  const [showSources, setShowSources] = useState(false);

  const visible = useMemo(() => signals.filter((s) =>
    (scope === "All" || s.state !== "Filed") &&
    `${s.title} ${s.org} ${s.category}`.toLowerCase().includes(query.toLowerCase())
  ), [signals, query, scope]);

  const update = (id: string, state: Signal["state"]) => {
    setSignals((all) => all.map((s) => s.id === id ? { ...s, state } : s));
    const msg = state === "Flagged" ? "Added to partner follow-ups" : state === "Filed" ? "Filed in the relationship record" : "Signal restored";
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const today = visible.filter((s) => s.priority === "Today");
  const watch = visible.filter((s) => s.priority === "Watch");
  const routine = visible.filter((s) => s.priority === "Routine");
  const groups: [string, string, Signal[]][] = [
    ["Act today", "A decision or conversation is time-sensitive", today],
    ["Keep in view", "Useful context for the next partner touchpoint", watch],
    ["New to the record", "Captured evidence without an immediate next step", routine],
  ];

  return (
    <main className="signal-brief">
      <header className="sb-header">
        <div className="sb-brand">
          <div className="sb-mark"><span /><span /><span /></div>
          <div><b>Bay Harbour</b><small>INVESTMENT OFFICE</small></div>
        </div>
        <div className="sb-crumb">Workspace <i>/</i> Intelligence <i>/</i> <b>Daily brief</b></div>
        <div className="sb-secure"><span /> PRIVATE WORKSPACE <button onClick={() => setNotice("Signed in as Camille Laurent")}>CL</button></div>
      </header>

      <section className="sb-intro">
        <div>
          <div className="sb-overline"><span>MONDAY, JUNE 16, 2025</span><i /> PARTNER INTELLIGENCE</div>
          <h1>Good morning, Camille<span>.</span></h1>
          <p>Four things changed across your relationships. Start with what needs a conversation.</p>
        </div>
        <div className="sb-edition"><span>DAILY DISPATCH</span><b>16</b><small>JUN<br />2025</small></div>
      </section>

      <div className="sb-summary">
        <div className="sb-summary-lead"><Sparkles size={16} /><span><b>{signals.filter((s) => s.state !== "Filed").length} signals</b> · sorted by suggested attention</span></div>
        <div className="sb-summary-metrics"><span><i className="sb-dot sb-dot-hot" />{signals.filter((s) => s.priority === "Today" && s.state !== "Filed").length} needs a conversation</span><span><i className="sb-dot sb-dot-warm" />{signals.filter((s) => s.state === "Flagged").length} in follow-ups</span></div>
      </div>

      <div className="sb-workspace">
        <section className="sb-feed">
          <div className="sb-feed-controls">
            <div className="sb-tabs">
              {(["Unfiled", "All"] as const).map((tab) => <button key={tab} className={scope === tab ? "active" : ""} onClick={() => setScope(tab)}>{tab}<span>{tab === "All" ? signals.length : signals.filter((s) => s.state !== "Filed").length}</span></button>)}
            </div>
            <label className="sb-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this brief" aria-label="Search brief" />{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={13} /></button>}</label>
            <button className="sb-filter" onClick={() => setShowSources(!showSources)}><SlidersHorizontal size={14} />{showSources ? "Hide sources" : "Source details"}</button>
          </div>

          {groups.map(([heading, caption, group]) => group.length > 0 && (
            <section className="sb-group" key={heading}>
              <div className="sb-group-heading"><div><span>{heading}</span><small>{caption}</small></div><b>{String(group.length).padStart(2, "0")}</b></div>
              <div className="sb-cards">
                {group.map((signal, index) => {
                  const isOpen = expanded === signal.id;
                  return (
                    <article className={`sb-card ${isOpen ? "is-open" : ""}`} key={signal.id}>
                      <button className="sb-card-head" onClick={() => setExpanded(isOpen ? null : signal.id)} aria-expanded={isOpen}>
                        <span className={`sb-priority ${tone[signal.priority]}`}><i />{signal.priority}</span>
                        <span className="sb-card-title"><b>{signal.title}</b><small>{signal.org}<i>·</i>{signal.category}</small></span>
                        <span className="sb-card-time"><Clock3 size={12} />{signal.time}</span>
                        {signal.state === "Flagged" && <span className="sb-flagged"><Flag size={12} /> FOLLOW-UP</span>}
                        <ChevronDown size={16} className="sb-chevron" />
                      </button>
                      {isOpen && <div className="sb-card-body">
                        <div className="sb-signal-summary"><span className="sb-insight-mark"><Zap size={14} /></span><p>{signal.summary}</p><span className="sb-insight-label">TAKEAWAY</span></div>
                        <div className="sb-proof">
                          <div className="sb-proof-label"><span>PRIMARY EVIDENCE</span><span>{signal.id}</span></div>
                          <blockquote>{signal.excerpt}</blockquote>
                          {showSources && <div className="sb-source-details"><FileText size={14} /><b>{signal.source}</b><span>Captured by {signal.author}</span><button onClick={() => setNotice("Synthetic demo source — original reference not connected")}>View original <ArrowUpRight size={12} /></button></div>}
                        </div>
                        <div className="sb-card-footer">
                          <span><ShieldCheck size={13} /> Source-backed <i /> Human review required</span>
                          <div className="sb-actions">
                            {signal.state === "Flagged" ? <button onClick={() => update(signal.id, "New")}><ArrowDownRight size={13} />Remove follow-up</button> : <button onClick={() => update(signal.id, "Flagged")}><Flag size={13} />Follow up</button>}
                            <button className="sb-file-action" onClick={() => update(signal.id, signal.state === "Filed" ? "New" : "Filed")}><Check size={14} />{signal.state === "Filed" ? "Restore" : "File update"}</button>
                          </div>
                        </div>
                      </div>}
                      {index === 0 && group === today && <span className="sb-urgent-rail" />}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          {visible.length === 0 && <div className="sb-empty"><CircleHelp size={22} /><b>No signals match this view</b><span>Change the search or switch to all signals.</span><button onClick={() => { setQuery(""); setScope("All"); }}>Show all signals</button></div>}
        </section>

        <aside className="sb-side">
          <section className="sb-next">
            <div className="sb-side-kicker">YOUR NEXT MOVE <ArrowUpRight size={13} /></div>
            <h2>Ask Meridian for a close-date update.</h2>
            <p>Two LP confirmations are the hinge. A quick check-in can turn a tentative signal into a dated milestone.</p>
            <div className="sb-next-context"><span>BASED ON</span><b>SR-024 · Fundraising</b></div>
            <button onClick={() => update("SR-024", "Flagged")}><Flag size={14} />Add to follow-ups</button>
            <small>Suggestion only · You choose what happens next.</small>
          </section>
          <section className="sb-followups">
            <div className="sb-side-title"><h3>Partner follow-ups</h3><span>{signals.filter((s) => s.state === "Flagged").length}</span></div>
            {signals.filter((s) => s.state === "Flagged").length ? signals.filter((s) => s.state === "Flagged").map((s) => <button key={s.id} onClick={() => { setExpanded(s.id); setScope("All"); }}><i /><span><b>{s.org}</b><small>{s.title}</small></span><ArrowUpRight size={13} /></button>) : <div className="sb-followup-empty">No follow-ups yet.<br />Flag a signal to bring it here.</div>}
            <button className="sb-view-all" onClick={() => setScope("All")}>Review all relationships <ArrowUpRight size={12} /></button>
          </section>
          <div className="sb-footnote"><ShieldCheck size={15} /><span><b>Your judgment stays central.</b><small>Signals are sourced context, not investment advice. Nothing is sent or changed automatically.</small></span></div>
        </aside>
      </div>
      <footer className="sb-bottom"><span>DEMO WORKSPACE</span><i />Illustrative data · No external systems connected <button onClick={() => setNotice("Signal Room is a synthetic demonstration workspace.")}>About this brief</button></footer>
      {notice && <div className="sb-toast" role="status"><Check size={15} />{notice}</div>}
    </main>
  );
}
