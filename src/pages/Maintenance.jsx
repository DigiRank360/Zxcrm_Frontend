import { Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { daysUntil, fmtDate } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Maintenance() {
  const { maintenance, setMaintenance, installations, workers } = useCrm()
  const rows = [...maintenance].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const assign = (id, workerId) =>
    setMaintenance((p) => p.map((m) => (m.id === id ? { ...m, workerId: workerId || null } : m)))

  const columns = [
    { key: 'customer', label: 'Customer', render: (r) => { const i = installations.find((x) => x.id === r.installationId); return <Person name={i?.customer || '?'} sub={i?.address} /> } },
    { key: 'dueDate', label: 'Due date', render: (r) => fmtDate(r.dueDate) },
    {
      key: 'sms', label: 'SMS alert',
      render: (r) => r.status === 'Completed' ? '—' : daysUntil(r.dueDate) <= 3 ? <span className="text-xs font-semibold text-emerald-600">Sent to technician</span> : <span className="text-xs text-slate-400">Scheduled (3 days before)</span>,
    },
    {
      key: 'worker', label: 'Technician',
      render: (r) => (
        <select className="input !w-44 !py-1" value={r.workerId} onChange={(e) => assign(r.id, e.target.value)}>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Solar AMC" title="Maintenance Schedule" subtitle="Quarterly services with technician SMS alerts" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total services" value={rows.length} icon={Wrench} />
        <StatCard label="Pending" value={rows.filter((r) => r.status === 'Pending').length} icon={Clock} tone="amber" />
        <StatCard label="Completed" value={rows.filter((r) => r.status === 'Completed').length} icon={CheckCircle2} tone="green" />
        <StatCard label="Due in 3 days" value={rows.filter((r) => r.status !== 'Completed' && daysUntil(r.dueDate) <= 3).length} icon={AlertTriangle} tone="rose" />
      </div>
      <DataTable columns={columns} rows={rows} />
    </>
  )
}
