import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AudioLines, Check, CheckCheck, ChevronRight, CircleHelp, Clock3,
  FileAudio2, FileImage, FileSpreadsheet, FileText, FileVideo2, Headphones,
  History, Image, ListChecks, LoaderCircle, MessageSquareText, Mic2, Paperclip,
  Play, Plus, RotateCcw, ShieldCheck, Sparkles, Square, X, XCircle,
} from "lucide-react";
import "./agentworkspace.css";

type View = "workspace" | "approvals" | "evidence" | "activity";
type Status = "Pending" | "Approved" | "Edited" | "Rejected";
type ReviewStatus = Status | "Reviewed";
type TaskDraft = { id: number; prompt: string; files: File[]; created: string };
type Evidence = {
  id: string; name: string; kind: "document" | "audio" | "sheet" | "image" | "video";
  detail: string; ref: string; excerpt: string; context: string; attribution: string;
};
type Claim = { id: string; text: string; refs: string[]; status: Status; group: "supported" | "conflict" | "missing" };

const evidenceSeed: Evidence[] = [
  { id: "E-01", name: "Meridian Ridge · Q2 update.pdf", kind: "document", detail: "Quarterly report · 8 pages", ref: "p. 6", excerpt: "We currently expect an initial close in October 2025, subject to final documentation.", context: "Meridian Ridge Partners · Quarterly partner update · June 2025 · Page 6", attribution: "Synthetic document · PDF page reference" },
  { id: "E-02", name: "Partner call · 12 June.wav", kind: "audio", detail: "Call transcript · 18:24", ref: "08:16", excerpt: "If the last two LPs confirm before month-end, we may be able to bring the first close forward to September.", context: "Partner call transcript · 12 June 2025 · 08:16–08:31", attribution: "Synthetic transcript excerpt · timestamp reference" },
  { id: "E-03", name: "Fund operating metrics.xlsx", kind: "sheet", detail: "Operating tracker · 4 tabs", ref: "Close!B12", excerpt: "Target first close: 30 September 2025", context: "Fund operating metrics · worksheet “Close” · cell B12", attribution: "Synthetic spreadsheet cell reference" },
  { id: "E-04", name: "Reserve policy · deck capture.png", kind: "image", detail: "Presentation screenshot · slide 14", ref: "region 2", excerpt: "Reserve policy detail is not visible in the supplied slide capture.", context: "Partner review deck screenshot · slide 14 · highlighted right-hand panel", attribution: "Synthetic image region reference" },
  { id: "E-05", name: "Recorded portfolio walkthrough.mp4", kind: "video", detail: "Preview · next phase", ref: "—", excerpt: "Video evidence preview is shown as a storyboard concept; no media is attached or analyzed.", context: "Recorded video support is a planned capability, not enabled in this prototype.", attribution: "Capability preview · no playback available" },
];
const startClaims: Claim[] = [
  { id: "c1", group: "supported", text: "Meridian’s materials describe an initial close in September 2025, contingent on final documentation and two LP confirmations.", refs: ["E-02", "E-03"], status: "Pending" },
  { id: "c2", group: "conflict", text: "The quarterly report still expects an October 2025 close. This conflicts with the September timing in the call transcript and operating tracker; confirm which date is current.", refs: ["E-01", "E-02", "E-03"], status: "Pending" },
  { id: "c3", group: "missing", text: "Reserve-policy evidence was not present in the reviewed deck screenshot. The underlying policy remains unverified.", refs: ["E-04"], status: "Pending" },
];
const stepsSeed = [
  { title: "Read the quarterly update", note: "Located close-date language · page 6", time: "09:14" },
  { title: "Review the call transcript", note: "Matched conditional September timing · 08:16", time: "09:15" },
  { title: "Compare operating tracker", note: "Found September 30 target · Close!B12", time: "09:15" },
  { title: "Check the deck screenshot", note: "Reserve-policy detail not visible in slide 14 capture", time: "09:16" },
];

function EvidenceIcon({ kind, size = 15 }: { kind: Evidence["kind"]; size?: number }) {
  const Icon = kind === "audio" ? FileAudio2 : kind === "sheet" ? FileSpreadsheet : kind === "image" ? FileImage : kind === "video" ? FileVideo2 : FileText;
  return <Icon size={size} />;
}

function StatusPill({ status }: { status: ReviewStatus }) {
  return <span className={`aw-small-status ${status === "Approved" ? "approved" : ""}`}>{status === "Pending" ? "Awaiting your review" : status}</span>;
}

function DetailContent({ evidence }: { evidence: Evidence }) {
  if (evidence.kind === "audio") return <div className="aw-detail-transcript"><time>08:16 — Camille Laurent</time>“If the last two LPs confirm before month-end, we may be able to bring the first close forward to September.”<br /><br /><time>08:29 — Meridian Ridge partner</time>“That’s the working plan, though final documentation is still in progress.”</div>;
  if (evidence.kind === "sheet") return <table className="aw-detail-grid"><thead><tr><th>Cell</th><th>Field</th><th>Value</th></tr></thead><tbody><tr><td>Close!B12</td><td>Target first close</td><td>30 September 2025</td></tr><tr><td>Close!B13</td><td>Condition</td><td>Final documentation</td></tr><tr><td>Close!B14</td><td>Pending confirmations</td><td>2 LPs</td></tr></tbody></table>;
  if (evidence.kind === "image") return <div className="aw-detail-region"><div className="aw-region-box" /><span>Slide 14 · marked region 2</span></div>;
  if (evidence.kind === "video") return <div className="aw-detail-transcript"><time>Storyboard preview · no playback</time>00:00 — Intro title card<br />00:18 — Portfolio overview, slide capture<br />00:42 — Reserve policy section is listed in the agenda<br /><br />Recorded video is shown as a planned evidence type. No video file or playback is connected.</div>;
  return <div className="aw-detail-paper"><h3>Meridian Ridge Partners · Q2 partner update</h3><p>Fund III is progressing through final documentation. The team currently expects an <span className="aw-detail-highlight">initial close in October 2025</span>, subject to final documentation.</p><p>We will share a further update once timing is confirmed with participating limited partners.</p><p style={{ color: "#92988e", fontSize: 9 }}>Page 6 · synthetic document excerpt · not an original source</p></div>;
}

export function AgentWorkspace() {
  const [view, setView] = useState<View>("workspace");
  const [claims, setClaims] = useState(startClaims);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [claimDraft, setClaimDraft] = useState("");
  const [evidence, setEvidence] = useState(evidenceSeed);
  const [detail, setDetail] = useState<Evidence | null>(null);
  const [taskStatus, setTaskStatus] = useState<"Draft ready" | "Running" | "Cancelled" | "Run complete">("Draft ready");
  const [composer, setComposer] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([]);
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefText, setBriefText] = useState("Meridian Ridge’s current materials point to a September 2025 first close, subject to final documentation and two LP confirmations.");
  const [savedBrief, setSavedBrief] = useState(briefText);
  const [notice, setNotice] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [runStep, setRunStep] = useState(stepsSeed.length);
  const [audit, setAudit] = useState(["09:16 · Draft assembled from four synthetic source examples", "09:15 · Spreadsheet and transcript references linked", "09:14 · Task scope confirmed by Camille Laurent"]);
  const fileInput = useRef<HTMLInputElement>(null);
  const runTimer = useRef<number | null>(null);
  const pendingCount = claims.filter((claim) => claim.status === "Pending").length;
  const decidedCount = claims.filter((claim) => claim.status !== "Pending").length;
  const navItems: { id: View; label: string; icon: typeof Activity; count?: number }[] = [
    { id: "workspace", label: "Agent workspace", icon: Sparkles },
    { id: "approvals", label: "Human approvals", icon: CheckCheck, count: pendingCount },
    { id: "evidence", label: "Evidence library", icon: FileText, count: evidence.length },
    { id: "activity", label: "Activity log", icon: History },
  ];
  const approvedClaims = useMemo(() => claims.filter((claim) => claim.status === "Approved").length, [claims]);
  const reviewedClaims = useMemo(() => claims.filter((claim) => claim.status !== "Pending").length, [claims]);
  const briefReviewStatus: ReviewStatus = pendingCount > 0 ? "Pending" : claims.every((claim) => claim.status === "Approved") ? "Approved" : "Reviewed";

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => () => { if (runTimer.current) window.clearTimeout(runTimer.current); }, []);
  useEffect(() => {
    if (!detail && !templateOpen && !voiceOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setDetail(null); setTemplateOpen(false); setVoiceOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, templateOpen, voiceOpen]);

  const log = (message: string) => setAudit((items) => [`09:17 · ${message}`, ...items].slice(0, 12));
  const openEvidence = (id: string) => {
    const found = evidence.find((item) => item.id === id);
    if (found) setDetail(found);
  };
  const decideClaim = (id: string, status: Status) => {
    setClaims((current) => current.map((claim) => claim.id === id ? { ...claim, status } : claim));
    const wording = status === "Approved" ? "Claim approved for the draft record" : status === "Edited" ? "Claim marked edited by reviewer" : "Claim rejected; source retained";
    log(wording);
    setNotice(wording);
  };
  const beginClaimEdit = (claim: Claim) => {
    setEditingClaimId(claim.id);
    setClaimDraft(claim.text);
  };
  const saveClaimEdit = (id: string) => {
    const changed = claimDraft.trim();
    if (!changed) { setNotice("Claim wording cannot be empty"); return; }
    setClaims((current) => current.map((claim) => claim.id === id ? { ...claim, text: changed, status: "Pending" } : claim));
    setEditingClaimId(null);
    log("Claim wording edited; returned to pending approval");
    setNotice("Claim edited · approval reset to pending");
  };
  const startDemoRun = () => {
    if (taskStatus === "Running") return;
    setTaskStatus("Running");
    setRunStep(0);
    log("Demo run started using the seeded synthetic task only");
    let count = 0;
    const advance = () => {
      count += 1;
      setRunStep(count);
      if (count >= stepsSeed.length) {
        setTaskStatus("Run complete");
        setClaims(startClaims);
        setBriefText("Meridian Ridge’s current materials point to a September 2025 first close, subject to final documentation and two LP confirmations.");
        setSavedBrief("Meridian Ridge’s current materials point to a September 2025 first close, subject to final documentation and two LP confirmations.");
        log("Scripted demo run completed; reviewable draft restored from synthetic evidence");
        setNotice("Demo run complete · seeded examples only");
      } else {
        runTimer.current = window.setTimeout(advance, 650);
      }
    };
    runTimer.current = window.setTimeout(advance, 450);
  };
  const cancelRun = () => {
    if (runTimer.current) window.clearTimeout(runTimer.current);
    runTimer.current = null;
    setTaskStatus("Cancelled");
    log("Demo run cancelled by reviewer");
  };
  const retryRun = () => { setClaims(startClaims); startDemoRun(); };
  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    setAttachments((current) => [...current, ...picked]);
    event.target.value = "";
  };
  const createTask = () => {
    if (!composer.trim() && attachments.length === 0) { setNotice("Add a task prompt or select local files first"); return; }
    const saved = { id: Date.now(), prompt: composer.trim() || "Task prompt not provided", files: [...attachments], created: "Just now" };
    setTaskDrafts((current) => [saved, ...current]);
    log(`Session task draft saved${attachments.length ? ` with ${attachments.length} local filename${attachments.length === 1 ? "" : "s"}` : ""}`);
    setNotice(attachments.length ? "Session draft saved · attachments are not analyzed" : "Task prompt saved for this session");
    setComposer("");
    setAttachments([]);
  };
  const openTaskDraft = (draft: TaskDraft) => {
    setComposer(draft.prompt === "Task prompt not provided" ? "" : draft.prompt);
    setAttachments([...draft.files]);
    setNotice("Session draft reopened · selected files remain unanalyzed");
  };
  const addSample = (item: Evidence) => {
    if (item.kind === "video") { setNotice("Video is a next-phase preview; no media is attached"); setTemplateOpen(false); return; }
    setEvidence((current) => current.some((source) => source.id === item.id) ? current : [...current, item]);
    setTemplateOpen(false);
    setNotice("Synthetic sample source added to this local workspace");
  };
  const saveBrief = () => {
    setSavedBrief(briefText);
    setEditingBrief(false);
    log("Partner brief wording edited and saved by Camille Laurent");
    setNotice("Brief wording saved locally");
  };

  const renderClaim = (claim: Claim) => (
    <article className={`aw-claim ${claim.group === "missing" ? "aw-missing" : ""}`} key={claim.id}>
      <div className="aw-claim-top">
        <span className={`aw-claim-mark ${claim.group !== "supported" ? "alert" : ""}`}>{claim.group === "supported" ? <Check /> : claim.group === "conflict" ? <XCircle /> : <CircleHelp />}</span>
        <div className="aw-claim-copy">
          {editingClaimId === claim.id
            ? <div className="aw-claim-editor"><label htmlFor={`aw-claim-edit-${claim.id}`}>Edit claim wording</label><textarea id={`aw-claim-edit-${claim.id}`} value={claimDraft} onChange={(event) => setClaimDraft(event.target.value)} /><div><button className="aw-btn primary" onClick={() => saveClaimEdit(claim.id)}><Check />Save wording · return to pending</button><button className="aw-btn" onClick={() => setEditingClaimId(null)}>Cancel</button></div></div>
            : <p>{claim.text}</p>}
          {claim.refs.map((ref) => <button key={ref} className="aw-inline-ref" onClick={() => openEvidence(ref)}>{ref}</button>)}
        </div>
        {editingClaimId !== claim.id && <div className="aw-claim-actions">
          <button className="aw-icon-button" title="Approve this claim" aria-label={`Approve claim: ${claim.text}`} onClick={() => decideClaim(claim.id, "Approved")}><Check /></button>
          <button className="aw-icon-button" title="Edit claim wording" aria-label={`Edit claim wording: ${claim.text}`} onClick={() => beginClaimEdit(claim)}><MessageSquareText /></button>
          <button className="aw-icon-button" title="Reject this claim" aria-label={`Reject claim: ${claim.text}`} onClick={() => decideClaim(claim.id, "Rejected")}><X /></button>
        </div>}
      </div>
      <span className={`aw-claim-status ${claim.status === "Pending" ? "pending" : ""}`}>{claim.status === "Pending" ? claim.group === "conflict" ? "Needs partner confirmation · source mismatch" : claim.group === "missing" ? "Not established by available source" : "Human review required" : `Reviewer status · ${claim.status}`}</span>
    </article>
  );

  const renderTaskHeader = () => (
    <div className="aw-page-head">
      <div><div className="aw-overline">Research assistant · task room</div><h1>Agent workspace</h1><p>One task, its evidence, and the decisions that still need you.</p></div>
      <div className="aw-head-meta"><span className="aw-head-status"><span className="aw-state-dot" />{taskStatus}<span>·</span><Clock3 /> Updated just now</span><button className={`aw-btn ${taskStatus === "Running" ? "" : "primary"}`} onClick={taskStatus === "Running" ? cancelRun : startDemoRun}>{taskStatus === "Running" ? <X /> : <Play />}{taskStatus === "Running" ? "Cancel run" : "Demo run"}</button></div>
    </div>
  );

  const renderWorkspace = () => (
    <>
      {renderTaskHeader()}
      <div className="aw-workspace-grid">
        <div className="aw-main-column">
          <section className="aw-panel">
            <div className="aw-task-intro">
              <div className="aw-task-label">Active task <span>PRD trace · NB-042</span></div>
              <h2>Prepare Meridian Ridge partner review</h2>
              <p>Compare the quarterly report, partner call, operating metrics and deck screenshot. Flag any close-date contradiction and identify missing reserve-policy evidence.</p>
              <div className="aw-task-chips"><span className="aw-chip"><FileText /> 4 linked source examples</span><span className="aw-chip"><ShieldCheck /> Human approval required</span><span className="aw-chip">Synthetic · fictional</span></div>
            </div>
            <div className="aw-plan">
              <div className="aw-plan-head"><span className="aw-plan-mark"><ListChecks /></span><strong>Visible work plan</strong><small>{taskStatus === "Running" ? `Step ${Math.min(runStep + 1, stepsSeed.length)} of ${stepsSeed.length} · scripted demo` : "Completed · 4 steps"}</small></div>
              <div className="aw-steps">
                {stepsSeed.map((step, index) => <div className={`aw-step ${taskStatus !== "Running" || index < runStep ? "done" : ""}`} key={step.title}>
                  <span className="aw-step-icon">{taskStatus === "Running" && index === runStep ? <LoaderCircle /> : <Check />}</span>
                  <div><strong>{step.title}</strong><p>{taskStatus === "Running" && index >= runStep ? (index === runStep ? "Demo step in progress · seeded example" : "Queued in this scripted run") : step.note}</p></div><time>{taskStatus === "Running" && index >= runStep ? "—" : step.time}</time>
                </div>)}
              </div>
            </div>
          </section>
          <section className="aw-panel">
            <div className="aw-panel-head"><div><h2 className="aw-panel-title">Partner brief · draft</h2><p className="aw-panel-sub">Structured output with claim-level source links · not a recommendation</p></div><div className="aw-head-actions"><button className="aw-btn" onClick={() => { setEditingBrief((value) => !value); setBriefText(savedBrief); }}>{editingBrief ? "Cancel edit" : "Edit brief"}</button><StatusPill status={briefReviewStatus} /></div></div>
            <div className="aw-brief-body">
              <div className="aw-brief-summary"><span className="aw-brief-summary-mark"><MessageSquareText /></span><p>{editingBrief ? <textarea aria-label="Edit brief summary" value={briefText} onChange={(event) => setBriefText(event.target.value)} style={{ width: "100%", minHeight: 54, resize: "vertical", border: "1px solid #dce4d8", borderRadius: 4, padding: 7, color: "#435043", background: "#fff" }} /> : <><b>Working read.</b> {savedBrief}</>}</p></div>
              <div className="aw-section-label">Supported by sources <i /></div>
              {claims.filter((claim) => claim.group === "supported").map(renderClaim)}
              <div className="aw-section-label">Contradiction to resolve <i /></div>
              {claims.filter((claim) => claim.group === "conflict").map(renderClaim)}
              <div className="aw-section-label">Evidence gap <i /></div>
              {claims.filter((claim) => claim.group === "missing").map(renderClaim)}
              <div className="aw-section-label">Proposed record updates · not applied <i /></div>
              <div className="aw-proposal"><ShieldCheck /><p><b>Relationship note:</b> Add a reviewer-confirmed close-date update only after the partner clarifies the September / October discrepancy. No record changes are made by this prototype.</p></div>
              <div className="aw-output-foot"><span><ShieldCheck /> {reviewedClaims} of {claims.length} reviewed · {approvedClaims} approved · {pendingCount} awaiting a person</span><span>Sources remain linked even if rejected</span></div>
              {editingBrief && <div className="aw-output-actions"><button className="aw-btn primary" onClick={saveBrief}><Check />Save draft wording</button><button className="aw-btn" onClick={() => { setEditingBrief(false); setBriefText(savedBrief); }}>Discard changes</button></div>}
              {editingBrief && <p className="aw-edit-note">Saving wording keeps this brief in draft and does not approve any claim.</p>}
              {!editingBrief && <div className="aw-output-actions"><button className="aw-btn primary" onClick={() => { setView("approvals"); setNotice("Review each item individually before approving"); }}><CheckCheck />Review {pendingCount} open items</button><button className="aw-btn" onClick={() => { setEditingBrief(true); setBriefText(savedBrief); }}>Edit partner brief</button><button className="aw-btn ghost" onClick={() => setNotice("No update has been applied to any external record")}>Proposed updates <ChevronRight /></button></div>}
            </div>
          </section>
        </div>
        <aside className="aw-side-column">
          <section className="aw-panel aw-evidence-panel"><div className="aw-panel-head"><div><h2 className="aw-panel-title">Evidence set</h2><p className="aw-panel-sub">{evidence.length} source examples · synthetic</p></div><button className="aw-icon-button" aria-label="Add sample evidence" title="Add sample evidence" onClick={() => setTemplateOpen(true)}><Plus /></button></div><div className="aw-evidence-list">{evidence.map((item) => <button className="aw-evidence-item" key={item.id} onClick={() => openEvidence(item.id)}><span className={`aw-file-icon ${item.kind}`}><EvidenceIcon kind={item.kind} /></span><span className="aw-evidence-info"><strong>{item.name}</strong><span>{item.detail}</span></span><span className="aw-evidence-ref">{item.ref}</span></button>)}</div><div className="aw-evidence-foot"><ShieldCheck />Every reference opens its synthetic context</div></section>
          <section className="aw-panel"><div className="aw-panel-head"><div><h2 className="aw-panel-title">Visible activity</h2><p className="aw-panel-sub">Actions and findings · no private reasoning</p></div><button className="aw-icon-button" aria-label="Open full activity log" title="Open full activity log" onClick={() => setView("activity")}><ChevronRight /></button></div><div className="aw-activity">{(taskStatus === "Running" ? stepsSeed.slice(0, Math.max(runStep, 1)).map((step) => `${step.time} · ${step.note}`) : audit.slice(0, 3)).map((item, index) => <div className="aw-activity-row" key={`${item}-${index}`}><Activity /><p>{item}</p><time>{index === 0 ? "now" : `${index + 1}m`}</time></div>)}</div></section>
          <div className="aw-agent-note"><ShieldCheck /><p><b>Your review stays in control.</b> Sources are examples; approvals here change only this local prototype. Nothing is sent or applied elsewhere.</p></div>
          <section className="aw-panel aw-composer-panel"><div className="aw-composer-top"><strong>Start another task</strong><button className="aw-btn" onClick={() => { setComposer("Prepare a partner review by comparing a quarterly report, a call transcript, an operating spreadsheet, and a deck screenshot. Surface conflicting dates and missing evidence for a human reviewer."); setNotice("Task template added to the composer"); }}>Use task template</button></div>
            {taskDrafts.length > 0 && <div className="aw-drafts"><div className="aw-drafts-heading">Session drafts <span>Not persisted</span></div>{taskDrafts.map((draft) => <div className="aw-draft-row" key={draft.id}><button className="aw-draft-open" onClick={() => openTaskDraft(draft)}><strong>{draft.prompt}</strong><small>{draft.files.length ? `${draft.files.length} local filename${draft.files.length === 1 ? "" : "s"} · not analyzed` : "No attachments"} · {draft.created}</small></button><button className="aw-icon-button" aria-label="Remove saved session draft" title="Remove draft from this session" onClick={() => setTaskDrafts((current) => current.filter((item) => item.id !== draft.id))}><X /></button></div>)}</div>}
            <div className="aw-composer"><textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="What should the research assistant prepare?" aria-label="Describe a research task" /><div className="aw-local-attachments">{attachments.map((file, index) => <span className="aw-attachment" key={`${file.name}-${index}`}><Paperclip /><span>{file.name}</span><button aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X /></button></span>)}</div><div className="aw-composer-controls"><div className="aw-compose-tools"><button className="aw-tool-btn" onClick={() => fileInput.current?.click()} title="Choose files stored only in this local preview"><Paperclip /><span>Attach</span></button><input className="aw-upload-input" ref={fileInput} type="file" multiple onChange={addFiles} aria-label="Choose local files" /><button className="aw-tool-btn" onClick={() => setVoiceOpen(true)} title="Explore a simulated sample voice note"><Mic2 /><span>Voice note</span></button><button className="aw-tool-btn" onClick={() => setTemplateOpen(true)} title="Explore synthetic sample sources"><Image /><span>Samples</span></button></div><button className="aw-run-button" onClick={createTask}><Plus />Create task</button></div></div>
            <div className="aw-local-warning"><ShieldCheck />Local preview only. Selected filenames are not uploaded or analyzed. Do not upload private fund data in this demo.</div>
            <div className="aw-sample-voice"><button aria-label={voiceOpen ? "Close sample voice note" : "Preview sample voice note"} onClick={() => setVoiceOpen(true)}><Play /></button><p><strong>Sample voice note</strong> · simulated transcript, no microphone capture<br />“Compare the close dates, and note what the deck does not show.”</p></div>
          </section>
          <div className="aw-progress-banner"><span className="aw-progress-ring">{taskStatus === "Running" ? <LoaderCircle /> : <Check />}</span><div><strong>{taskStatus === "Running" ? "Scripted demo run in progress" : "No outside actions connected"}</strong><small>{taskStatus === "Running" ? "Cancel at any time · seeded examples only" : "Drafting, approvals and changes stay in this frame"}</small></div></div>
        </aside>
      </div>
      <div className="aw-footer-note"><ShieldCheck /> Interactive prototype · Synthetic evidence · AI not connected <span>·</span> Fictional Bay Harbour Capital workspace <span>·</span> Do not upload private fund data in this demo.</div>
    </>
  );

  const renderApprovals = () => <><div className="aw-page-head"><div><div className="aw-overline">Human decisions · local only</div><h1>Approvals</h1><p>Review each statement and source independently. Nothing is accepted as fact automatically.</p></div><div className="aw-head-meta">{pendingCount} awaiting review · {reviewedClaims} reviewed</div></div><div className="aw-nav-view"><div className="aw-panel"><div className="aw-panel-head"><div><h2 className="aw-panel-title">Meridian Ridge partner review</h2><p className="aw-panel-sub">Draft output · 3 distinct review items</p></div><button className="aw-btn" onClick={() => setView("workspace")}>Back to task</button></div>{claims.map((claim) => <div className="aw-approval-item" key={claim.id}><div className="aw-approval-item-head"><div><h3>{claim.group === "supported" ? "Supported claim" : claim.group === "conflict" ? "Contradiction to resolve" : "Evidence gap"}</h3><p>{claim.text} {claim.refs.map((ref) => <button key={ref} className="aw-inline-ref" onClick={() => openEvidence(ref)}>{ref}</button>)}</p></div><StatusPill status={claim.status} /></div><div className="aw-approval-actions"><button className="aw-btn primary" onClick={() => decideClaim(claim.id, "Approved")}><Check />Approve this item</button><button className="aw-btn" onClick={() => { beginClaimEdit(claim); setView("workspace"); }}><MessageSquareText />Edit wording</button><button className="aw-btn danger" onClick={() => decideClaim(claim.id, "Rejected")}><X />Reject</button></div></div>)}</div><div className="aw-agent-note"><ShieldCheck /><p><b>Approval is item-by-item.</b> The two date sources do not reconcile: the report cites October while the call and tracker cite September. Confirm with the partner before making a durable record update.</p></div></div><div className="aw-footer-note"><ShieldCheck /> Human approval counts update locally; do not upload private fund data in this demo. There is no external record integration.</div></>;

  const renderEvidence = () => <><div className="aw-page-head"><div><div className="aw-overline">Linked sources · synthetic</div><h1>Evidence library</h1><p>Different media types are shown as inspectable source references, not live connected files.</p></div><button className="aw-btn" onClick={() => setTemplateOpen(true)}><Plus />Explore sample evidence</button></div><div className="aw-panel"><div className="aw-panel-head"><div><h2 className="aw-panel-title">Meridian Ridge · review source set</h2><p className="aw-panel-sub">Fictional sample materials for this prototype · no user uploads included</p></div><span className="aw-chip"><ShieldCheck /> Source context available</span></div>{evidence.map((item) => <div className="aw-list-row" key={item.id}><div className="aw-list-row-main"><span><EvidenceIcon kind={item.kind} /></span><div><strong>{item.name}</strong><small>{item.detail} · {item.ref}</small></div></div><button className="aw-btn" onClick={() => openEvidence(item.id)}>{item.kind === "video" ? "Preview phase" : "Inspect source"}<ChevronRight /></button></div>)}</div><div className="aw-footer-note"><ShieldCheck /> Recorded video is next phase; no live playback or meeting bots are included.</div></>;

  const renderActivity = () => <><div className="aw-page-head"><div><div className="aw-overline">Traceable actions · local session</div><h1>Activity log</h1><p>Visible task steps and human changes, without private chain-of-thought.</p></div><button className="aw-btn" onClick={() => { setAudit([]); setNotice("Local activity log cleared"); }}>Clear local log</button></div><div className="aw-panel"><div className="aw-panel-head"><div><h2 className="aw-panel-title">Task NB-042 · event history</h2><p className="aw-panel-sub">Synthetic examples · session state only</p></div></div>{audit.length ? audit.map((event, index) => <div className="aw-list-row" key={`${event}-${index}`}><div className="aw-list-row-main"><span><Activity /></span><div><strong>{event.split(" · ").slice(1).join(" · ")}</strong><small>{event.split(" · ")[0]} · Camille Laurent · local prototype</small></div></div><span className="aw-small-status approved">Recorded</span></div>) : <div className="aw-list-row"><div className="aw-list-row-main"><span><History /></span><div><strong>No activity in this local view</strong><small>Start a demo run or review an item to create an event.</small></div></div></div>}</div><div className="aw-footer-note"><ShieldCheck /> This log is temporary local interface state and is not an audit or compliance record.</div></>;

  return <main className="agent-workspace">
    <header className="aw-topbar"><div className="aw-brand"><img src="/__mockup/images/nexus-bay-dark.svg" alt="Nexus Bay" /><span className="aw-brand-rule" /><small>FUND OS</small></div><div className="aw-breadcrumb"><span>Bay Harbour Capital</span><ChevronRight size={13} /><b>Research workspace</b></div><div className="aw-top-actions"><span className="aw-prototype"><i />Interactive prototype</span><button className="aw-user" aria-label="Signed in as Camille Laurent" title="Camille Laurent · fictional workspace">CL</button></div></header>
    <div className="aw-shell"><aside className="aw-sidebar"><div className="aw-side-kicker">WORKSPACE</div><nav className="aw-nav" aria-label="Workspace sections">{navItems.map(({ id, label, icon: Icon, count }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)} aria-current={view === id ? "page" : undefined}><Icon /><span>{label}</span>{typeof count === "number" && count > 0 && <span className="aw-nav-count">{count}</span>}</button>)}</nav><div className="aw-sidebar-bottom"><div className="aw-tenant"><span className="aw-tenant-mark">BH</span><div><strong>Bay Harbour Capital</strong><small>Fictional workspace</small></div></div></div></aside>
      <section className="aw-content">{view === "workspace" ? renderWorkspace() : view === "approvals" ? renderApprovals() : view === "evidence" ? renderEvidence() : renderActivity()}</section>
    </div>
    {taskStatus === "Running" && <div className="aw-notice" role="status"><LoaderCircle /> Scripted sample run · step {Math.min(runStep + 1, stepsSeed.length)} of {stepsSeed.length}<button className="aw-btn ghost" onClick={cancelRun}><Square />Cancel</button></div>}
    {taskStatus === "Cancelled" && <div className="aw-notice" role="status"><XCircle />Run stopped before completion<button className="aw-btn" onClick={retryRun}><RotateCcw />Retry demo</button></div>}
    {taskStatus === "Run complete" && <div className="aw-notice" role="status"><Check />Draft completed from the seeded examples<button className="aw-btn ghost" onClick={() => setTaskStatus("Draft ready")}><X /></button></div>}
    {notice && <div className="aw-notice" role="status"><Check />{notice}</div>}
    {detail && <div className="aw-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><section className="aw-modal" role="dialog" aria-modal="true" aria-labelledby="aw-detail-title"><header className="aw-modal-head"><div><h2 id="aw-detail-title">Source detail</h2><p>{detail.name}</p></div><button className="aw-modal-close" aria-label="Close source detail" onClick={() => setDetail(null)}><X /></button></header><div className="aw-modal-body"><div className="aw-detail-meta"><span className="aw-detail-tag">{detail.id}</span><span className="aw-detail-tag">{detail.ref}</span><span className="aw-detail-tag">{detail.kind === "video" ? "Next phase" : "Synthetic reference"}</span></div><DetailContent evidence={detail} /><p className="aw-modal-note">{detail.context}. {detail.attribution}. This is fictional demonstration content, not an original source.</p><div className="aw-output-actions"><button className="aw-btn" onClick={() => setDetail(null)}>Close source</button><button className="aw-btn primary" onClick={() => { setDetail(null); setView("workspace"); }}>Return to linked claim</button></div></div></section></div>}
    {templateOpen && <div className="aw-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setTemplateOpen(false); }}><section className="aw-modal" role="dialog" aria-modal="true" aria-labelledby="aw-samples-title"><header className="aw-modal-head"><div><h2 id="aw-samples-title">Explore sample evidence</h2><p>Choose a synthetic source to inspect or add to this local example.</p></div><button className="aw-modal-close" aria-label="Close sample evidence" onClick={() => setTemplateOpen(false)}><X /></button></header><div className="aw-modal-body"><div className="aw-sample-list">{evidenceSeed.map((item) => <button className="aw-sample-card" key={item.id} onClick={() => item.kind === "video" ? addSample(item) : addSample(item)}><span className={`aw-file-icon ${item.kind}`}><EvidenceIcon kind={item.kind} /></span><span><strong>{item.name}</strong><small>{item.kind === "video" ? "Planned capability · storyboard only" : `${item.detail} · synthetic excerpt available`}</small></span><ChevronRight /></button>)}</div><p className="aw-modal-note">Documents, screenshots, spreadsheet cells and sample transcripts are inspectable. Recorded video is labeled as next phase: no video asset or player is connected.</p></div></section></div>}
    {voiceOpen && <div className="aw-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setVoiceOpen(false); }}><section className="aw-modal" role="dialog" aria-modal="true" aria-labelledby="aw-voice-title"><header className="aw-modal-head"><div><h2 id="aw-voice-title">Sample voice note</h2><p>A simulated transcript to illustrate the task input flow.</p></div><button className="aw-modal-close" aria-label="Close sample voice note" onClick={() => setVoiceOpen(false)}><X /></button></header><div className="aw-modal-body"><div className="aw-sample-voice" style={{ padding: 14 }}><span className="aw-file-icon audio"><Headphones /></span><p><strong>Sample voice note · 00:12</strong><br />No microphone access or recording is taking place.</p></div><div className="aw-detail-transcript" style={{ marginTop: 13 }}><time>Sample transcript · synthetic</time>“For the Meridian review, compare the close dates across the call and report. Please also note that the reserve-policy detail is not visible in the deck screenshot.”</div><div className="aw-output-actions"><button className="aw-btn" onClick={() => setVoiceOpen(false)}>Close</button><button className="aw-btn primary" onClick={() => { setComposer("Compare the Meridian close dates across the call and report, and note whether reserve-policy evidence appears in the deck screenshot."); setVoiceOpen(false); setNotice("Sample transcript added to the task prompt"); }}><AudioLines />Use sample transcript</button></div></div></section></div>}
  </main>;
}
