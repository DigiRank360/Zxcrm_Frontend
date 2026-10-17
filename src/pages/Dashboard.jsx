import { Users, UserCheck, PhoneCall, Wrench, CheckCircle2, AlertTriangle, MapPin, CalendarDays } from 'lucide-react'
import { useCrm } from '../utils/CrmContext'
import { daysUntil, fmtDate } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

export default function Dashboard() {
  const { leads, attendance, maintenance, installations, workers } = useCrm()
  const present = attendance.filter((a) => a.status !== 'Absent').length
  const pending = maintenance.filter((m) => m.status === 'Pending')
  const done = maintenance.filter((m) => m.status === 'Completed')
  const upcoming = pending.filter((m) => daysUntil(m.dueDate) <= 3)

  return (
    <>
      <PageHeader eyebrow="Admin" title="Dashboard" subtitle="Overview of leads, attendance and solar maintenance" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Leads" value={leads.length} icon={Users} />
        <StatCard label="Converted" value={leads.filter((l) => l.status === 'Converted').length} icon={PhoneCall} tone="green" />
        <StatCard label="Staff Present Today" value={`${present}/${attendance.length}`} icon={UserCheck} tone="green" />
        <StatCard label="Pending Services" value={pending.length} icon={Wrench} tone="amber" />
        <StatCard label="Completed Services" value={done.length} icon={CheckCircle2} tone="green" />
        <StatCard label="Due within 3 days" value={upcoming.length} icon={AlertTriangle} tone="rose" />
      </div>
      <div className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Live Service Status
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{maintenance.length} visits</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {maintenance.map((m) => {
            const inst = installations.find((i) => i.id === m.installationId)
            const w = workers.find((x) => x.id === m.workerId)
            return (
              <li key={m.id} className="grid grid-cols-1 items-center gap-3 px-6 py-3.5 transition hover:bg-brand-50/40 sm:grid-cols-[1.6fr_1fr_auto_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-500/25">
                    {inst?.customer?.[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{inst?.customer}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={12} /> {inst?.address}</p>
                  </div>
                </div>
                <p className="flex items-center gap-2 text-sm text-slate-600"><Wrench size={14} className="text-slate-400" /> {w?.name}</p>
                <p className="flex items-center gap-2 text-sm tabular-nums text-slate-500"><CalendarDays size={14} className="text-slate-400" /> {fmtDate(m.dueDate)}</p>
                <div className="sm:w-28 sm:text-right"><Badge>{m.status}</Badge></div>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
