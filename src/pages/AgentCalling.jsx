import { useState } from 'react'
import { Phone, CalendarClock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { CALL_OUTCOMES } from '../data/mockData'
import { fmtDateTime } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

export default function AgentCalling() {
  const { leads, setLeads, attendance } = useCrm()
  const { user } = useAuth()
  const agentId = user.id
  const att = attendance.find((a) => a.employee === user.name)
  const working = !!att?.checkIn && !att?.checkOut
  const [draft, setDraft] = useState({})
  const queue = leads.filter((l) => l.agentId === Number(agentId) && l.status !== 'Converted')

  const save = (id) => {
    const d = draft[id] || {}
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status: d.outcome || l.status, followUp: d.followUp ?? l.followUp } : l)))
    setDraft((p) => ({ ...p, [id]: {} }))
  }
  const upd = (id, k, v) => setDraft((p) => ({ ...p, [id]: { ...p[id], [k]: v } }))

  return (
    <>
      <PageHeader eyebrow="Agent" title="My Call Queue" subtitle="Leads that need action or follow-up">
      </PageHeader>
      {!working && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={18} /> Check in to start logging calls.
          <Link to="/attendance" className="ml-auto font-semibold underline">Go to Attendance</Link>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {queue.map((l) => (
          <div key={l.id} className="card card-hover">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Person name={l.name} sub={l.source} />
                <a href={`tel:${l.phone}`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700"><Phone size={14} /> {l.phone}</a>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarClock size={13} /> Follow-up: {fmtDateTime(l.followUp)}</p>
              </div>
              <Badge>{l.status}</Badge>
            </div>
            <div className="mt-4 grid gap-2 xl:grid-cols-2">
              <select className="input" value={draft[l.id]?.outcome || ''} onChange={(e) => upd(l.id, 'outcome', e.target.value)}>
                <option value="">Call outcome…</option>{CALL_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
              </select>
              <input className="input" type="datetime-local" value={draft[l.id]?.followUp ?? l.followUp} onChange={(e) => upd(l.id, 'followUp', e.target.value)} />
            </div>
            <button className="btn-primary mt-3 w-full sm:w-auto" disabled={!working} onClick={() => save(l.id)}>Save call log</button>
          </div>
        ))}
        {!queue.length && <p className="text-slate-400">No leads in queue 🎉</p>}
      </div>
    </>
  )
}
