import { Building2, CalendarClock, DollarSign, ExternalLink, LoaderCircle, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../lib/api";
import { formatCurrencyRange, formatDate, toIsoOrUndefined } from "../lib/format";
import type { Application } from "../types";
import { StatusBadge } from "./StatusBadge";
import { useToast } from "../context/ToastContext";

export function ApplicationDetail({ application, onEdit, onDelete, onUpdate }: { application: Application; onEdit: () => void; onDelete: () => void; onUpdate: (application: Application) => void }) {
  const { showToast } = useToast();
  const [scheduling, setScheduling] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [interview, setInterview] = useState({ type: "Technical interview", dateTime: "", interviewer: "", meetingLink: "", notes: "" });
  const submitInterview = async (event: FormEvent) => {
    event.preventDefault();
    if (!interview.dateTime) return;
    setScheduling(true);
    try {
      const result = await api.addInterview(application.id, { ...interview, dateTime: toIsoOrUndefined(interview.dateTime)!, interviewer: interview.interviewer || undefined, meetingLink: interview.meetingLink || undefined, notes: interview.notes || undefined });
      onUpdate(result.data);
      setShowInterview(false);
      showToast("Interview scheduled");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not schedule interview", "error");
    } finally {
      setScheduling(false);
    }
  };
  return (
    <div className="detail-view">
      <div className="detail-hero">
        <div className="company-logo company-logo--large">{application.company.slice(0, 2).toUpperCase()}</div>
        <div><div className="detail-hero__status"><StatusBadge status={application.status} /><span>Updated {formatDate(application.updatedAt)}</span></div><h3>{application.role}</h3><p>{application.company}</p></div>
        <div className="detail-hero__actions"><button className="button button--secondary" onClick={onEdit}><Pencil />Edit</button><button className="icon-button icon-button--danger" aria-label="Delete application" onClick={onDelete}><Trash2 /></button></div>
      </div>
      <div className="detail-grid">
        <section className="detail-card"><h4>Role details</h4><dl className="detail-list"><div><dt><Building2 />Company</dt><dd>{application.company}</dd></div><div><dt><MapPin />Location</dt><dd>{application.location}</dd></div><div><dt><DollarSign />Salary range</dt><dd>{formatCurrencyRange(application.salaryMin, application.salaryMax)}</dd></div><div><dt><CalendarClock />Applied</dt><dd>{formatDate(application.appliedDate)}</dd></div><div><dt><CalendarClock />Next action</dt><dd>{formatDate(application.nextActionDate, "MMM d, yyyy 'at' h:mm a")}</dd></div></dl>{application.sourceUrl ? <a className="text-link" href={application.sourceUrl} target="_blank" rel="noreferrer">Open original job post <ExternalLink /></a> : null}</section>
        <section className="detail-card"><div className="section-title"><div><h4>Interview plan</h4><p>{application.interviews.length ? `${application.interviews.length} conversation${application.interviews.length === 1 ? "" : "s"} tracked` : "No interviews scheduled yet"}</p></div><button className="button button--small button--secondary" onClick={() => setShowInterview((value) => !value)}><Plus />Schedule</button></div>
          {showInterview ? <form className="interview-form" onSubmit={submitInterview}><label className="field"><span>Interview type</span><input value={interview.type} onChange={(event) => setInterview((current) => ({ ...current, type: event.target.value }))} required /></label><label className="field"><span>Date & time</span><input type="datetime-local" value={interview.dateTime} onInput={(event) => { const dateTime = event.currentTarget.value; setInterview((current) => ({ ...current, dateTime })); }} required /></label><label className="field"><span>Interviewer</span><input value={interview.interviewer} onChange={(event) => setInterview((current) => ({ ...current, interviewer: event.target.value }))} placeholder="Name or team" /></label><label className="field"><span>Meeting link</span><input type="url" value={interview.meetingLink} onChange={(event) => setInterview((current) => ({ ...current, meetingLink: event.target.value }))} placeholder="https://..." /></label><button className="button button--primary button--small" disabled={scheduling}>{scheduling ? <LoaderCircle className="spin" /> : <CalendarClock />}Save interview</button></form> : null}
          <div className="timeline">{application.interviews.length ? [...application.interviews].sort((a, b) => a.dateTime.localeCompare(b.dateTime)).map((item) => <div className="timeline__item" key={item.id}><span className="timeline__dot"><UserRound /></span><div><strong>{item.type}</strong><p>{formatDate(item.dateTime, "EEEE, MMM d 'at' h:mm a")}</p>{item.interviewer ? <small>With {item.interviewer}</small> : null}{item.meetingLink ? <a href={item.meetingLink} target="_blank" rel="noreferrer">Join meeting <ExternalLink /></a> : null}</div></div>) : <p className="muted-copy">When a conversation is booked, add it here so your preparation stays attached to the opportunity.</p>}</div>
        </section>
      </div>
      <section className="detail-card"><h4>Notes</h4><p className="notes-copy">{application.notes || "No notes added yet."}</p></section>
    </div>
  );
}
