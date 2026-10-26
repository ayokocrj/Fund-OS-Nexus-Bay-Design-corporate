import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, AudioLines, Check, CheckCircle2,
  ChevronDown, ChevronRight, Clock3, FileSpreadsheet, FileText, History,
  LayoutGrid, Search, ShieldCheck, X,
} from "lucide-react";
import "./evidencereconciliation.css";

type Finding = {
  id: string;
  title: string;
  kind: "conflict" | "supported" | "gap";
  refs: string[];
  note: string;
  excerpt: string;
  location: string;
  source: string;
  sourceIcon: "pdf" | "audio" | "sheet" | "image";
};

const findings: Finding[] = [
  {
    id: "01", title: "First-close date differs across source materials", kind: "conflict",
    refs: ["E-01", "E-02", "E-03"], note: "Two September references; one October expectation. Confirm which timing is current.",
    excerpt: "We currently expect an initial close in October 2025, subject to final documentation.",
    location: "Page 6 · quarterly partner update · June 2025", source: "Meridian Ridge · Q2 update.pdf", sourceIcon: "pdf",
  },
  {
    id: "02", title: "September close is conditional on LP confirmations", kind: "supported",
    refs: ["E-02", "E-03"], note: "Transcript and operating tracker align on a conditional September target.",
    excerpt: "If the last two LPs confirm before month-end, we may be able to bring the first close forward to September.",
    location: "08:16–08:31 · partner call · 12 June 2025", source: "Partner call · 12 June.wav", sourceIcon: "audio",
  },
  {
    id: "03", title: "Reserve policy is not visible in the deck capture", kind: "gap",
    refs: ["E-04"], note: "The supplied image does not show policy details; underlying policy remains unverified.",
    excerpt: "Reserve policy detail is not visible in the supplied slide capture.",
    location: "Slide 14 · marked region 2", source: "Reserve policy · deck capture.png", sourceIcon: "image",
  },
];

const sourceDetails: Record<string, { label: string; excerpt: string; location: string; icon: "pdf" | "audio" | "sheet" | "image" }> = {
  "E-01": { label: "Meridian Ridge · Q2 update.pdf", excerpt: "We currently expect an initial close in October 2025, subject to final documentation.", location: "Page 6 · Quarterly partner update · June 2025", icon: "pdf" },
  "E-02": { label: "Partner call · 12 June.wav", excerpt: "If the last two LPs confirm before month-end, we may be able to bring the first close forward to September.", location: "08:16–08:31 · Call transcript · Camille Laurent", icon: "audio" },
  "E-03": { label: "Fund operating metrics.xlsx", excerpt: "Target first close: 30 September 2025 · Condition: final documentation · Pending confirmations: 2 LPs", location: "Worksheet “Close” · cells B12–B14", icon: "sheet" },
  "E-04": { label: "Reserve policy · deck capture.png", excerpt: "Reserve policy detail is not visible in the supplied slide capture.", location: "Slide 14 · highlighted right-hand panel · region 2", icon: "image" },
};

const fileIcon = (kind: string) => kind === "audio" ? <AudioLines size={16} /> : kind === "sheet" ? <FileSpreadsheet size={16} /> : kind === "image" ? <LayoutGrid size={16} /> : <FileText size={16} />;

export function EvidenceReconciliation() {
  const [selectedId, setSelectedId] = useState("01");
  const [selectedRef, setSelectedRef] = useState("E-01");
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("All findings");
  const selected = findings.find((item) => item.id === selectedId) ?? findings[0];
  const inspected = sourceDetails[selectedRef];
  const awaiting = findings.filter((item) => !decisions[item.id]).length;
  const reviewed = Object.keys(decisions).length;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const selectFinding = (item: Finding) => {
    setSelectedId(item.id);
    setSelectedRef(item.refs[0]);
  };
  const decide = (decision: string) => {
    setDecisions((current) => ({ ...current, [selected.id]: decision }));
    notify(`${decision} · Finding ${selected.id} recorded locally`);
  };

  return (
    <div className="er-shell">
      <header className="er-topbar">
        <div className="er-brand"><span className="er-mark"><Activity size={17} /></span><span>Fieldnotes<small>Bay Harbour Capital</small></span></div>
        <div className="er-top-actions">
          <button onClick={() => notify("Search is scoped to this synthetic review")}><Search size={15} /><span>Search workspace</span></button>
          <span className="er-avatar">CL</span>
        </div>
      </header>
      <div className="er-layout">
        <nav className="er-rail">
          <div className="er-workspace-label">Fund workspace</div>
          <div className="er-rail-title">Meridian Ridge</div>
          <div className="er-rail-tabs">
            <button className="er-tab active"><LayoutGrid size={15} /> Evidence review <span className="er-count">{awaiting}</span></button>
            <button className="er-tab" onClick={() => notify("Source shelf is represented in the inspector")}><FileText size={15} /> Source shelf <span className="er-count">4</span></button>
            <button className="er-tab" onClick={() => notify("Review history is shown in the activity panel")}><History size={15} /> Review history</button>
          </div>
          <div className="er-rail-divider" />
          <div className="er-deal-label">Recent reviews</div>
          <div className="er-deal current"><i className="er-deal-dot" /> NB-042 · Partner review</div>
          <div className="er-deal"><i className="er-deal-dot" style={{ background: "#9ca99e" }} /> NB-039 · Q1 update</div>
          <div className="er-rail-foot">Fictional workspace<br />Local prototype · synthetic materials only</div>
        </nav>

        <main className="er-main">
          <div className="er-breadcrumb"><span>Reviews</span><ChevronRight size={12} /><span>NB-042</span><ChevronRight size={12} /><b>Evidence reconciliation</b></div>
          <div className="er-heading">
            <div>
              <div className="er-kicker">Partner review · 18 June 2025</div>
              <h1>Resolve the evidence,<br />not the narrative.</h1>
              <p>Compare source statements side by side. Decide what the record can safely say.</p>
            </div>
            <div className="er-run-state"><span className="er-live-dot" /> Review draft <span>·</span><Clock3 size={12} /> Updated 09:16</div>
          </div>
          <div className="er-summary">
            <div className="er-summary-item"><strong>{findings.length}</strong><span>Findings assembled</span></div>
            <div className="er-summary-item"><strong>{awaiting}</strong><span>Need a decision</span></div>
            <div className="er-summary-item"><strong>{reviewed}</strong><span>Reviewed by you</span></div>
          </div>

          <div className="er-section-head">
            <h2>Decision docket</h2>
            <button className="er-tab" style={{ width: "auto", padding: "5px 8px" }} onClick={() => setFilter(filter === "All findings" ? "Open only" : "All findings")}>{filter}<ChevronDown size={13} /></button>
          </div>
          <div className="er-issue-list">
            {findings.filter((item) => filter === "All findings" || !decisions[item.id]).map((item) => (
              <article key={item.id} className={`er-issue ${selectedId === item.id ? "selected" : ""}`} onClick={() => selectFinding(item)}>
                <div className="er-issue-top">
                  <span className={`er-issue-type ${item.kind === "supported" ? "green" : item.kind === "gap" ? "gray" : ""}`}>
                    {item.kind === "conflict" ? <AlertTriangle size={13} /> : item.kind === "supported" ? <CheckCircle2 size={13} /> : <Search size={13} />}
                    {decisions[item.id] ?? (item.kind === "conflict" ? "Conflict" : item.kind === "supported" ? "Aligned evidence" : "Evidence gap")}
                  </span>
                  <span className="er-issue-tag">Finding {item.id}</span>
                </div>
                <h3>{item.title}</h3>
                <div className="er-issue-meta">
                  {item.refs.map((ref) => <button key={ref} className="er-ref-chip" onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); setSelectedRef(ref); }}><FileText size={11} />{ref}</button>)}
                  <span className="er-chevron"><ChevronRight size={15} /></span>
                </div>
              </article>
            ))}
          </div>

          <section className="er-compare">
            <div className="er-compare-head"><strong>Compare source statements</strong><span>{selected.refs.length} linked references · Finding {selected.id}</span></div>
            <div className="er-source-pair">
              <div className="er-source">
                <div className="er-source-label"><AlertTriangle size={13} /> {selected.kind === "conflict" ? "Report · October" : "Selected source"}</div>
                <blockquote>{selected.id === "01" ? <>“We currently expect an initial close in <mark>October 2025</mark>, subject to final documentation.”</> : `“${selected.excerpt}”`}</blockquote>
                <cite>{selected.source} · {selected.location}</cite>
              </div>
              <div className="er-source">
                <div className="er-source-label"><CheckCircle2 size={13} /> {selected.kind === "conflict" ? "Call + tracker · September" : "Context to verify"}</div>
                <blockquote>{selected.id === "01" ? <>“Bring the first close forward to <mark>September</mark>.” Tracker target: <mark>30 September 2025</mark>.</> : selected.note}</blockquote>
                <cite>{selected.id === "01" ? "E-02 · 08:16 transcript; E-03 · Close!B12" : "Review note · synthetic sources only"}</cite>
              </div>
            </div>
            <div className="er-compare-foot">
              <span><ShieldCheck size={13} /> {selected.note}</span>
              <button onClick={() => { setSelectedRef(selected.refs[Math.min(selected.refs.indexOf(selectedRef) + 1, selected.refs.length - 1)]); notify("Next linked source opened in inspector"); }}>Inspect next source <ArrowRight size={13} /></button>
            </div>
          </section>
          <div className="er-review-actions">
            <button className="er-button primary" onClick={() => decide("Accepted with caveat")}><Check size={14} />Accept with caveat</button>
            <button className="er-button" onClick={() => decide("Needs partner follow-up")}><MessageSquareIcon />Request follow-up</button>
            <button className="er-button" onClick={() => decide("Not supported")}><X size={14} />Not supported</button>
            <span className="er-review-hint">Decision stays attached to this evidence set</span>
          </div>
        </main>

        <aside className="er-inspector">
          <div className="er-inspector-head"><h2>Source inspector</h2><button aria-label="Open source search" onClick={() => notify("Source search is not connected in this prototype")}><Search size={15} /></button></div>
          {inspected && <div className="er-selected-source">
            <div className="er-source-file"><span className="er-file-icon">{fileIcon(inspected.icon)}</span><span><strong>{inspected.label}</strong><small>Linked evidence · {selectedRef}</small></span></div>
            <p className="er-source-excerpt">“{inspected.excerpt}”</p>
            <div className="er-source-context"><div className="er-context-title">Exact source reference</div>{inspected.location}</div>
            <button className="er-context-link" onClick={() => notify(`${selectedRef} source context opened locally`)}>Open source context <ArrowRight size={12} /></button>
          </div>}
          <div className="er-inspector-divider" />
          <div className="er-history-title">Review trail</div>
          <div className="er-history">
            <div className="er-history-row"><span className="er-history-icon"><Check size={12} /></span><span><strong>Source references linked</strong><small>Report p. 6, call 08:16 and Close!B12</small></span></div>
            <div className="er-history-row"><span className="er-history-icon"><Search size={12} /></span><span><strong>Timing mismatch surfaced</strong><small>October expectation does not align with September target</small></span></div>
            <div className="er-history-row"><span className="er-history-icon"><Clock3 size={12} /></span><span><strong>Awaiting reviewer decision</strong><small>Nothing has been written to an external record</small></span></div>
          </div>
          <div className="er-safety"><ShieldCheck size={14} /><span><b>Human judgment stays in the loop.</b> Sources and decisions here are synthetic and local to this prototype.</span></div>
        </aside>
      </div>
      {toast && <div className="er-toast">{toast}</div>}
    </div>
  );
}

function MessageSquareIcon() {
  return <span style={{ display: "inline-flex", width: 14, height: 14, alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1 }}>↗</span>;
}
