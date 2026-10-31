import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, CalendarClock, CalendarDays, CheckCircle2, ClipboardList,
  Clock, FileText, MapPin, PhoneCall, UserCircle, Users,
} from 'lucide-react'
import WorkTimerCard from '../components/WorkTimerCard'
import useNow from '../utils/useNow'
import { useAuth } from '../utils/AuthContext'
import { useCrm } from '../utils/CrmContext'
import { fmtDateTime, istDate, workedSeconds } from '../utils/helpers'
import { Person } from '../components/Avatar'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

const closedStatuses = ['Converted', 'Not Interested']
const callableStatuses = ['New', 'Not Picked', 'Busy']

const quickLinks = [
  { to: '/my-calls', label: 'My Call Queue', hint: 'Call and log outcomes', icon: PhoneCall },
  { to: '/installations', label: 'Solar Applications', hint: 'Track application stages', icon: FileText },
  { to: '/visits', label: 'Visits', hint: 'Log site and sales visits', icon: MapPin },
  { to: '/attendance', label: 'Attendance', hint: 'Records and holidays', icon: CalendarDays },
  { to: '/my-profile', label: 'My Profile', hint: 'Details and documents', icon: UserCircle },
]

function greeting(now) {
  const hour = Number(now.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const { leads, attendance, applications, holidays, refreshLeads } = useCrm()
  const [refreshError, setRefreshError] = useState('')
  const now = useNow()
  const todayDate = istDate()

  useEffect(() => {
    const refresh = async () => {
      try {
        await refreshLeads()
        setRefreshError('')
      } catch (error) {
        setRefreshError(error.message)
      }
    }
    const timer = window.setInterval(refresh, 20000)
    return () => window.clearInterval(timer)
  }, [refreshLeads])

  const { mine, open, overdue, dueToday, upcoming } = useMemo(() => {
    const own = leads.filter((l) => l.agentId === user.id)
    const active = own.filter((l) => !closedStatuses.includes(l.status))
    const scheduled = active.filter((l) => l.followUp).sort((a, b) => a.followUp.localeCompare(b.followUp))
    const day = (l) => l.followUp.slice(0, 10)
    return {
      mine: own,
      open: active,
      overdue: scheduled.filter((l) => l.status !== 'Interested' && day(l) < todayDate),
      dueToday: scheduled.filter((l) => day(l) === todayDate),
      upcoming: scheduled.filter((l) => day(l) > todayDate),
    }
  }, [leads, user.id, todayDate])

  const todaySessions = attendance.filter((a) => a.date === todayDate && (a.userId ? a.userId === user.id : a.employee === user.name))
  const todayHoliday = holidays.find((h) => h.date === todayDate)
  const nextHoliday = holidays.find((h) => h.date > todayDate)
  const myApplications = applications.filter((a) => a.assignedEmployeeId === user.id)
  const activeApplications = myApplications.filter((a) => a.steps.some((s) => !s.completedAt))
  const pendingCalls = open.filter((l) => callableStatuses.includes(l.status)).length
  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })

  const followUpGroups = [
    { key: 'overdue', title: 'Overdue', rows: overdue, tone: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertTriangle },
    { key: 'today', title: 'Due today', rows: dueToday, tone: 'text-amber-700 bg-amber-50 border-amber-200', icon: CalendarClock },
    { key: 'upcoming', title: 'Upcoming', rows: upcoming.slice(0, 6), tone: 'text-slate-700 bg-slate-50 border-slate-200', icon: CalendarDays },
  ]

  return (
    <>
      <PageHeader eyebrow="Employee" title={`${greeting(now)}, ${user.name}`} subtitle={dateLabel}>
        <Link to="/my-calls" className="btn-primary"><PhoneCall size={16} /> Open call queue</Link>
      </PageHeader>

      {refreshError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">Could not refresh assigned leads: {refreshError}</p>}

      {(todayHoliday || overdue.length > 0) && (
        <div className="mb-5 space-y-2">
          {todayHoliday && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              Today is a company holiday: {todayHoliday.name}.
            </p>
          )}
          {overdue.length > 0 && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              You have {overdue.length} overdue follow-up{overdue.length === 1 ? '' : 's'}. <Link to="/my-calls" className="underline">Review them now</Link>
            </p>
          )}
        </div>
      )}

      <WorkTimerCard employee={user.name} userId={user.id} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned leads" value={mine.length} icon={Users} />
        <StatCard label="Pending calls" value={pendingCalls} icon={PhoneCall} tone="amber" />
        <StatCard label="Converted" value={mine.filter((l) => l.status === 'Converted').length} icon={CheckCircle2} tone="green" />
        <StatCard label="Hours today" value={(todaySessions.reduce((total, session) => total + workedSeconds(session, now), 0) / 3600).toFixed(1)} icon={Clock} tone="green" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900"><CalendarClock size={18} /> Follow-ups</h2>
            <Link to="/my-calls" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Call queue <ArrowRight size={14} /></Link>
          </div>
          {followUpGroups.every((group) => !group.rows.length) && (
            <p className="py-6 text-center text-sm text-slate-400">No follow-ups scheduled. You are all caught up.</p>
          )}
          <div className="space-y-4">
            {followUpGroups.filter((group) => group.rows.length).map(({ key, title, rows, tone, icon: Icon }) => (
              <div key={key}>
                <p className={`mb-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone}`}>
                  <Icon size={13} /> {title} · {rows.length}
                </p>
                <ul className="divide-y divide-slate-100">
                  {rows.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                      <Person name={l.name} sub={`${l.phone} · ${l.source || 'Lead'}`} />
                      <span className="flex items-center gap-3 text-slate-500">{fmtDateTime(l.followUp)} <Badge>{l.status}</Badge></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="card">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-slate-900"><ClipboardList size={18} /> Solar applications</h2>
            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3"><dd className="text-2xl font-extrabold text-slate-900">{activeApplications.length}</dd><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">In progress</dt></div>
              <div className="rounded-xl bg-slate-50 p-3"><dd className="text-2xl font-extrabold text-slate-900">{myApplications.length - activeApplications.length}</dd><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Completed</dt></div>
            </dl>
            <Link to="/installations" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">View applications <ArrowRight size={14} /></Link>
          </section>
          <section className="card">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-slate-900"><CalendarDays size={18} /> Attendance</h2>
            <p className="text-sm text-slate-600">Today: <b>{todayHoliday ? 'Holiday' : todaySessions[0]?.status || 'Not checked in'}</b></p>
            <p className="mt-1 text-sm text-slate-600">Next holiday: <b>{nextHoliday ? `${nextHoliday.name} (${nextHoliday.date})` : 'None scheduled'}</b></p>
            <Link to="/attendance" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Records & calendar <ArrowRight size={14} /></Link>
          </section>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-bold text-slate-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {quickLinks.map(({ to, label, hint, icon: Icon }) => (
            <Link key={to} to={to} className="card card-hover flex items-center gap-3 !p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-900">{label}</span>
                <span className="block truncate text-xs text-slate-500">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
