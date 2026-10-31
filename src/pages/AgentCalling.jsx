import { useMemo, useState } from 'react'
import { Phone, CalendarClock, AlertCircle, PhoneCall, Clock, UserRound, CheckCircle2, X, MapPin, ArrowRightLeft, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { CALL_OUTCOMES, LEAD_STATUSES } from '../data/crmOptions'
import { stateCities, states } from '../data/locations'
import { fmtDateTime, istDate } from '../utils/helpers'
import LeadLocationTransfer from '../components/LeadLocationTransfer'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

const toDateTimeLocal = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Order: overdue follow-ups, due today, never-called leads, later follow-ups, everything else
function classify(lead, now) {
  if (lead.status === 'Not Interested') return { key: 'not_interested', label: 'Not Interested', rank: 5 }
  const due = lead.followUp ? new Date(lead.followUp) : null
  const validDue = due && !Number.isNaN(due.getTime()) ? due : null
  if (validDue) {
    const isDateOnly = !String(lead.followUp).includes('T')
    const isPastDue = isDateOnly ? localDate(validDue) < localDate(now) : validDue < now
    if (isPastDue && lead.status === 'Interested') return { key: 'interested', label: 'Follow-up', rank: 4 }
    if (isPastDue) return { key: 'overdue', label: 'Overdue', rank: 0 }
    if (localDate(validDue) === localDate(now)) return { key: 'today', label: 'Due today', rank: 1 }
  }
  if (lead.status === 'New') return { key: 'new', label: 'Not called yet', rank: 2 }
  if (validDue) return { key: 'scheduled', label: 'Scheduled', rank: 3 }
  return { key: 'open', label: 'No follow-up set', rank: 4 }
}

const tabs = [
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due today' },
  { key: 'new', label: 'Not called' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'not_interested', label: 'Not Interested' },
  { key: 'all', label: 'All' },
]

const accent = { overdue: 'border-l-rose-500', today: 'border-l-amber-500', new: 'border-l-brand-500', scheduled: 'border-l-slate-300', open: 'border-l-slate-200', interested: 'border-l-emerald-400', not_interested: 'border-l-rose-400' }
const tone = { overdue: 'bg-rose-50 text-rose-700', today: 'bg-amber-50 text-amber-700', new: 'bg-brand-50 text-brand-700', scheduled: 'bg-slate-100 text-slate-600', open: 'bg-slate-100 text-slate-600', interested: 'bg-emerald-50 text-emerald-700', not_interested: 'bg-rose-50 text-rose-700' }

export default function AgentCalling() {
  const { leads, updateLead, softDeleteLead, createManualLead, attendance, agents, assignLead } = useCrm()
  const { user } = useAuth()
  const working = attendance.some((a) =>
    a.date === istDate() &&
    (a.userId ? a.userId === user.id : a.employee === user.name) &&
    a.checkIn &&
    !a.checkOut
  )
  const [draft, setDraft] = useState({})
  const [tab, setTab] = useState('pending')
  const [savingId, setSavingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [editing, setEditing] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [transferTargets, setTransferTargets] = useState({})
  const [transferringId, setTransferringId] = useState('')
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)
  const [newLeadSaving, setNewLeadSaving] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', state: '', city: '', propertyType: '', notes: '' })
  const queue = useMemo(() => {
    const now = new Date()
    return leads
      .filter((l) => l.agentId === user.id && l.status !== 'Converted' && !l.deletedAt)
      .map((l) => ({ lead: l, group: classify(l, now) }))
      .sort((a, b) => a.group.rank - b.group.rank || String(a.lead.followUp || '~').localeCompare(String(b.lead.followUp || '~')))
  }, [leads, user.id])

  const count = (key) => queue.filter((q) => q.group.key === key).length
  const pendingCount = count('overdue') + count('today') + count('new')
  const visible = queue.filter(({ group }) => tab === 'all' || (tab === 'pending' ? ['overdue', 'today', 'new'].includes(group.key) : group.key === tab))

  const upd = (id, k, v) => setDraft((p) => ({ ...p, [id]: { ...p[id], [k]: v } }))

  const createLead = async (event) => {
    event.preventDefault()
    setNewLeadSaving(true)
    setError('')
    setSaved('')
    try {
      const lead = await createManualLead(newLead)
      setSaved(`Lead added to your call queue: ${lead.name}.`)
      setNewLead({ name: '', phone: '', email: '', state: '', city: '', propertyType: '', notes: '' })
      setShowNewLeadForm(false)
      setTab('pending')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setNewLeadSaving(false)
    }
  }

  const save = async (lead) => {
    const d = draft[lead.id] || {}
    if (d.outcome === 'Others' && !d.notes?.trim()) {
      setError('Enter a message for the Others outcome before saving.')
      return
    }
    setSavingId(lead.id)
    setError('')
    setSaved('')
    try {
      await updateLead(lead.id, {
        status: d.outcome === 'Others' ? 'Other' : d.outcome || lead.status,
        followUp: d.followUp ?? toDateTimeLocal(lead.followUp),
        notes: d.notes ?? lead.notes ?? '',
      })
      setDraft((p) => ({ ...p, [lead.id]: {} }))
      setSaved(`Call log saved for ${lead.name}.`)
      if (d.outcome === 'Not Interested') setTab('not_interested')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavingId('')
    }
  }

  const removeLead = async (lead) => {
    if (!window.confirm(`Move ${lead.name} to the archive? It can be restored by an administrator.`)) return
    setDeletingId(lead.id)
    setError('')
    setSaved('')
    try {
      await softDeleteLead(lead.id)
      setSaved(`${lead.name} moved to the archive.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId('')
    }
  }

  const startEdit = (lead) => {
    setError('')
    setSaved('')
    setEditing({
      id: lead.id,
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      state: lead.state || '',
      city: lead.city || '',
      status: lead.status,
      followUp: toDateTimeLocal(lead.followUp),
      notes: lead.notes || '',
    })
  }

  const setField = (key) => (event) => {
    const value = event.target.value
    setEditing((current) => ({ ...current, [key]: value, ...(key === 'state' ? { city: '' } : {}) }))
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    const { id, ...fields } = editing
    setEditSaving(true)
    setError('')
    try {
      await updateLead(id, fields)
      setSaved(`${fields.name} updated.`)
      setEditing(null)
      if (fields.status === 'Not Interested') setTab('not_interested')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setEditSaving(false)
    }
  }

  const transfer = async (lead) => {
    const agentId = transferTargets[lead.id]
    const target = agents.find((agent) => agent.id === agentId)
    if (!target) return
    setTransferringId(lead.id)
    setError('')
    setSaved('')
    try {
      await assignLead(lead.id, target.id)
      setSaved(`${lead.name} transferred to ${target.name}.`)
      setTransferTargets((current) => ({ ...current, [lead.id]: '' }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setTransferringId('')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Agent" title="My Call Queue" subtitle="Leads assigned to you, ordered by what needs a call first">
        <button type="button" className="btn-primary" onClick={() => { setError(''); setShowNewLeadForm((open) => !open) }}>
          {showNewLeadForm ? <X size={16} /> : <Plus size={16} />}
          {showNewLeadForm ? 'Cancel' : 'New lead'}
        </button>
      </PageHeader>
      {!working && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={18} /> You are not checked in. Call logs can still be saved.
          <Link to="/attendance" className="ml-auto font-semibold underline">Go to Attendance</Link>
        </div>
      )}
      {showNewLeadForm && (
        <form onSubmit={createLead} className="card mb-5">
          <h2 className="section-title mb-4">Add a new lead</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">Name <span className="text-rose-500">*</span>
              <input required maxLength={150} className="input mt-1" value={newLead.name} onChange={(event) => setNewLead((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Phone <span className="text-rose-500">*</span>
              <input required type="tel" maxLength={40} className="input mt-1" value={newLead.phone} onChange={(event) => setNewLead((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">Email
              <input type="email" maxLength={200} className="input mt-1" value={newLead.email} onChange={(event) => setNewLead((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600">State
              <select className="input mt-1" value={newLead.state} onChange={(event) => setNewLead((current) => ({ ...current, state: event.target.value, city: '' }))}>
                <option value="">Select state</option>
                {states.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">City
              <select className="input mt-1" value={newLead.city} onChange={(event) => setNewLead((current) => ({ ...current, city: event.target.value }))} disabled={!newLead.state}>
                <option value="">Select city</option>
                {(stateCities[newLead.state] || []).map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Property type
              <input maxLength={200} className="input mt-1" value={newLead.propertyType} onChange={(event) => setNewLead((current) => ({ ...current, propertyType: event.target.value }))} />
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">Notes
              <textarea rows={3} maxLength={500} className="input mt-1 resize-y" value={newLead.notes} onChange={(event) => setNewLead((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary" disabled={newLeadSaving}>{newLeadSaving ? 'Adding…' : 'Add to my queue'}</button>
            <button type="button" className="btn-outline" onClick={() => setShowNewLeadForm(false)} disabled={newLeadSaving}>Cancel</button>
          </div>
        </form>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending calls" value={pendingCount} icon={PhoneCall} />
        <StatCard label="Overdue" value={count('overdue')} icon={AlertCircle} tone="rose" />
        <StatCard label="Due today" value={count('today')} icon={Clock} tone="amber" />
        <StatCard label="Not called yet" value={count('new')} icon={CheckCircle2} tone="green" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`${tab === t.key ? 'btn-primary' : 'btn-outline'} !rounded-full !px-4 !py-1.5 !text-xs`}>
            {t.label} ({t.key === 'all' ? queue.length : t.key === 'pending' ? pendingCount : count(t.key)})
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{saved}</p>}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map(({ lead: l, group }) => editing?.id === l.id ? (
          <div key={l.id} className="space-y-4 md:col-span-2 2xl:col-span-3">
          <form onSubmit={saveEdit} className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Edit lead</h2>
              <button type="button" aria-label="Close editor" onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">Name <span className="text-rose-500">*</span>
                <input required maxLength={150} className="input mt-1" value={editing.name} onChange={setField('name')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Phone <span className="text-rose-500">*</span>
                <input required className="input mt-1" value={editing.phone} onChange={setField('phone')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">Email
                <input type="email" maxLength={500} className="input mt-1" value={editing.email} onChange={setField('email')} />
              </label>
              <label className="text-xs font-semibold text-slate-600">State
                <select className="input mt-1" value={editing.state} onChange={setField('state')}>
                  <option value="">Select state</option>
                  {editing.state && !states.includes(editing.state) && <option>{editing.state}</option>}
                  {states.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">City
                <select className="input mt-1" value={editing.city} onChange={setField('city')}>
                  <option value="">Select city</option>
                  {editing.city && !(stateCities[editing.state] || []).includes(editing.city) && <option>{editing.city}</option>}
                  {(stateCities[editing.state] || []).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Status
                <select className="input mt-1" value={editing.status} onChange={setField('status')}>
                  {LEAD_STATUSES.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-600">Follow-up date and time
                <input type="datetime-local" className="input mt-1" value={editing.followUp} onChange={setField('followUp')} />
              </label>
              <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Notes
                <textarea rows={3} maxLength={500} className="input mt-1 resize-y" value={editing.notes} onChange={setField('notes')} />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
          <LeadLocationTransfer lead={l} onTransferred={(updated) => setEditing((current) => ({ ...current, state: updated.state, city: updated.city }))} />
          </div>
        ) : (
          <article key={l.id} className={`card flex flex-col !p-0 overflow-hidden border-l-4 ${accent[group.key]}`}>
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <Person name={l.name} sub={l.source} />
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge>{l.status}</Badge>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone[group.key]}`}>{group.label}</span>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-slate-400" />
                  <a href={`tel:${l.phone}`} className="font-semibold text-brand-700 hover:underline">{l.phone}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600">
                  <CalendarClock size={15} className="text-slate-400" />
                  <span>{l.followUp ? fmtDateTime(l.followUp) : 'No follow-up scheduled'}</span>
                </div>
                {(l.city || l.state) && (
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <MapPin size={15} className="text-slate-400" />
                    <span>{[l.city, l.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </dl>
              {l.notes && <p className="mt-3 line-clamp-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">{l.notes}</p>}
            </div>
            <div className="mt-auto border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Log call</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select aria-label="Call outcome" className="input" value={draft[l.id]?.outcome || ''} onChange={(e) => setDraft((current) => ({ ...current, [l.id]: { ...current[l.id], outcome: e.target.value, ...(e.target.value === 'Others' ? { notes: '' } : {}) } }))}>
                  <option value="">Call outcome…</option>{CALL_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                </select>
                <input aria-label="Next follow-up" className="input" type="datetime-local" value={draft[l.id]?.followUp ?? toDateTimeLocal(l.followUp)} onChange={(e) => upd(l.id, 'followUp', e.target.value)} />
              </div>
              <textarea aria-label={draft[l.id]?.outcome === 'Others' ? 'Other outcome message' : 'Call notes'} className="input mt-2 min-h-16 resize-y" rows={2} maxLength={500} placeholder={draft[l.id]?.outcome === 'Others' ? 'Enter a message for this outcome…' : 'Call notes'} required={draft[l.id]?.outcome === 'Others'} value={draft[l.id]?.notes ?? l.notes ?? ''} onChange={(e) => upd(l.id, 'notes', e.target.value)} />
              <div className="mt-3 flex items-center gap-2">
                <button type="button" className="btn-primary flex-1" disabled={savingId === l.id} onClick={() => save(l)}>{savingId === l.id ? 'Saving…' : 'Save call log'}</button>
                <button type="button" className="btn-outline" onClick={() => startEdit(l)}>Edit</button>
                <button type="button" className="btn-outline !px-3 text-rose-700" aria-label={`Move ${l.name} to archive`} title="Move to archive" disabled={deletingId === l.id} onClick={() => removeLead(l)}><Trash2 size={16} /></button>
                {l.customerId && (
                  <Link to={`/customers?customer=${l.customerId}`} title="Customer record" aria-label="Customer record" className="btn-outline !px-3"><UserRound size={16} /></Link>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                <select
                  aria-label={`Transfer ${l.name} to employee`}
                  className="input min-w-0 flex-1"
                  value={transferTargets[l.id] || ''}
                  onChange={(event) => setTransferTargets((current) => ({ ...current, [l.id]: event.target.value }))}
                  disabled={transferringId === l.id || agents.filter((agent) => agent.id !== user.id).length === 0}
                >
                  <option value="">Transfer lead to…</option>
                  {agents.filter((agent) => agent.id !== user.id).map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!transferTargets[l.id] || transferringId === l.id}
                  onClick={() => transfer(l)}
                >
                  <ArrowRightLeft size={15} /> {transferringId === l.id ? 'Transferring…' : 'Transfer lead'}
                </button>
              </div>
            </div>
          </article>
        ))}
        {!visible.length && <p className="text-slate-400">{queue.length ? 'No calls in this view.' : 'No leads in queue 🎉'}</p>}
      </div>
    </>
  )
}
