import { useState } from 'react'
import { Wrench, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react'
import StatCard from '../components/StatCard'
import { Person } from '../components/Avatar'
import { useAuth } from '../utils/AuthContext'
import { useCrm } from '../utils/CrmContext'
import { daysUntil, fmtDate } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Maintenance() {
  const { user } = useAuth()
  const canManage = user.role === 'employee'
  const { maintenance, assignTicket, addTicket, installations, workers, customers } = useCrm()
  const [form, setForm] = useState({ customerId: '', installationId: '', title: '', description: '', priority: 'Normal', dueDate: new Date().toISOString().slice(0, 10), workerId: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const rows = [...maintenance].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const assign = async (id, workerId) => {
    try { await assignTicket(id, workerId) } catch (requestError) { setError(requestError.message) }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addTicket({ ...form, installationId: form.installationId || null, workerId: form.workerId || null })
      setForm((current) => ({ ...current, title: '', description: '', priority: 'Normal', workerId: '' }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'customer', label: 'Customer / issue', render: (r) => {
      const customer = customers.find((x) => x.id === r.customerId)
      const installation = installations.find((x) => x.id === r.installationId)
      return <div>
        <Person name={customer?.name || installation?.customer || '?'} sub={r.title || r.description || installation?.address} />
        {installation?.applicationNumber && <p className="mt-1 text-[11px] text-slate-500">Application {installation.applicationNumber}{installation.approvedCapacity ? ` · ${installation.approvedCapacity} kWp` : ''}</p>}
      </div>
    } },
    { key: 'priority', label: 'Priority', render: (r) => <Badge>{r.priority || 'Normal'}</Badge> },
    { key: 'dueDate', label: 'Due date', render: (r) => fmtDate(r.dueDate) },
    {
      key: 'worker', label: 'Technician',
      render: (r) => !canManage ? (workers.find((w) => w.id === r.workerId)?.name || 'Unassigned') : (
        <select className="input !w-44 !py-1" value={r.workerId || ''} disabled={r.status === 'Completed'} onChange={(e) => assign(r.id, e.target.value)}>
          <option value="">Unassigned</option>
          {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Service operations" title="Maintenance & service tickets" subtitle={canManage ? "Create and assign tickets for installed customers; technicians close work with customer OTP." : "Read-only overview of service tickets handled by employees."} />
      {!canManage && <p className="mb-5 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">Read-only view. Maintenance tickets are created and assigned by employees.</p>}
      {canManage && <form onSubmit={submit} className="card mb-5">
        <h2 className="section-title flex items-center gap-2"><Plus size={18} /> Create service ticket</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-1">Installation (customer)
            <select required className="input mt-1" value={form.installationId} onChange={(event) => { const item = installations.find((x) => x.id === event.target.value); setForm({ ...form, installationId: event.target.value, customerId: item?.customerId || '' }) }}>
              <option value="">Select an installed customer</option>{installations.filter((item) => item.customerId).map((item) => <option key={item.id} value={item.id}>{item.customer} · {item.address || item.installDate}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Title
            <input required maxLength={120} className="input mt-1" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Description
            <input maxLength={2000} className="input mt-1" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Priority
            <select className="input mt-1" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{['Low', 'Normal', 'High', 'Urgent'].map((priority) => <option key={priority}>{priority}</option>)}</select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Due date
            <input required type="date" className="input mt-1" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Assign technician
            <select className="input mt-1" value={form.workerId} onChange={(event) => setForm({ ...form, workerId: event.target.value })}><option value="">Unassigned</option>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}</select>
          </label>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={saving || !installations.length} className="btn-primary mt-4"><Plus size={16} /> {saving ? 'Creating…' : 'Create ticket'}</button>
      </form>}
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
