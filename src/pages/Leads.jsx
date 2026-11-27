import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Pencil,
  Upload,
  Search,
  RefreshCw,
  X,
  ArrowRightLeft,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import { Person } from "../components/Avatar";
import { useCrm } from "../utils/CrmContext";
import { LEAD_SOURCES, LEAD_STATUSES } from "../data/crmOptions";
import { downloadCsv, fmtDate, parseCsv } from "../utils/helpers";
import SourceIcon from "../components/SourceIcon";
import LeadLocationTransfer from "../components/LeadLocationTransfer";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { useAuth } from "../utils/AuthContext";
import { stateCities, states } from "../data/locations";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

export default function Leads() {
  const { leads, agents, importLeads, refreshLeads, updateLead, assignLead, createManualLead, softDeleteLead } =
    useCrm();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [f, setF] = useState({
    q: "",
    source: params.get("source") || "",
    status: "",
    agent: "",
    date: "",
    archived: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    state: "",
    city: "",
    propertyType: "",
    agentId: "",
    notes: "",
  });
  const refreshInFlight = useRef(false);
  const fileRef = useRef();
  const editFormRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (editing)
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [editing]);

  useEffect(() => {
    const refresh = async () => {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      try {
        await refreshLeads();
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        refreshInFlight.current = false;
        setRefreshing(false);
      }
    };
    const timer = window.setInterval(refresh, 20000);
    return () => window.clearInterval(timer);
  }, [refreshLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    setError("");
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    refreshLeads()
      .then(() => setError(""))
      .catch((requestError) => setError(requestError.message))
      .finally(() => {
        refreshInFlight.current = false;
        setRefreshing(false);
      });
  };

  const rows = leads.filter(
    (l) =>
      (!f.q ||
        `${l.name} ${l.phone}`.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.source || l.source === f.source) &&
      (!f.status || l.status === f.status) &&
      (!f.agent || String(l.agentId) === f.agent) &&
      (!f.date || l.date === f.date) &&
      (!f.archived || (f.archived === "archived" ? Boolean(l.deletedAt) : !l.deletedAt)),
  );

  const deleteLead = async (lead) => {
    if (!window.confirm(`Permanently delete ${lead.name}? This action cannot be undone.`)) return;
    setDeletingId(lead.id);
    setError("");
    setSaved("");
    try {
      await softDeleteLead(lead.id);
      setSaved(`${lead.name} permanently deleted.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId("");
    }
  };

  const addLead = async (event) => {
    event.preventDefault();
    setAddingLead(true);
    setError("");
    setSaved("");
    try {
      const lead = await createManualLead({
        ...newLead,
        agentId: newLead.agentId || null,
      });
      setSaved(`${lead.name} added to the lead pool.`);
      setNewLead({
        name: "",
        phone: "",
        email: "",
        state: "",
        city: "",
        propertyType: "",
        agentId: "",
        notes: "",
      });
      setShowAddLead(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAddingLead(false);
    }
  };

  const onCsv = async (e) => {
    const input = e.target;
    const file = input.files[0];
    if (file) {
      try {
        const imported = parseCsv(await file.text());
        await importLeads(imported);
        setError("");
      } catch (requestError) {
        setError(requestError.message);
      }
    }
    input.value = "";
  };

  const downloadLeads = () => {
    downloadCsv(
      `leads-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "state", label: "State" },
        { key: "city", label: "City" },
        { key: "propertyType", label: "Property Type" },
        { key: "source", label: "Source" },
        { key: "status", label: "Status" },
        { key: "score", label: "Score" },
        { key: "followUp", label: "Follow-up" },
        { key: "notes", label: "Notes" },
        {
          key: "agent",
          label: "Assigned Agent",
          value: (lead) =>
            agents.find((agent) => agent.id === lead.agentId)?.name || "Unassigned",
        },
      ],
      rows,
    );
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateLead(editing.id, {
        name: editing.name,
        phone: editing.phone,
        email: editing.email || "",
        state: editing.state || "",
        city: editing.city || "",
        score: editing.score,
        status: editing.status,
        notes: editing.notes || "",
        followUp: editing.followUp || "",
      });
      setEditing(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const transferLead = async () => {
    if (
      !editing.agentId ||
      editing.agentId === leads.find((lead) => lead.id === editing.id)?.agentId
    )
      return;
    setTransferring(true);
    setError("");
    try {
      await assignLead(editing.id, editing.agentId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTransferring(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <button type="button" onClick={() => setSelectedLead(r)} className="rounded-lg text-left hover:bg-brand-50">
          <Person name={r.name} sub={r.phone} />
        </button>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          <SourceIcon source={r.source} size={12} />
          {r.source}
        </span>
      ),
    },
    { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedLead(r)}
          className="inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          title={`View ${r.name} status details`}
        >
          <Badge>{r.status}</Badge>
        </button>
      ),
    },
    {
      key: "agent",
      label: "Agent",
      render: (r) =>
        agents.find((a) => a.id === r.agentId)?.name || (
          <span className="text-slate-400">Unassigned</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline !px-2.5 !py-1.5 text-xs"
            onClick={() => {
              setError("");
              setEditing({ ...r, followUp: toDateTimeLocal(r.followUp) });
            }}
          >
            <Pencil size={14} /> Edit
          </button>
          {user?.role === "admin" && (
            <button
              type="button"
              className="btn-outline !border-rose-200 !px-2.5 !py-1.5 text-xs !text-rose-700 hover:!bg-rose-50"
              disabled={deletingId === r.id}
              onClick={() => deleteLead(r)}
            >
              <Trash2 size={14} /> {deletingId === r.id ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Lead Management"
        title="Central Lead Pool"
        subtitle="Facebook, Meta Ads, WhatsApp, Website and CSV leads in one place"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          hidden
          onChange={onCsv}
        />
        <button
          className="btn-outline"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{" "}
          Refresh leads
        </button>
        <button className="btn-outline" onClick={downloadLeads} disabled={!rows.length}>
          <Download size={16} /> Download CSV
        </button>
        <button className="btn-primary" onClick={() => fileRef.current.click()}>
          <Upload size={16} /> Upload CSV
        </button>
        {user?.role === "admin" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddLead((open) => !open)}
          >
            {showAddLead ? <X size={16} /> : <Plus size={16} />}
            {showAddLead ? "Cancel" : "Add Lead"}
          </button>
        )}
      </PageHeader>
      {showAddLead && user?.role === "admin" && (
        <form onSubmit={addLead} className="card mb-4">
          <h2 className="section-title mb-4">Add a new lead</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">Name *
              <input required maxLength={150} className="input mt-1" value={newLead.name} onChange={(event) => setNewLead((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Phone *
              <input required type="tel" maxLength={40} className="input mt-1" value={newLead.phone} onChange={(event) => setNewLead((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Email
              <input type="email" maxLength={200} className="input mt-1" value={newLead.email} onChange={(event) => setNewLead((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">State
              <select className="input mt-1" value={newLead.state} onChange={(event) => setNewLead((current) => ({ ...current, state: event.target.value, city: "" }))}>
                <option value="">Select state</option>
                {states.map((state) => <option key={state}>{state}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">City
              <select className="input mt-1" value={newLead.city} disabled={!newLead.state} onChange={(event) => setNewLead((current) => ({ ...current, city: event.target.value }))}>
                <option value="">Select city</option>
                {(stateCities[newLead.state] || []).map((city) => <option key={city}>{city}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Assign to employee
              <select className="input mt-1" value={newLead.agentId} onChange={(event) => setNewLead((current) => ({ ...current, agentId: event.target.value }))}>
                <option value="">Leave unassigned</option>
                {agents.filter((agent) => agent.active !== false).map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Property type
              <input maxLength={200} className="input mt-1" value={newLead.propertyType} onChange={(event) => setNewLead((current) => ({ ...current, propertyType: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Notes
              <textarea rows={2} maxLength={500} className="input mt-1 resize-y" value={newLead.notes} onChange={(event) => setNewLead((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <button type="submit" className="btn-primary mt-4" disabled={addingLead}>
            {addingLead ? "Adding…" : "Add Lead"}
          </button>
        </form>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...LEAD_SOURCES].map((s) => (
          <button
            key={s}
            onClick={() => setF({ ...f, source: s })}
            className={`${f.source === s ? "btn-primary" : "btn-outline"} !rounded-full !px-4 !py-1.5 !text-xs`}
          >
            {s && <SourceIcon source={s} size={12} />}
            {s || "All"} (
            {s ? leads.filter((l) => l.source === s).length : leads.length})
          </button>
        ))}
      </div>
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="input !pl-10"
            placeholder="Search name / phone"
            value={f.q}
            onChange={set("q")}
          />
        </div>
        <select className="input" value={f.source} onChange={set("source")}>
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" value={f.status} onChange={set("status")}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" value={f.agent} onChange={set("agent")}>
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="date"
          value={f.date}
          onChange={set("date")}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{saved}</p>}
      {editing && (
        <div ref={editFormRef} className="card mb-4 scroll-mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Edit lead</h2>
            <button
              type="button"
              aria-label="Close edit form"
              onClick={() => setEditing(null)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={17} />
            </button>
          </div>
          <form
            onSubmit={saveEdit}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {["name", "phone", "email", "state", "city", "full Address"].map(
              (field) => (
                <label
                  key={field}
                  className="text-xs font-semibold capitalize text-slate-600"
                >
                  {field}
                  <input
                    className="input mt-1"
                    type={field === "score" ? "number" : "text"}
                    min={field === "score" ? 0 : undefined}
                    max={field === "score" ? 100 : undefined}
                    value={editing[field] ?? ""}
                    onChange={(event) =>
                      setEditing({ ...editing, [field]: event.target.value })
                    }
                  />
                </label>
              ),
            )}
            <label className="text-xs font-semibold text-slate-600">
              Follow-up date and time
              <input
                className="input mt-1"
                type="datetime-local"
                value={editing.followUp ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, followUp: event.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
              Notes
              <textarea
                className="input mt-1 min-h-24 resize-y"
                rows={3}
                maxLength={500}
                value={editing.notes ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, notes: event.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Transfer to
              <select
                className="input mt-1"
                value={editing.agentId || ""}
                onChange={(event) =>
                  setEditing({ ...editing, agentId: event.target.value })
                }
              >
                <option value="">Select an employee</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Status
              <select
                className="input mt-1"
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value })
                }
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                className="btn-outline"
                onClick={transferLead}
                disabled={
                  saving ||
                  transferring ||
                  !editing.agentId ||
                  editing.agentId ===
                    leads.find((lead) => lead.id === editing.id)?.agentId
                }
              >
                <ArrowRightLeft size={16} />
                {transferring ? "Transferring…" : "Transfer lead"}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving || transferring}
              >
                {saving ? "Saving…" : "Save lead"}
              </button>
            </div>{" "}
          </form>
          <div className="mt-4">
            <LeadLocationTransfer
              key={`${editing.id}-${(leads.find((l) => l.id === editing.id)?.transfers || []).length}`}
              lead={leads.find((l) => l.id === editing.id) || editing}
              onTransferred={(updated) => setEditing((current) => ({ ...current, state: updated.state, city: updated.city }))}
            />
          </div>
        </div>
      )}
      <DataTable columns={columns} rows={rows} />
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lead status details" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedLead(null)
        }}>
          <div className="w-full max-w-lg rounded-2xl border border-white/70 bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Lead status</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selectedLead.name}</h2>
              </div>
              <button type="button" aria-label="Close status details" onClick={() => setSelectedLead(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p><div className="mt-2"><Badge>{selectedLead.status}</Badge></div></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Assigned agent</p><p className="mt-2 text-sm font-semibold text-slate-800">{agents.find((agent) => agent.id === selectedLead.agentId)?.name || 'Unassigned'}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone</p><p className="mt-2 text-sm font-semibold text-slate-800">{selectedLead.phone || '—'}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Follow-up</p><p className="mt-2 text-sm font-semibold text-slate-800">{selectedLead.followUp ? fmtDate(selectedLead.followUp) : 'Not scheduled'}</p></div>
            </div>
            {selectedLead.notes && <div className="mt-3 rounded-xl border border-slate-100 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Notes</p><p className="mt-1 text-sm text-slate-700">{selectedLead.notes}</p></div>}
            {selectedLead.assignmentReason && <div className="mt-3 rounded-xl border border-slate-100 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Routing reason</p><p className="mt-1 text-sm text-slate-700">{selectedLead.assignmentReason}</p></div>}
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">
        CSV columns: name, phone, email, state, city, propertyType, score. Leads
        are routed against employee availability and capacity.
      </p>
    </>
  );
}
