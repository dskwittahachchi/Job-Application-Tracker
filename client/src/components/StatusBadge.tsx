import type { ApplicationStatus } from "../types";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`status status--${status.toLowerCase()}`}><span />{status}</span>;
}
