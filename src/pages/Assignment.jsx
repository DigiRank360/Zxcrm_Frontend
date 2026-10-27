import { Shuffle } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useState } from 'react'
import { useCrm } from '../utils/CrmContext'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Assignment() {
  const { leads, agents, autoAssignLeads, assignLead } = useCrm()
  const [error, setError] = useState('')
  const reassign = async (id, agentId) => {
    setError('')
    try { await assignLead(id, agentId) } catch (requestError) { setError(requestError.message) }
  }

  const load = (id) => leads.filter((l) => l.agentId === id && l.status !== 'Converted').length

  const columns = [
    { key: 'name', label: 'Lead', render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'assignmentReason', label: 'Routing reason', render: (r) => <span className="text-xs text-slate-500">{r.assignmentReason || 'Not routed yet'}</span> },
    {
      key: 'agent', label: 'Assigned to',
      render: (r) => (
        <select className="input !w-44 !py-1.5 sm:!w-52" value={r.agentId || ''} onChange={(e) => reassign(r.id, e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      ),
    },
  ]

  return (
    <>
      <PageHeader eyebrow="Admin" title="Smart Lead Assignment" subtitle="Deterministic routing by captured geography, property type, score, employee availability, and capacity.">
        <button className="btn-primary" onClick={autoAssignLeads} disabled={!agents.length}><Shuffle size={16} /> Route open leads</button>
      </PageHeader>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {agents.map((a) => {
          const open = load(a.id)
          const share = a.maxOpenLeads ? open / a.maxOpenLeads : leads.length ? open / leads.length : 0
          return (
            <div key={a.id} className="card card-hover min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1"><Person name={a.name} /></div>
                <Badge>{a.active === false ? 'Inactive' : 'Active'}</Badge>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight text-brand-700">{open} <span className="text-sm font-medium text-slate-400">/ {a.maxOpenLeads ?? '∞'} open</span></p>
              <p className="mt-1 text-xs text-slate-400">{[...(a.serviceAreas || []), ...(a.propertyTypes || []).map((type) => `Property: ${type}`)].join(' · ') || 'No geography/property restrictions'}{a.minLeadScore !== undefined || a.maxLeadScore !== undefined ? ` · Score ${a.minLeadScore ?? 0}–${a.maxLeadScore ?? 100}` : ''}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sun-400" style={{ width: `${Math.min(100, share * 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <DataTable columns={columns} rows={leads} />
    </>
  )
}
