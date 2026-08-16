import { ChevronLeft, ChevronRight, Filter, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApplicationDetail } from "../components/ApplicationDetail";
import { ApplicationForm } from "../components/ApplicationForm";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Modal } from "../components/Modal";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";
import { formatDate, formatRelativeDate } from "../lib/format";
import { applicationStatuses, type Application, type ApplicationInput, type ApplicationStatus, type Pagination } from "../types";

export function ApplicationsPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 8, total: 0, pages: 1 });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "8", sort });
    if (deferredSearch) params.set("search", deferredSearch);
    if (status) params.set("status", status);
    try {
      const result = await api.applications(params);
      setApplications(result.data.applications);
      setPagination(result.data.pagination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load applications");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, sort, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [deferredSearch, status, sort]);
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    const local = applications.find((application) => application.id === openId);
    if (local) setSelected(local);
    else api.application(openId).then((result) => setSelected(result.data)).catch(() => setSearchParams({}, { replace: true }));
  }, [applications, searchParams, setSearchParams]);

  const clearModalParam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    next.delete("new");
    setSearchParams(next, { replace: true });
  };
  const save = async (input: ApplicationInput) => {
    try {
      if (editing) {
        const result = await api.updateApplication(editing.id, input);
        showToast("Application updated");
        setSelected((current) => current?.id === result.data.id ? result.data : current);
      } else {
        await api.createApplication(input);
        showToast("Application added to your pipeline");
      }
      setFormOpen(false);
      setEditing(null);
      clearModalParam();
      await load();
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Could not save application", "error");
      throw caught;
    }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteApplication(deleteTarget.id);
      showToast("Application deleted");
      setDeleteTarget(null);
      setSelected(null);
      clearModalParam();
      await load();
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "Could not delete application", "error");
    } finally { setDeleting(false); }
  };
  const openDetail = (application: Application) => {
    setSelected(application);
    const next = new URLSearchParams(searchParams);
    next.set("open", application.id);
    setSearchParams(next, { replace: true });
  };
  const edit = (application: Application) => {
    setSelected(null);
    setEditing(application);
    setFormOpen(true);
  };
  const resetFilters = () => { setSearch(""); setStatus(""); setSort("newest"); };

  return (
    <div className="applications-stack">
      <section className="pipeline-strip">
        <div><p className="eyebrow">Pipeline health</p><strong>{pagination.total} opportunities</strong><span>Every application deserves a clear next move.</span></div>
        <div className="pipeline-strip__steps">{applicationStatuses.slice(0, 4).map((item, index) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(status === item ? "" : item)}><span>{index + 1}</span>{item}</button>)}</div>
      </section>
      <section className="panel application-panel">
        <div className="application-toolbar">
          <div className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company or role..." aria-label="Search applications" />{search ? <button aria-label="Clear search" onClick={() => setSearch("")}><X /></button> : null}</div>
          <div className="filter-control"><Filter /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{applicationStatuses.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="filter-control"><SlidersHorizontal /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort applications"><option value="newest">Recently updated</option><option value="oldest">Oldest first</option><option value="company">Company A-Z</option><option value="nextAction">Next action</option></select></div>
          <button className="button button--primary toolbar-add" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />New</button>
        </div>
        {error ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingState rows={6} /> : applications.length === 0 ? <EmptyState title="No applications found" message={deferredSearch || status ? "Try clearing the filters to see your full pipeline." : "Add your first opportunity and give your search a place to grow."} action={<button className="button button--primary" onClick={deferredSearch || status ? resetFilters : () => setFormOpen(true)}>{deferredSearch || status ? "Clear filters" : <><Plus />Add application</>}</button>} /> : <div className="applications-table-wrap"><table className="applications-table"><thead><tr><th>Opportunity</th><th>Status</th><th>Applied</th><th>Next action</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{applications.map((application) => <tr key={application.id} onClick={() => openDetail(application)}><td><div className="opportunity-cell"><span className="company-logo">{application.company.slice(0, 2).toUpperCase()}</span><span><strong>{application.role}</strong><small>{application.company} · {application.location}</small></span></div></td><td><StatusBadge status={application.status} /></td><td>{formatDate(application.appliedDate)}</td><td><span className={application.nextActionDate ? "next-action" : "muted-copy"}>{formatDate(application.nextActionDate)}</span></td><td>{formatRelativeDate(application.updatedAt)}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${application.role}`} onClick={(event) => { event.stopPropagation(); edit(application); }}><Pencil /></button><button className="icon-button icon-button--danger" aria-label={`Delete ${application.role}`} onClick={(event) => { event.stopPropagation(); setDeleteTarget(application); }}><Trash2 /></button><MoreHorizontal /></div></td></tr>)}</tbody></table></div>}
        {!loading && applications.length ? <footer className="pagination"><p>Showing <strong>{(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of {pagination.total}</p><div><button className="icon-button icon-button--bordered" disabled={page <= 1} aria-label="Previous page" onClick={() => setPage((value) => value - 1)}><ChevronLeft /></button><span>Page {pagination.page} of {pagination.pages}</span><button className="icon-button icon-button--bordered" disabled={page >= pagination.pages} aria-label="Next page" onClick={() => setPage((value) => value + 1)}><ChevronRight /></button></div></footer> : null}
      </section>
      {formOpen ? <Modal title={editing ? "Edit application" : "Add an application"} eyebrow={editing ? editing.company : "New opportunity"} onClose={() => { setFormOpen(false); setEditing(null); clearModalParam(); }} size="large"><ApplicationForm application={editing ?? undefined} onSave={save} onCancel={() => { setFormOpen(false); setEditing(null); clearModalParam(); }} /></Modal> : null}
      {selected ? <Modal title="Application details" eyebrow={`${selected.company} · ${selected.location}`} onClose={() => { setSelected(null); clearModalParam(); }} size="large"><ApplicationDetail application={selected} onEdit={() => edit(selected)} onDelete={() => setDeleteTarget(selected)} onUpdate={(updated) => { setSelected(updated); setApplications((current) => current.map((item) => item.id === updated.id ? updated : item)); }} /></Modal> : null}
      {deleteTarget ? <Modal title="Delete application?" eyebrow="This cannot be undone" onClose={() => setDeleteTarget(null)}><div className="confirm-dialog"><span className="confirm-dialog__icon"><Trash2 /></span><p>This will permanently remove <strong>{deleteTarget.role} at {deleteTarget.company}</strong>, including its interview notes.</p><div className="form-actions"><button className="button button--ghost" onClick={() => setDeleteTarget(null)}>Keep it</button><button className="button button--danger" disabled={deleting} onClick={remove}><Trash2 />{deleting ? "Deleting..." : "Delete application"}</button></div></div></Modal> : null}
    </div>
  );
}
