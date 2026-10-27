import { UserCheck, Timer } from 'lucide-react'
import WorkTimerCard from '../components/WorkTimerCard'
import useNow from '../utils/useNow'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { fmtDuration, istDate, workedSeconds } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import { Clock } from 'lucide-react'

export default function Attendance() {
  const { attendance } = useCrm()
  const { user } = useAuth()
  const isAdmin = ['admin', 'hr'].includes(user.role)
  const now = useNow()
  const rows = isAdmin ? attendance : attendance.filter((row) => row.userId ? row.userId === user.id : row.employee === user.name)
  const todayRows = rows.filter((row) => row.date === istDate())
  const total = todayRows.reduce((s, a) => s + workedSeconds(a, now) / 3600, 0)

  const columns = [
    { key: 'employee', label: 'Employee', render: (r) => <Person name={r.employee} /> },
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check-in', render: (r) => <span className="font-medium tabular-nums">{r.checkIn || '—'}</span> },
    { key: 'checkOut', label: 'Check-out', render: (r) => <span className="font-medium tabular-nums">{r.checkOut || '—'}</span> },
    { key: 'hours', label: 'Hours', render: (r) => <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">{fmtDuration(workedSeconds(r, now))}</span> },
    { key: 'photo', label: 'Check-in photo', render: (r) => r.photoUrl ? <a href={r.photoUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">View photo</a> : '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeader eyebrow={user.role === 'hr' ? 'Human resources' : 'Employee'} title="Attendance" subtitle={isAdmin ? 'All employees' : `Signed in as ${user.name}`} />
      {!isAdmin && <WorkTimerCard employee={user.name} userId={user.id} />}
      {!isAdmin && <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Attendance is not yet restricted to a 10 m location radius. Configure the office or site coordinates before enabling location verification.</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total hours today" value={total.toFixed(1)} icon={Clock} />
        <StatCard label="Present / On-field" value={todayRows.filter((r) => ['Present', 'On-field'].includes(r.status)).length} icon={UserCheck} tone="green" />
        <StatCard label="Avg hours" value={(todayRows.length ? total / todayRows.length : 0).toFixed(1)} icon={Timer} tone="amber" />
      </div>
      <DataTable columns={columns} rows={rows} />
    </>
  )
}
