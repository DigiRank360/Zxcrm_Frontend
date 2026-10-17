import { UserCheck, Timer } from 'lucide-react'
import WorkTimerCard from '../components/WorkTimerCard'
import useNow from '../utils/useNow'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { fmtDuration, workedSeconds } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import { Clock } from 'lucide-react'

export default function Attendance() {
  const { attendance } = useCrm()
  const { user } = useAuth()
  const isAdmin = user.role === 'admin'
  const now = useNow()
  const rows = isAdmin ? attendance : attendance.filter((a) => a.employee === user.name)
  const total = rows.reduce((s, a) => s + workedSeconds(a, now) / 3600, 0)

  const columns = [
    { key: 'employee', label: 'Employee', render: (r) => <Person name={r.employee} /> },
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check-in', render: (r) => <span className="font-medium tabular-nums">{r.checkIn || '—'}</span> },
    { key: 'checkOut', label: 'Check-out', render: (r) => <span className="font-medium tabular-nums">{r.checkOut || '—'}</span> },
    { key: 'hours', label: 'Hours', render: (r) => <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">{fmtDuration(workedSeconds(r, now))}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow="Employee" title="Attendance" subtitle={isAdmin ? 'All employees' : `Signed in as ${user.name}`} />
      {!isAdmin && <WorkTimerCard employee={user.name} />}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total hours today" value={total.toFixed(1)} icon={Clock} />
        <StatCard label="Present / On-field" value={rows.filter((r) => ['Present', 'On-field'].includes(r.status)).length} icon={UserCheck} tone="green" />
        <StatCard label="Avg hours" value={(rows.length ? total / rows.length : 0).toFixed(1)} icon={Timer} tone="amber" />
      </div>
      <DataTable columns={columns} rows={rows} />
    </>
  )
}
