import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Clock, Users, Shuffle, PhoneCall, Sun, Moon, Wrench, ShieldCheck, Inbox, LogOut, CalendarDays, UserCog, Contact, Menu, X, BriefcaseBusiness, MapPin, IdCard } from 'lucide-react'
import { useAuth, ROLES } from '../utils/AuthContext'
import { useCrm } from '../utils/CrmContext'
import Logo from './Logo'

const linksByRole = {
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/customers', label: 'Customers 360', icon: Contact },
    { to: '/sources', label: 'Lead Sources', icon: Inbox },
    { to: '/leads', label: 'Lead Pool', icon: Users },
    { to: '/assignment', label: 'Lead Assignment', icon: Shuffle },
    { to: '/installations', label: 'Solar Installations', icon: Sun },
    { to: '/maintenance', label: 'Maintenance (AMC)', icon: Wrench },
    { to: '/team', label: 'Team accounts', icon: UserCog },
    { to: '/visits', label: 'Field visits', icon: MapPin },
  ],
  employee: [
    { to: '/', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/installations', label: 'My Solar Applications', icon: Sun },
    { to: '/my-calls', label: 'My Call Queue', icon: PhoneCall },
    { to: '/customers', label: 'Customers 360', icon: Contact },
    { to: '/maintenance', label: 'Maintenance (AMC)', icon: Wrench },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/visits', label: 'Site & sales visits', icon: MapPin },
    { to: '/my-profile', label: 'My profile & documents', icon: IdCard },
  ],
  technician: [
    { to: '/', label: 'My Service Jobs', icon: ShieldCheck },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/my-profile', label: 'My profile & documents', icon: IdCard },
  ],
  hr: [
    { to: '/', label: 'HR & payroll', icon: BriefcaseBusiness },
    { to: '/attendance', label: 'Attendance records', icon: Clock },
    { to: '/visits', label: 'Field visits', icon: MapPin },
  ],
}

const TZ = 'Asia/Kolkata'
const fmt = (d, o) => d.toLocaleString('en-IN', { timeZone: TZ, ...o })
const greeting = (d) => {
  const h = Number(fmt(d, { hour: 'numeric', hour12: false }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

function SidebarContent({ links, user, logout, onClose }) {
  return (
    <>
      <div className="flex items-start justify-between px-2 pb-6 pt-2">
        <div>
          <Logo className="h-9" />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">CRM Suite</p>
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"><X size={18} /></button>}
      </div>
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-inset ring-brand-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400 transition group-hover:text-slate-600'} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">{initials(user.name)}</div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{ROLES[user.role]}</p>
        </div>
        <button onClick={logout} title="Logout" aria-label="Logout" className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"><LogOut size={16} /></button>
      </div>
    </>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { error, loading } = useCrm()
  const links = linksByRole[user.role]
  const [now, setNow] = useState(() => new Date())
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('crm_theme') === 'dark')
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('crm_theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <SidebarContent links={links} user={user} logout={logout} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slideIn flex-col bg-white p-4 shadow-2xl">
            <SidebarContent links={links} user={user} logout={logout} onClose={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/60 bg-white/80 px-3 py-2.5 backdrop-blur-xl sm:px-4 lg:px-8 lg:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
            <Logo className="h-6 sm:hidden" />
            <div className="hidden min-w-0 leading-tight sm:block">
              <p className="truncate text-sm font-bold text-slate-900">{greeting(now)}, {user.name.split(' ')[0]}</p>
              <p className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex"><CalendarDays size={12} /> {fmt(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
              title={`Switch to ${dark ? 'light' : 'dark'} theme`}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm sm:gap-2.5 sm:px-3">
              <span className="relative hidden h-2 w-2 sm:flex">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Clock size={14} className="shrink-0 text-brand-600" />
              <span className="whitespace-nowrap text-xs font-bold tabular-nums text-slate-800 sm:text-sm">{fmt(now, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              <span className="hidden rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 sm:inline">IST</span>
            </div>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 xl:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{initials(user.name)}</span>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{ROLES[user.role]}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-4 lg:p-8">
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          {loading ? <div className="card text-sm text-slate-500">Loading your CRM data…</div> : <Outlet />}
        </main>
      </div>
    </div>
  )
}
