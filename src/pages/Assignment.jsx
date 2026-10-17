import { Shuffle } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { roundRobinAssign } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Assignment() {
  const { leads, setLeads, agents } = useCrm()
  const load = (id) => leads.filter((l) => l.agentId === id && l.status !== 'Converted').length

  const reassign = (id, agentId) =>
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, agentId: agentId ? Number(agentId) : null } : l)))

  // leads sitting on inactive agents are released, then round-robin among active agents
  const autoAssign = () =>
    setLeads((p) => roundRobinAssign(
      p.map((l) => (agents.find((a) => a.id === l.agentId)?.active === false ? { ...l, agentId: null } : l)),
      agents,
    ))

  const columns = [
    { key: 'name', label: 'Lead', render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    {
      key: 'agent', label: 'Assigned to',
      render: (r) => (
        <select className="input !w-48 !py-1" value={r.agentId || ''} onChange={(e) => reassign(r.id, e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}{a.active ? '' : ' (inactive)'}</option>)}
        </select>
      ),
    },
  ]

  return (
    <>
      <PageHeader eyebrow="Admin" title="Smart Lead Assignment" subtitle="Round-robin distribution with manual override">
        <button className="btn-primary" onClick={autoAssign}><Shuffle size={16} /> Auto-assign (Round-robin)</button>
      </PageHeader>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((a) => (
          <div key={a.id} className="card card-hover">
            <div className="flex items-center justify-between">
              <Person name={a.name} />
              <Badge>{a.active ? 'Active' : 'Inactive'}</Badge>
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
