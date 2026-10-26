import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2,
  ChevronDown, Clock3, FileText, Filter, MessageSquareText, MoreHorizontal,
  Search, ShieldCheck, SkipForward, Sparkles, X, XCircle,
} from "lucide-react";
import "./signalroom.css";

type ReviewItem = {
  id: string;
  title: string;
  manager: string;
  source: string;
  sourceType: string;
  date: string;
  owner: string;
  category: string;
  confidence: string;
  excerpt: string;
  note: string;
  status: "Needs review" | "Accepted" | "Dismissed" | "Follow-up";
};

const initialItems: ReviewItem[] = [
  {
    id: "SR-024",
    title: "Meridian may bring its first close forward",
    manager: "Meridian Ridge Partners",
    source: "Partner conversation · June 12, 2025",
    sourceType: "Conversation note",
    date: "Today, 09:42",
    owner: "Camille Laurent",
    category: "Fundraising",
    confidence: "Medium",
    excerpt: "“We may bring the first close forward if the last two LPs confirm before month-end.”",
    note: "The fund is exploring an earlier first close than planned. Revisit at the next LP update.",
    status: "Needs review",
  },
  {
    id: "SR-023",
    title: "Harbourlight adds carbon data to its next thesis",
    manager: "Harbourlight Ventures",
    source: "Quarterly letter · Q2 2025",
    sourceType: "Quarterly letter",
    date: "Yesterday, 16:08",
    owner: "Louis Bernard",
    category: "Investment thesis",
    confidence: "High",
    excerpt: "“Our next vehicle will devote more attention to carbon data and supplier compliance.”",
    note: "The investment thesis is expanding toward carbon measurement tools for supply chains.",
    status: "Needs review",
  },
  {
    id: "SR-022",
    title: "Aster Materials is not actively fundraising",
    manager: "Aster Materials",
    source: "Meeting notes · June 11, 2025",
    sourceType: "Meeting notes",
    date: "Yesterday, 11:23",
    owner: "Nora Petit",
    category: "Company",
    confidence: "Unassessed",
    excerpt: "“We want to better understand the route to market before discussing any fundraising.”",
    note: "EPFL-founded team developing lower-carbon building materials. No investment follow-up was agreed.",
    status: "Needs review",
  },
  {
    id: "SR-021",
    title: "Investment partner leaving Cedar Ridge",
    manager: "Cedar Ridge Capital",
    source: "Annual review memo · June 10, 2025",
    sourceType: "Annual review",
    date: "Jun 10, 14:10",
    owner: "Camille Laurent",
    category: "Team change",
    confidence: "Medium",
    excerpt: "“Sophie will finish at quarter-end; company coverage will be redistributed across the team.”",
    note: "Document implications for continuity of the strategy and company coverage.",
    status: "Needs review",
  },
];

const statusTone: Record<ReviewItem["status"], string> = {
  "Needs review": "sr-status-pending",
  Accepted: "sr-status-accepted",
  Dismissed: "sr-status-dismissed",
  "Follow-up": "sr-status-followup",
};

export function SignalRoom() {
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState(initialItems[0].id);
  const [filter, setFilter] = useState<"Open" | "All" | "Accepted" | "Dismissed">("Open");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState(initialItems[0].note);
  const [editingNote, setEditingNote] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [toast, setToast] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === "All" || (filter === "Open" ? item.status === "Needs review" : item.status === filter);
    const haystack = `${item.title} ${item.manager} ${item.category}`.toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase());
  }), [items, filter, search]);
  const openCount = items.filter((item) => item.status === "Needs review").length;

  const announce = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const selectItem = (item: ReviewItem) => {
    setSelectedId(item.id);
    setNote(item.note);
    setEditingNote(false);
    setShowSource(false);
  };

  const decide = (status: ReviewItem["status"]) => {
    if (!selected) return;
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status, note } : item));
    announce(status === "Accepted" ? "Added to the relationship record" : status === "Dismissed" ? "Dismissed with source retained" : "Follow-up added to the review queue");
    const next = visibleItems.find((item) => item.id !== selected.id && item.status === "Needs review");
    if (next) selectItem(next);
  };

  const saveNote = () => {
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, note } : item));
    setEditingNote(false);
    announce("Reviewer note saved");
  };

  const moveBy = (direction: number) => {
    const index = visibleItems.findIndex((item) => item.id === selectedId);
    const next = visibleItems[index + direction];
    if (next) selectItem(next);
  };

  const filterOptions: Array<typeof filter> = ["Open", "All", "Accepted", "Dismissed"];

  return (
    <main className="signal-room">
      <header className="sr-topbar">
        <div className="sr-brand">
          <div className="sr-brand-mark"><span /></div>
          <div><strong>Bay Harbour</strong><small>INVESTMENT OFFICE</small></div>
        </div>
        <div className="sr-top-context"><span>Workspace</span><i>/</i><b>Review room</b></div>
        <div className="sr-top-right"><span className="sr-session"><i /> PRIVATE WORKSPACE</span><button className="sr-avatar" onClick={() => announce("Signed in as Camille Laurent")}>CL</button></div>
      </header>

      <div className="sr-layout">
        <aside className="sr-queue">
          <div className="sr-queue-heading">
            <div className="sr-kicker">MONDAY, JUNE 16, 2025 <span>·</span> DAILY REVIEW</div>
            <h1>Signal room<span className="sr-count-badge">{openCount.toString().padStart(2, "0")}</span></h1>
            <p>Evidence first. Decisions stay with you.</p>
          </div>
          <div className="sr-queue-controls">
            <label className="sr-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a signal" aria-label="Search signals" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={13} /></button>}</label>
            <div className="sr-filter-row"><span><Filter size={13} /> VIEW</span><div className="sr-filter-pills">{filterOptions.map((option) => <button key={option} className={filter === option ? "is-selected" : ""} onClick={() => setFilter(option)}>{option}</button>)}</div></div>
          </div>
          <div className="sr-list-label"><span>INCOMING SIGNALS</span><span>{visibleItems.length} ITEMS <ChevronDown size={12} /></span></div>
          <div className="sr-queue-list">
            {visibleItems.length ? visibleItems.map((item, index) => (
              <button key={item.id} className={`sr-queue-item ${item.id === selectedId ? "is-current" : ""}`} onClick={() => selectItem(item)}>
                <span className="sr-item-marker">{item.id === selectedId ? <span /> : <i />}</span>
                <span className="sr-item-content">
                  <span className="sr-item-meta"><b>{item.category}</b><i>{item.date}</i></span>
                  <strong>{item.title}</strong>
                  <span className="sr-item-manager">{item.manager}</span>
                  <span className={`sr-item-status ${statusTone[item.status]}`}><i />{item.status === "Needs review" ? "Awaiting your review" : item.status}</span>
                </span>
                {index === 0 && filter === "Open" && <span className="sr-new-label">NEW</span>}
              </button>
            )) : <div className="sr-empty"><div className="sr-empty-icon"><CheckCircle2 /></div><b>Nothing in this view</b><span>Try another filter or clear your search.</span><button onClick={() => { setFilter("All"); setSearch(""); }}>Show all signals</button></div>}
          </div>
          <div className="sr-queue-foot"><ShieldCheck size={15} /><span>Human review required.<br /><b>No action is taken automatically.</b></span><button aria-label="Review policy" onClick={() => setShowGuide(!showGuide)}><MoreHorizontal size={17} /></button></div>
        </aside>

        <section className="sr-case">
          {selected ? <>
            <div className="sr-case-toolbar">
              <div className="sr-case-breadcrumb"><span>REVIEW QUEUE</span><span className="sr-slash">/</span><b>{selected.id}</b><span className={`sr-status ${statusTone[selected.status]}`}><i />{selected.status}</span></div>
              <div className="sr-case-nav"><button onClick={() => moveBy(-1)} aria-label="Previous signal" disabled={visibleItems.findIndex((item) => item.id === selectedId) <= 0}><ArrowLeft size={15} /></button><span>{Math.max(visibleItems.findIndex((item) => item.id === selectedId) + 1, 1)} <i>of</i> {visibleItems.length}</span><button onClick={() => moveBy(1)} aria-label="Next signal" disabled={visibleItems.findIndex((item) => item.id === selectedId) >= visibleItems.length - 1}><ArrowRight size={15} /></button></div>
            </div>

            <div className="sr-case-content">
              <div className="sr-case-title-row">
                <div>
                  <div className="sr-case-eyebrow"><span className="sr-category-mark"><Sparkles size={13} /></span>{selected.category}<span className="sr-case-dot">·</span>Signal {selected.id}</div>
                  <h2>{selected.title}</h2>
                  <button className="sr-manager-link" onClick={() => announce(`${selected.manager} relationship record opened`)}>{selected.manager}<ArrowUpRight size={13} /></button>
                </div>
                <button className="sr-more" aria-label="More signal options" onClick={() => setShowGuide(!showGuide)}><MoreHorizontal /></button>
              </div>

              <div className="sr-evidence-label"><span>01</span><h3>Source evidence</h3><i /><span className="sr-evidence-confidence">{selected.confidence} confidence</span></div>
              <article className="sr-evidence-card">
                <div className="sr-evidence-card-head"><div className="sr-file-icon"><FileText size={17} /></div><div><strong>{selected.sourceType}</strong><span>{selected.source}</span></div><button onClick={() => setShowSource(!showSource)}>{showSource ? "Hide source" : "View source"}<ArrowUpRight size={13} /></button></div>
                <blockquote>{selected.excerpt}</blockquote>
                {showSource && <div className="sr-source-detail"><div className="sr-source-detail-rule" /><div><b>Source context</b><p>Captured by {selected.owner} and added to this review on {selected.date.toLowerCase()}. This excerpt is a synthetic demonstration record; confirm the original source before relying on it.</p></div><span>ORIGINAL<br />REFERENCE</span></div>}
                <div className="sr-evidence-attribution"><span>CAPTURED BY</span><b>{selected.owner}</b><span className="sr-attribution-divider" /><span>ORIGIN</span><b>{selected.sourceType}</b><span className="sr-evidence-time"><Clock3 size={12} />{selected.date}</span></div>
              </article>

              <div className="sr-evidence-label sr-interpretation-label"><span>02</span><h3>Working interpretation</h3><i /><span className="sr-reviewer-only">REVIEWER ONLY</span></div>
              <div className="sr-note-card">
                <div className="sr-note-icon"><MessageSquareText size={16} /></div>
                <div className="sr-note-main">{editingNote ? <textarea value={note} onChange={(event) => setNote(event.target.value)} aria-label="Edit working interpretation" autoFocus /> : <p>{note}</p>}<span>Context for the next conversation — not an investment decision.</span></div>
                {editingNote ? <div className="sr-note-actions"><button onClick={() => { setNote(selected.note); setEditingNote(false); }}>Cancel</button><button className="sr-note-save" onClick={saveNote}><Check size={13} />Save note</button></div> : <button className="sr-note-edit" onClick={() => setEditingNote(true)}>Edit note</button>}
              </div>

              <div className="sr-context-strip">
                <div><span className="sr-context-index">A</span><span><b>Relationship</b><small>{selected.manager}</small></span><ArrowUpRight size={13} /></div>
                <div><span className="sr-context-index">B</span><span><b>Signal type</b><small>{selected.category}</small></span><ChevronDown size={13} /></div>
                <button onClick={() => announce("No related signals found in this demonstration")}><span className="sr-context-index">C</span><span><b>Related context</b><small>Explore linked signals</small></span><ArrowRight size={13} /></button>
              </div>

              {showGuide && <div className="sr-guide"><div><ShieldCheck size={16} /><b>Review with context</b></div><p>Accept when the source supports a durable relationship update. Use follow-up when the detail needs verification. Dismissed signals remain in the audit record.</p><button onClick={() => setShowGuide(false)} aria-label="Close review guide"><X size={15} /></button></div>}
            </div>

            <footer className="sr-decision-bar">
              <div className="sr-decision-hint"><span>YOUR DECISION</span><small>Recorded to the local audit trail</small></div>
              <div className="sr-decision-actions"><button className="sr-dismiss" onClick={() => decide("Dismissed")}><XCircle size={15} />Dismiss</button><button className="sr-followup" onClick={() => decide("Follow-up")}><SkipForward size={15} />Follow up</button><button className="sr-accept" onClick={() => decide("Accepted")}><Check size={16} />Accept signal <span>↵</span></button></div>
            </footer>
          </> : <div className="sr-no-selection"><CheckCircle2 size={32} /><h2>Review queue complete</h2><p>All incoming signals have a decision. Your next review begins when new evidence arrives.</p><button onClick={() => setFilter("All")}>View all signals</button></div>}
        </section>
      </div>
      <div className="sr-bottom-note"><span>DEMO WORKSPACE</span><i />Sources and decisions are illustrative; no external system is connected.</div>
      {toast && <div className="sr-toast" role="status"><CheckCircle2 size={16} />{toast}</div>}
    </main>
  );
}
