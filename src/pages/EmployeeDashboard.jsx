import { Users, PhoneCall, CalendarClock, Clock } from 'lucide-react'
import WorkTimerCard from '../components/WorkTimerCard'
import useNow from '../utils/useNow'
import { Link } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { useCrm } from '../utils/CrmContext'
import { fmtDateTime, workedSeconds } from '../utils/helpers'
import { Person } from '../components/Avatar'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { leads, attendance } = useCrm()
  const now = useNow()
  const mine = leads.filter((l) => l.agentId === user.id)
  const open = mine.filter((l) => l.status !== 'Converted')
  const followUps = open.filter((l) => l.followUp).sort((a, b) => a.followUp.localeCompare(b.followUp))
  const today = attendance.find((a) => a.employee === user.name)

  return (
    <>
      <PageHeader eyebrow="Employee" title={`Welcome, ${user.name}`} subtitle="Your day at a glance" />
      <WorkTimerCard employee={user.name} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Leads" value={mine.length} icon={Users} />
        <StatCard label="Pending Calls" value={open.filter((l) => l.status === 'New' || l.status === 'Not Picked' || l.status === 'Busy').length} icon={PhoneCall} tone="amber" />
        <StatCard label="Converted" value={mine.filter((l) => l.status === 'Converted').length} icon={PhoneCall} tone="green" />
        <StatCard label="Hours today" value={(workedSeconds(today, now) / 3600).toFixed(1)} icon={Clock} tone="green" />
      </div>
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-slate-900"><CalendarClock size={18} /> Upcoming Follow-ups</h2>
          <Link to="/my-calls" className="text-sm font-semibold text-brand-600">Open call queue →</Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {followUps.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <Person name={l.name} sub={`${l.phone} · ${l.source}`} />
              <span className="flex items-center gap-3 text-slate-500">{fmtDateTime(l.followUp)} <Badge>{l.status}</Badge></span>
            </li>
          ))}
          {!followUps.length && <li className="py-4 text-center text-slate-400">No follow-ups scheduled</li>}
        </ul>
      </div>
    </>
  )
}
