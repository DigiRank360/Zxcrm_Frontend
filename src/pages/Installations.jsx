import { useState } from 'react'
import { Plus, Sun } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { fmtDate, generateQuarterlySchedule } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

const empty = { customer: '', phone: '', address: '', installDate: '' }

export default function Installations() {
  const { installations, addInstallation } = useCrm()
  const [form, setForm] = useState(empty)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    addInstallation(form)
    setForm(empty)
  }

  const columns = [
    { key: 'customer', label: 'Customer', render: (r) => <Person name={r.customer} sub={r.phone} /> },
    { key: 'address', label: 'Address' },
    { key: 'installDate', label: 'Installed', render: (r) => fmtDate(r.installDate) },
    { key: 'next', label: 'Quarterly cycle', render: (r) => <div className="flex flex-wrap gap-1">{generateQuarterlySchedule(r.installDate).map((d) => <span key={d} className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{fmtDate(d)}</span>)}</div> },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Solar" title="Installations" subtitle="Adding an installation auto-creates quarterly service tickets" />
      <form onSubmit={submit} className="card mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900"><Sun size={18} className="text-sun-500" /> New installation</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold text-slate-500">Customer<input required className="input mt-1" placeholder="Customer name" value={form.customer} onChange={set('customer')} /></label>
          <label className="text-xs font-semibold text-slate-500">Phone<input required pattern="[0-9]{10}" className="input mt-1" placeholder="10 digits" value={form.phone} onChange={set('phone')} /></label>
          <label className="text-xs font-semibold text-slate-500">Address<input required className="input mt-1" placeholder="Address" value={form.address} onChange={set('address')} /></label>
          <label className="text-xs font-semibold text-slate-500">Install date<input required type="date" className="input mt-1" value={form.installDate} onChange={set('installDate')} /></label>
          <button className="btn-primary self-end"><Plus size={16} /> Add installation</button>
        </div>
      </form>
      <DataTable columns={columns} rows={installations} />
    </>
  )
}
