import { Shuffle } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Assignment() {
  const { leads, setLeads, agents, autoAssignLeads } = useCrm()
  const reassign = (id, agentId) =>
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, agentId: agentId || null } : l)))

  const load = (id) => leads.filter((l) => l.agentId === id && l.status !== 'Converted').length

  const columns = [
    { key: 'name', label: 'Lead', render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    {
      key: 'agent', label: 'Assigned to',
      render: (r) => (
        <select className="input !w-48 !py-1" value={r.agentId || ''} onChange={(e) => reassign(r.id, e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      ),
    },
  ]

  return (
    <>
      <PageHeader eyebrow="Admin" title="Smart Lead Assignment" subtitle="Round-robin distribution with manual override">
        <button className="btn-primary" onClick={autoAssignLeads} disabled={!agents.length}><Shuffle size={16} /> Auto-assign (Round-robin)</button>
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => (
          <div key={a.id} className="card card-hover">
            <div className="flex items-center justify-between">
              <Person name={a.name} />
              <Badge>Active</Badge>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-brand-700">{load(a.id)} <span className="text-sm font-medium text-slate-400">open leads</span></p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sun-400" style={{ width: `${Math.min(100, (load(a.id) / Math.max(1, leads.length)) * 100 * 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <DataTable columns={columns} rows={leads} />
    </>
  )
}
