import { ArrowRight, BriefcaseBusiness, CalendarClock, CircleCheckBig, Clock3, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/Feedback";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { formatDate, formatRelativeDate } from "../lib/format";
import { applicationStatuses, type DashboardStats } from "../types";

const statusColor: Record<string, string> = { Saved: "#8b91a7", Applied: "#6c5ce7", Interview: "#f59e57", Offer: "#31a875", Rejected: "#e1626a", Withdrawn: "#b28663" };

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try { setStats((await api.dashboard()).data); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load dashboard"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <LoadingState rows={5} />;

  const cards = [
    { label: "Total applications", value: stats.total, detail: "Across your full search", icon: BriefcaseBusiness, tone: "violet" },
    { label: "Active pipeline", value: stats.active, detail: "Applied or interviewing", icon: TrendingUp, tone: "blue" },
    { label: "Interviews", value: stats.interviews, detail: "Conversations in motion", icon: UsersRound, tone: "orange" },
    { label: "Offers", value: stats.offers, detail: `${stats.conversionRate}% progression rate`, icon: CircleCheckBig, tone: "green" },
  ];
  const maxMonthly = Math.max(1, ...stats.monthly.map((item) => item.count));
  const statusTotal = Math.max(1, Object.values(stats.byStatus).reduce((sum, value) => sum + value, 0));
  return (
    <div className="dashboard-stack">
      <section className="metric-grid">{cards.map(({ label, value, detail, icon: Icon, tone }) => <article className="metric-card" key={label}><span className={`metric-card__icon metric-card__icon--${tone}`}><Icon /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>)}</section>
      <section className="dashboard-grid dashboard-grid--wide">
        <article className="panel activity-panel"><div className="panel__header"><div><p className="eyebrow">Momentum</p><h2>Application activity</h2><p>Your last six months at a glance.</p></div><span className="trend-chip"><TrendingUp />Steady progress</span></div><div className="bar-chart" role="img" aria-label="Applications per month">{stats.monthly.map((item) => <div className="bar-chart__item" key={item.label}><div className="bar-chart__track"><span style={{ height: `${Math.max(7, (item.count / maxMonthly) * 100)}%` }}><b>{item.count}</b></span></div><small>{item.label}</small></div>)}</div></article>
        <article className="panel"><div className="panel__header"><div><p className="eyebrow">Pipeline</p><h2>Status breakdown</h2><p>Where every opportunity stands.</p></div><Link className="text-link" to="/applications">View all <ArrowRight /></Link></div><div className="status-distribution"><div className="status-ring" style={{ background: `conic-gradient(${applicationStatuses.map((status, index) => { const previous = applicationStatuses.slice(0, index).reduce((sum, item) => sum + stats.byStatus[item], 0); const start = (previous / statusTotal) * 100; const end = ((previous + stats.byStatus[status]) / statusTotal) * 100; return `${statusColor[status]} ${start}% ${end}%`; }).join(",")})` }}><span><strong>{stats.total}</strong><small>Total</small></span></div><div className="status-legend">{applicationStatuses.map((status) => <Link to={`/applications?status=${status}`} key={status}><span style={{ background: statusColor[status] }} /><small>{status}</small><strong>{stats.byStatus[status]}</strong></Link>)}</div></div></article>
      </section>
      <section className="dashboard-grid dashboard-grid--lower">
        <article className="panel recent-panel"><div className="panel__header"><div><p className="eyebrow">Recently updated</p><h2>Your applications</h2></div><Link className="text-link" to="/applications">Manage pipeline <ArrowRight /></Link></div><div className="mini-table">{stats.recent.map((application) => <Link className="mini-table__row" to={`/applications?open=${application.id}`} key={application.id}><span className="company-logo">{application.company.slice(0, 2).toUpperCase()}</span><span><strong>{application.role}</strong><small>{application.company} · {application.location}</small></span><StatusBadge status={application.status} /><span className="mini-table__date">{formatRelativeDate(application.updatedAt)}</span><ArrowRight className="row-arrow" /></Link>)}</div></article>
        <article className="panel upcoming-panel"><div className="panel__header"><div><p className="eyebrow">Next up</p><h2>Upcoming actions</h2></div><span className="round-icon"><CalendarClock /></span></div>{stats.upcoming.length ? <div className="upcoming-list">{stats.upcoming.map((application) => <Link to={`/applications?open=${application.id}`} key={application.id}><span className="date-tile"><strong>{formatDate(application.nextActionDate, "dd")}</strong><small>{formatDate(application.nextActionDate, "MMM")}</small></span><span><strong>{application.company}</strong><small>{application.role}</small></span><Clock3 /></Link>)}</div> : <div className="quiet-state"><Sparkles /><strong>Your calendar is clear</strong><p>Add a next action to any application to see it here.</p></div>}<Link className="button button--secondary button--full" to="/upcoming">Open full timeline <ArrowRight /></Link></article>
      </section>
    </div>
  );
}
