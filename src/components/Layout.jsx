import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Clock, Users, Shuffle, PhoneCall, Sun, Wrench, ShieldCheck, Inbox, LogOut, CalendarDays } from 'lucide-react'
import { useAuth, ROLES } from '../utils/AuthContext'

const linksByRole = {
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/sources', label: 'Lead Sources', icon: Inbox },
    { to: '/leads', label: 'Lead Pool', icon: Users },
    { to: '/assignment', label: 'Lead Assignment', icon: Shuffle },
    { to: '/installations', label: 'Solar Installations', icon: Sun },
    { to: '/maintenance', label: 'Maintenance (AMC)', icon: Wrench },
  ],
  employee: [
    { to: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/my-calls', label: 'My Call Queue', icon: PhoneCall },
    { to: '/attendance', label: 'Attendance', icon: Clock },
  ],
  technician: [
    { to: '/', label: 'My Service Jobs', icon: ShieldCheck },
    { to: '/attendance', label: 'Attendance', icon: Clock },
  ],
}

const TZ = 'Asia/Kolkata'
const fmt = (d, o) => d.toLocaleString('en-IN', { timeZone: TZ, ...o })
const greeting = (d) => {
  const h = Number(fmt(d, { hour: 'numeric', hour12: false }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

export default function Layout() {
  const { user, logout } = useAuth()
  const links = linksByRole[user.role]
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-[#0f1d4d] via-brand-900 to-[#0b1538] p-4 shadow-2xl text-white md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sun-400 to-orange-500 shadow-lg shadow-orange-900/30">
            <Sun size={22} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold">ZX Solar</p>
            <p className="text-[11px] font-medium uppercase tracking-widest text-blue-200">CRM Suite</p>
          </div>
        </div>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-blue-300/70">Menu</p>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-gradient-to-r from-sun-400/90 to-orange-400/90 text-brand-900 shadow-lg shadow-orange-900/30' : 'text-blue-100/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-400 text-sm font-bold text-brand-900">{initials(user.name)}</div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-blue-200">{ROLES[user.role]}</p>
          </div>
          <button onClick={logout} title="Logout" className="rounded-lg p-2 text-blue-100 transition hover:bg-white/15"><LogOut size={16} /></button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-slate-900">{greeting(now)}, {user.name.split(' ')[0]}</p>
            <p className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex"><CalendarDays size={12} /> {fmt(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Clock size={14} className="text-brand-600" />
              <span className="text-sm font-bold tabular-nums text-slate-800">{fmt(now, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              <span className="hidden rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 sm:inline">IST</span>
            </div>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{initials(user.name)}</span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{ROLES[user.role]}</p>
              </div>
            </div>
            <button onClick={logout} title="Logout" className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 md:hidden"><LogOut size={16} /></button>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto bg-brand-900 p-2 text-xs text-white md:hidden">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-1.5 ${isActive ? 'bg-white text-brand-800' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
