import { BriefcaseBusiness, CalendarClock, DollarSign, Link2, LoaderCircle, MapPin, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toDateTimeLocal, toIsoOrUndefined } from "../lib/format";
import { applicationStatuses, type Application, type ApplicationInput } from "../types";

type FormState = {
  company: string;
  role: string;
  location: string;
  status: ApplicationInput["status"];
  sourceUrl: string;
  salaryMin: string;
  salaryMax: string;
  appliedDate: string;
  nextActionDate: string;
  notes: string;
};

const initialState = (application?: Application): FormState => ({
  company: application?.company ?? "",
  role: application?.role ?? "",
  location: application?.location ?? "",
  status: application?.status ?? "Applied",
  sourceUrl: application?.sourceUrl ?? "",
  salaryMin: application?.salaryMin?.toString() ?? "",
  salaryMax: application?.salaryMax?.toString() ?? "",
  appliedDate: toDateTimeLocal(application?.appliedDate ?? new Date().toISOString()).slice(0, 10),
  nextActionDate: toDateTimeLocal(application?.nextActionDate),
  notes: application?.notes ?? "",
});

export function ApplicationForm({ application, onSave, onCancel }: { application?: Application; onSave: (input: ApplicationInput) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(() => initialState(application));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.company.trim()) nextErrors.company = "Company is required";
    if (!form.role.trim()) nextErrors.role = "Role is required";
    if (!form.location.trim()) nextErrors.location = "Location is required";
    if (form.salaryMin && form.salaryMax && Number(form.salaryMax) < Number(form.salaryMin)) nextErrors.salaryMax = "Maximum must be above minimum";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      await onSave({
        company: form.company.trim(),
        role: form.role.trim(),
        location: form.location.trim(),
        status: form.status,
        sourceUrl: form.sourceUrl.trim() || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        appliedDate: toIsoOrUndefined(form.appliedDate),
        nextActionDate: toIsoOrUndefined(form.nextActionDate),
        notes: form.notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="application-form" onSubmit={submit} noValidate>
      <div className="form-section">
        <div className="form-section__heading"><span><BriefcaseBusiness /></span><div><h3>Opportunity</h3><p>The essentials for this role.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Company *</span><input value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="e.g. Stripe" autoFocus aria-invalid={Boolean(errors.company)} />{errors.company ? <small className="field-error">{errors.company}</small> : null}</label>
          <label className="field"><span>Role *</span><input value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="e.g. Frontend Engineer" aria-invalid={Boolean(errors.role)} />{errors.role ? <small className="field-error">{errors.role}</small> : null}</label>
          <label className="field"><span>Status</span><select value={form.status} onChange={(event) => update("status", event.target.value)}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="field"><span><MapPin />Location *</span><input value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="Remote or city" aria-invalid={Boolean(errors.location)} />{errors.location ? <small className="field-error">{errors.location}</small> : null}</label>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section__heading"><span><CalendarClock /></span><div><h3>Timing & compensation</h3><p>Keep the next move visible.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Applied date</span><input type="date" value={form.appliedDate} onInput={(event) => update("appliedDate", event.currentTarget.value)} /></label>
          <label className="field"><span>Next action</span><input type="datetime-local" value={form.nextActionDate} onInput={(event) => update("nextActionDate", event.currentTarget.value)} /></label>
          <label className="field"><span><DollarSign />Minimum salary</span><input type="number" min="0" value={form.salaryMin} onChange={(event) => update("salaryMin", event.target.value)} placeholder="120000" /></label>
          <label className="field"><span><DollarSign />Maximum salary</span><input type="number" min="0" value={form.salaryMax} onChange={(event) => update("salaryMax", event.target.value)} placeholder="150000" aria-invalid={Boolean(errors.salaryMax)} />{errors.salaryMax ? <small className="field-error">{errors.salaryMax}</small> : null}</label>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section__heading"><span><Link2 /></span><div><h3>Context</h3><p>Links and notes you will need later.</p></div></div>
        <div className="form-grid form-grid--single">
          <label className="field"><span>Job post URL</span><input type="url" value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} placeholder="https://company.com/jobs/..." /></label>
          <label className="field"><span>Notes</span><textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Recruiter context, interview prep, follow-up notes..." /></label>
        </div>
      </div>
      <div className="form-actions"><button type="button" className="button button--ghost" onClick={onCancel}>Cancel</button><button className="button button--primary" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />}{saving ? "Saving..." : application ? "Save changes" : "Add application"}</button></div>
    </form>
  );
}
