import { BriefcaseBusiness, CircleAlert, RefreshCw } from "lucide-react";

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div className="skeleton-list" aria-label="Loading content">{Array.from({ length: rows }, (_, index) => <div className="skeleton-row" key={index}><span /><span /><span /></div>)}</div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-state__icon"><BriefcaseBusiness /></span><h3>{title}</h3><p>{message}</p>{action}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state"><CircleAlert /><div><strong>We hit a snag</strong><p>{message}</p></div>{onRetry ? <button className="button button--secondary" onClick={onRetry}><RefreshCw />Try again</button> : null}</div>;
}
