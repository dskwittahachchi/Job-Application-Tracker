import { ArrowRight, CalendarCheck2, CalendarDays, Clock3, ExternalLink, MapPin, Sparkles, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { formatDate, formatRelativeDate } from "../lib/format";
import type { Application } from "../types";

type TimelineEvent = { id: string; type: "action" | "interview"; date: string; application: Application; title: string; subtitle: string; link?: string };

export function UpcomingPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const params = new URLSearchParams({ limit: "100", sort: "nextAction" }); setApplications((await api.applications(params)).data.applications); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load your timeline"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const events = useMemo(() => applications.flatMap<TimelineEvent>((application) => {
    const entries: TimelineEvent[] = [];
    if (application.nextActionDate) entries.push({ id: `action-${application.id}`, type: "action", date: application.nextActionDate, application, title: `Follow up with ${application.company}`, subtitle: application.role });
    application.interviews.forEach((interview) => entries.push({ id: interview.id, type: "interview", date: interview.dateTime, application, title: interview.type, subtitle: `${application.company} · ${application.role}`, link: interview.meetingLink }));
    return entries;
  }).sort((a, b) => a.date.localeCompare(b.date)), [applications]);
  const futureEvents = events.filter((event) => new Date(event.date).getTime() >= Date.now() - 60 * 60 * 1000);
  const today = new Date();
  const grouped = [
    { label: "Today", events: futureEvents.filter((event) => new Date(event.date).toDateString() === today.toDateString()) },
    { label: "Next 7 days", events: futureEvents.filter((event) => { const time = new Date(event.date).getTime(); return new Date(event.date).toDateString() !== today.toDateString() && time < Date.now() + 7 * 86400000; }) },
    { label: "Later", events: futureEvents.filter((event) => new Date(event.date).getTime() >= Date.now() + 7 * 86400000) },
  ].filter((group) => group.events.length);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading) return <LoadingState rows={6} />;
  return (
    <div className="upcoming-layout">
      <section className="timeline-panel panel">
        <div className="panel__header"><div><p className="eyebrow">Your schedule</p><h2>Action timeline</h2><p>Protect your momentum with one clear next step.</p></div><span className="event-count"><CalendarCheck2 />{futureEvents.length} upcoming</span></div>
        {grouped.length ? <div className="event-groups">{grouped.map((group) => <section key={group.label}><h3>{group.label}<span>{group.events.length}</span></h3><div className="event-list">{group.events.map((event) => <article key={event.id} className={`event-card event-card--${event.type}`}><span className="event-card__date"><strong>{formatDate(event.date, "dd")}</strong><small>{formatDate(event.date, "MMM")}</small></span><span className="event-card__icon">{event.type === "interview" ? <UsersRound /> : <Clock3 />}</span><div><span className="event-card__meta">{event.type === "interview" ? "Interview" : "Next action"} · {formatRelativeDate(event.date)}</span><h4>{event.title}</h4><p>{event.subtitle}</p><small><MapPin />{event.application.location}</small></div><StatusBadge status={event.application.status} />{event.link ? <a className="button button--small button--secondary" href={event.link} target="_blank" rel="noreferrer">Join <ExternalLink /></a> : <Link className="icon-button icon-button--bordered" to={`/applications?open=${event.application.id}`} aria-label="Open application"><ArrowRight /></Link>}</article>)}</div></section>)}</div> : <div className="quiet-state quiet-state--large"><Sparkles /><strong>Nothing needs your attention yet</strong><p>Add next-action dates or schedule an interview to build your timeline.</p><Link className="button button--primary" to="/applications">Open applications <ArrowRight /></Link></div>}
      </section>
      <aside className="upcoming-aside">
        <article className="focus-card"><span><CalendarDays /></span><p className="eyebrow">This week</p><strong>{futureEvents.filter((event) => new Date(event.date).getTime() < Date.now() + 7 * 86400000).length}</strong><h3>moments to prepare for</h3><p>Block focused prep time before every conversation.</p></article>
        <article className="panel prep-card"><h3>Before an interview</h3><ul><li><span>1</span>Re-read the role and your notes</li><li><span>2</span>Prepare two impact stories</li><li><span>3</span>Write thoughtful questions</li><li><span>4</span>Check the meeting link early</li></ul></article>
      </aside>
    </div>
  );
}
