import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckSquare,
  Circle,
  Download,
  FileText,
  FileCheck,
  Plus,
  Sun,
  Truck,
  Upload,
} from "lucide-react";
import { Person } from "../components/Avatar";
import { useAuth } from "../utils/AuthContext";
import { useCrm } from "../utils/CrmContext";
import { apiRequest } from "../utils/api";
import { documentToDataUrl } from "../utils/uploads";
import { fmtDate, fmtDateTime, generateQuarterlySchedule } from "../utils/helpers";
import { stateCities, states } from "../data/locations";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";

const emptyApplication = {
  customer: "",
  phone: "",
  applicationNumber: "",
  discom: "",
  discomCode: "",
  circle: "",
  division: "",
  subDivision: "",
  approvedCapacity: "",
  subsidyAmount: "",
  existingCapacity: "",
  installedCapacity: "",
  state: "",
  city: "",
  village: "",
  pinCode: "",
};

const backendWorkflowStages = [
  { title: "Registration", owner: "Consumer", icon: Check },
  { title: "Application", owner: "Consumer", icon: FileText },
  { title: "Feasibility", owner: "Discom", icon: Building2 },
  { title: "Vendor Selection", owner: "Consumer", icon: CheckSquare },
  { title: "Upload Agreement", owner: "Vendor", icon: FileText },
  { title: "Pre-site Inspection", owner: "Vendor", icon: FileText },
  { title: "Material Dispatch", owner: "Vendor", icon: Truck },
  { title: "Installation", owner: "Vendor", icon: CheckSquare },
  { title: "Post-site Inspection", owner: "Discom", icon: FileText },
  { title: "Project Commissioning", owner: "Discom", icon: Sun },
  { title: "Subsidy Request", owner: "Consumer", icon: FileText },
  { title: "Subsidy Disbursal", owner: "REC", icon: Check },
];

const installationWorkflowStages = [
  { title: "Application", owner: "Employee", icon: FileText, stepIndices: [0, 1, 2, 3, 4] },
  { title: "Pre-site Inspection", owner: "Employee", icon: FileText, stepIndices: [5] },
  { title: "Material Dispatch", owner: "Employee", icon: Truck, stepIndices: [6] },
  { title: "Installation", owner: "Employee", icon: CheckSquare, stepIndices: [7] },
  { title: "Post-site Inspection", owner: "Discom", icon: FileText, stepIndices: [8] },
  { title: "Commissioning", owner: "Discom", icon: Sun, stepIndices: [9] },
  { title: "Subsidy", owner: "Consumer / REC", icon: Check, stepIndices: [10, 11] },
];

const approvalStages = [2, 8];

const applicationSections = [
  {
    title: "Consumer details",
    fields: [
      { key: "customer", label: "Consumer name", placeholder: "e.g. Mukesh Bharti", required: true },
      { key: "phone", label: "Phone number", placeholder: "10 digit mobile number", required: true, pattern: "[0-9]{10}", inputMode: "numeric" },
      { key: "applicationNumber", label: "Application number", placeholder: "e.g. NP-MPMK26-15878022", required: true },
    ],
  },
  {
    title: "Discom details",
    fields: [
      { key: "discom", label: "Discom", placeholder: "Enter discom name", required: true },
      { key: "discomCode", label: "Discom code", placeholder: "e.g. 2444026003" },
      { key: "circle", label: "Circle", placeholder: "e.g. City Circle Bhopal" },
      { key: "division", label: "Division", placeholder: "e.g. City DN East" },
      { key: "subDivision", label: "Sub division", placeholder: "e.g. Bhanpur" },
    ],
  },
  {
    title: "Capacity & subsidy",
    fields: [
      { key: "approvedCapacity", label: "Approved capacity (kWp)", placeholder: "e.g. 5.000", type: "number", required: true },
      { key: "subsidyAmount", label: "Subsidy amount (Rs)", placeholder: "e.g. 78000", type: "number" },
      { key: "existingCapacity", label: "Existing installed capacity (kWp)", placeholder: "e.g. 0.000", type: "number" },
      { key: "installedCapacity", label: "Installed PV capacity (kWp)", placeholder: "e.g. 5.000", type: "number" },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "state", label: "State", placeholder: "Select state", type: "state", required: true },
      { key: "city", label: "City", placeholder: "Select city", type: "city", required: true },
      { key: "village", label: "Village / Locality", placeholder: "e.g. Bhanpur" },
      { key: "pinCode", label: "Pin code", placeholder: "6 digit pin code", pattern: "[0-9]{6}", inputMode: "numeric" },
    ],
  },
];

const detailFields = [
  ["Discom", "discom"],
  ["Discom code", "discomCode"],
  ["Circle", "circle"],
  ["Division", "division"],
  ["Sub division", "subDivision"],
  ["Approved capacity (kWp)", "approvedCapacity"],
  ["Application number", "applicationNumber"],
  ["Subsidy amount (Rs)", "subsidyAmount"],
  ["Existing installed capacity (kWp)", "existingCapacity"],
  ["Installed PV capacity (kWp)", "installedCapacity"],
  ["State", "state"],
  ["City", "city"],
  ["Village", "village"],
  ["Pin code", "pinCode"],
];

function getCurrentStage(steps) {
  return steps.findIndex((step) => !step.completedAt);
}

function getInstallationStage(steps) {
  const index = getCurrentStage(steps);
  if (index < 0) return -1;
  return installationWorkflowStages.findIndex((stage) => stage.stepIndices.includes(index));
}

function WorkflowTimeline({ application }) {
  const currentStage = getInstallationStage(application.steps);

  return (
    <ol className="flex flex-col lg:flex-row lg:items-start">
      {installationWorkflowStages.map((stage, index) => {
        const completed = stage.stepIndices.every((stepIndex) => application.steps[stepIndex]?.completedAt);
        const active = index === currentStage;
        const Icon = completed ? Check : stage.icon;
        const last = index === installationWorkflowStages.length - 1;
        const state = completed ? "Completed" : active ? "In Progress" : "Pending";
        const lastCompletedStep = [...stage.stepIndices].reverse().find((stepIndex) => application.steps[stepIndex]?.completedAt);
        const step = application.steps[lastCompletedStep ?? stage.stepIndices[0]];

        return (
          <li key={stage.title} className="flex gap-3 lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-0">
            <span className="hidden text-xs font-medium text-slate-400 lg:mb-2 lg:block">{stage.owner}</span>
            <div className="flex flex-col items-center lg:flex-row">
              <span
                aria-label={`${stage.title}: ${state}`}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
                  completed
                    ? "bg-emerald-600"
                    : active
                      ? "bg-brand-600 ring-4 ring-brand-100"
                      : "bg-slate-400"
                }`}
              >
                <Icon size={18} />
              </span>
              {!last && (
                <span
                  className={`my-1 min-h-6 w-0.5 flex-1 lg:mx-2 lg:my-0 lg:h-0.5 lg:min-h-0 lg:w-auto ${
                    completed ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col pb-5 lg:pb-0 lg:pr-2">
              <span className="text-xs font-medium text-slate-400 lg:hidden">{stage.owner}</span>
              <span className="text-sm font-semibold leading-5 text-slate-700 lg:mt-2">{stage.title}</span>
              <span
                className={`mt-2 w-fit rounded-full border px-2.5 py-1 text-xs ${
                  completed
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : active
                      ? "border-brand-200 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {state}
              </span>
              <span className="mt-2 text-xs text-slate-500">
                {step.completedAt
                  ? fmtDateTime(step.completedAt)
                  : step.startedAt
                    ? `Started ${fmtDateTime(step.startedAt)}`
                    : "—"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ValuationDocuments({ installation, isAdmin, token }) {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => apiRequest(`/api/installations/${installation.id}/valuation-documents`, { token })
    .then(setDocuments)
    .catch((requestError) => setError(requestError.message)), [installation.id, token]);

  useEffect(() => { load(); }, [load]);

  const upload = async () => {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const document = await documentToDataUrl(file);
      await apiRequest(`/api/installations/${installation.id}/valuation-documents`, {
        method: "POST",
        token,
        body: JSON.stringify({ document, fileName: file.name }),
      });
      setFile(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const review = async (document, status) => {
    const note = window.prompt(`Note for ${status}`, status === "Rejected" ? "Please upload a corrected document." : "");
    if (note === null) return;
    setError("");
    try {
      await apiRequest(`/api/installations/${installation.id}/valuation-documents/${document.id}/review`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status, note }),
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const download = async (document) => {
    try {
      const result = await apiRequest(`/api/installations/${installation.id}/valuation-documents/${document.id}/download`, { token });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="card mt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title flex items-center gap-2"><FileCheck size={17} className="text-brand-600" /> Valuation documents</h2>
          <p className="mt-1 text-xs text-slate-500">Employee uploads; admin verifies and approves each document.</p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] || null)} className="max-w-[210px] text-xs" />
            <button type="button" className="btn-primary" disabled={!file || saving} onClick={upload}><Upload size={15} /> {saving ? "Uploading…" : "Upload"}</button>
          </div>
        )}
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      <div className="space-y-2">
        {documents.map((document) => (
          <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{document.fileName}</p>
              <p className="text-xs text-slate-500">{document.status} · {fmtDateTime(document.uploadedAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => download(document)}><Download size={14} /> View</button>
              {isAdmin && document.status === "Submitted" && <button type="button" className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => review(document, "Verified")}><FileCheck size={14} /> Verify</button>}
              {isAdmin && document.status === "Verified" && <button type="button" className="btn-primary !px-2.5 !py-1.5 text-xs" onClick={() => review(document, "Approved")}><Check size={14} /> Approve</button>}
              {isAdmin && document.status !== "Approved" && <button type="button" className="btn-outline !border-rose-200 !px-2.5 !py-1.5 text-xs !text-rose-700" onClick={() => review(document, "Rejected")}>Reject</button>}
            </div>
          </div>
        ))}
        {!documents.length && <p className="py-3 text-sm text-slate-500">No valuation document uploaded yet.</p>}
      </div>
    </div>
  );
}

function ApplicationDetails({ application, onCompleteStep, onApproval, approvalNote, setApprovalNote, users, isAdmin }) {
  const currentStage = getCurrentStage(application.steps);
  const complete = currentStage === -1;

  return (
    <section className="card mt-5 !p-4 sm:!p-5" aria-label={`Workflow details for ${application.applicationNumber}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Application details</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{application.customer}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {application.applicationNumber} <span className="px-1">·</span> {application.phone}
          </p>
        </div>
        <Badge>{complete ? "Completed" : "In Progress"}</Badge>
      </div>

      <WorkflowTimeline application={application} />

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="section-title">Application information</h3>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {detailFields.map(([label, key]) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 text-sm">
              <dt className="font-semibold text-brand-700">{label}</dt>
              <dd className="break-words text-slate-800">{application[key] || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {!complete && (
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Current step: <span className="font-semibold text-slate-800">{installationWorkflowStages[getInstallationStage(application.steps)].title}</span>
              <span className="px-1">·</span>{installationWorkflowStages[getInstallationStage(application.steps)].owner}
            </p>
            {isAdmin && approvalStages.includes(currentStage) && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-amber-700">Approval: {application.steps[currentStage].approvalStatus || 'Pending'}</p>
                <input maxLength={1000} className="input mt-1 !w-full sm:!w-72" placeholder="Approval note or rejection reason" value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} />
              </div>
            )}
            {!isAdmin && approvalStages.includes(currentStage) && (
              <p className="mt-2 text-xs font-semibold text-amber-700">Waiting for administrator approval: {application.steps[currentStage].approvalStatus || 'Pending'}</p>
            )}
            {isAdmin && !approvalStages.includes(currentStage) && (
              <p className="mt-2 text-xs text-slate-500">Employee-owned stage. Review progress here; only the assigned employee can complete this step.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin && approvalStages.includes(currentStage) && application.steps[currentStage].approvalStatus !== 'Approved' && (
              <>
                <button className="btn-outline" onClick={() => onApproval(application.id, 'Rejected', approvalNote)}>Reject stage</button>
                <button className="btn-outline" onClick={() => onApproval(application.id, 'Approved', approvalNote)}>Approve stage</button>
              </>
            )}
            {!isAdmin && <button className="btn-primary" disabled={approvalStages.includes(currentStage) && application.steps[currentStage].approvalStatus !== 'Approved'} onClick={() => onCompleteStep(application.id)}>
              Complete step <ArrowRight size={16} />
            </button>}
          </div>
        </div>
      )}
      {application.approvalHistory?.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="section-title">Approval history</h3>
          <ul className="space-y-2 text-sm">
            {application.approvalHistory.map((event, index) => (
              <li key={`${event.occurredAt}-${index}`} className="flex flex-wrap gap-x-2 text-slate-600">
                <span className="font-semibold">{backendWorkflowStages[event.stage]?.title}: {event.decision}</span>
                <span>{event.note}</span>
                <span>by {users.find((user) => user.id === event.userId)?.name || 'Administrator'}</span>
                <span className="text-slate-400">{fmtDateTime(event.occurredAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {complete && (
        <p className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-sm font-semibold text-emerald-700">
          <Check size={16} /> All workflow steps are complete.
        </p>
      )}
    </section>
  );
}

export default function Installations() {
  const { user, token } = useAuth();
  const isAdmin = user.role === "admin";
  const { installations, applications, addApplication, completeApplicationStep, decideApplicationApproval, users } = useCrm();
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [selectedId, setSelectedId] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const setApplication = (k) => (e) => {
    const value = e.target.value;
    setApplicationForm((current) => ({
      ...current,
      [k]: value,
      ...(k === "state" ? { city: "" } : {}),
    }));
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const now = new Date().toISOString();
    const application = {
      ...applicationForm,
      createdAt: now,
      steps: backendWorkflowStages.map((_, index) => ({
        startedAt: index === 0 ? now : "",
        completedAt: "",
      })),
    };
    try {
      const created = await addApplication(application);
      setSelectedId(created.id);
      setApplicationForm(emptyApplication);
      setShowApplicationForm(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const completeStep = async (id) => {
    setError("");
    try {
      await completeApplicationStep(id);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const decideApproval = async (id, decision, note) => {
    setError("");
    try {
      await decideApplicationApproval(id, decision, note);
      setApprovalNote('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const selectedApplication = applications.find((application) => application.id === selectedId);

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (r) => <Person name={r.customer} sub={r.phone} />,
    },
    { key: "address", label: "Address" },
    {
      key: "installDate",
      label: "Installed",
      render: (r) => fmtDate(r.installDate),
    },
    {
      key: "next",
      label: "Quarterly cycle",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {generateQuarterlySchedule(r.installDate).map((d) => (
            <span
              key={d}
              className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
            >
              {fmtDate(d)}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge>{r.status}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Solar"
        title={isAdmin ? "Solar application approvals" : "My solar installations"}
        subtitle={isAdmin ? "Review every employee application and approve or reject the approval stages." : "Create applications, update each workflow step, and track your sites through subsidy disbursal."}
      >
        {!isAdmin && <button
          className="btn-primary"
          onClick={() => setShowApplicationForm((visible) => !visible)}
          aria-expanded={showApplicationForm}
        >
          <Plus size={16} /> New application
        </button>}
      </PageHeader>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section className="mb-8">
        {!isAdmin && showApplicationForm && (
          <form onSubmit={submitApplication} className="card mb-5">
            <div className="mb-5 flex items-center gap-2">
              <Sun size={18} className="text-sun-500" />
              <h2 className="text-base font-bold text-slate-900">New solar application</h2>
            </div>
            <div className="space-y-6">
              {applicationSections.map((section, index) => (
                <fieldset key={section.title} className="min-w-0">
                  <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-700">
                      {index + 1}
                    </span>
                    {section.title}
                  </legend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {section.fields.map((field) => {
                      const { key, label, required, type, placeholder } = field;
                      const isSelect = type === "state" || type === "city";
                      const cities = stateCities[applicationForm.state] || [];
                      const options = type === "state" ? states : cities;
                      return (
                        <label key={key} className="min-w-0 text-xs font-semibold text-slate-500">
                          {label}{required && <span className="text-rose-500"> *</span>}
                          {isSelect ? (
                            <select
                              required={required}
                              disabled={type === "city" && !applicationForm.state}
                              className="input mt-1 disabled:cursor-not-allowed disabled:bg-slate-50"
                              value={applicationForm[key]}
                              onChange={setApplication(key)}
                            >
                              <option value="">
                                {type === "city" && !applicationForm.state
                                  ? "Select state first"
                                  : placeholder}
                              </option>
                              {options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              required={required}
                              type={type || "text"}
                              min={type === "number" ? 0 : undefined}
                              step={type === "number" ? "any" : undefined}
                              pattern={field.pattern}
                              inputMode={field.inputMode}
                              className="input mt-1"
                              placeholder={placeholder}
                              value={applicationForm[key]}
                              onChange={setApplication(key)}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setShowApplicationForm(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create application"}
              </button>
            </div>
          </form>
        )}

        <div className="card overflow-hidden !p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Solar application workflow</h2>
              <p className="mt-1 text-xs text-slate-500">
                Application progress is saved to the CRM API.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500">{applications.length} applications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  {(isAdmin ? ["Application", "Discom", "Consumer", "Employee", "Approved capacity", "Current step", "Status"] : ["Application", "Discom", "Consumer", "Approved capacity", "Current step", "Status"]).map((label) => (
                    <th key={label} className="th">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => {
                  const currentStage = getCurrentStage(application.steps);
                  const done = currentStage === -1;
                  return (
                    <tr
                      key={application.id}
                      className={`cursor-pointer transition hover:bg-brand-50/60 ${
                        selectedId === application.id ? "bg-brand-50/60" : "odd:bg-slate-50/40"
                      }`}
                      onClick={() => setSelectedId(application.id)}
                    >
                      <td className="td font-medium text-slate-900">{application.applicationNumber}</td>
                      <td className="td">{application.discom}</td>
                      <td className="td">{application.customer}</td>
                      {isAdmin && <td className="td">{application.assignedEmployeeName || users.find((item) => item.id === application.assignedEmployeeId)?.name || "—"}</td>}
                      <td className="td">{application.approvedCapacity} kWp</td>
                      <td className="td">{done ? "Completed" : installationWorkflowStages[getInstallationStage(application.steps)].title}</td>
                      <td className="td"><Badge>{done ? "Completed" : approvalStages.includes(currentStage) ? `Needs ${application.steps[currentStage].approvalStatus === "Approved" ? "employee update" : "approval"}` : "In Progress"}</Badge></td>
                    </tr>
                  );
                })}
                {!applications.length && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-5 py-10 text-center text-sm text-slate-400">
                      <Circle size={20} className="mx-auto mb-2" />
                      {isAdmin ? "No employee applications are waiting for review." : "No applications yet. Create a solar application to start the workflow."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedApplication && (
          <ApplicationDetails application={selectedApplication} onCompleteStep={completeStep} onApproval={decideApproval} approvalNote={approvalNote} setApprovalNote={setApprovalNote} users={users} isAdmin={isAdmin} />
        )}
      </section>

      <PageHeader
        eyebrow="Service"
        title={isAdmin ? "Commissioned installations" : "My commissioned installations"}
        subtitle="Installations and quarterly maintenance are created automatically only after successful commissioning."
      />
      <DataTable columns={columns} rows={installations} />
      {installations.map((installation) => (
        <ValuationDocuments key={installation.id} installation={installation} isAdmin={isAdmin} token={token} />
      ))}
    </>
  );
}
