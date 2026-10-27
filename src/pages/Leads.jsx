import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Upload, Search, RefreshCw, X } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { LEAD_SOURCES, LEAD_STATUSES } from '../data/crmOptions'
import { fmtDate, parseCsv } from '../utils/helpers'
import SourceIcon from '../components/SourceIcon'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Leads() {
  const { leads, agents, importLeads, refreshLeads, updateLead } = useCrm()
  const [params] = useSearchParams()
  const [f, setF] = useState({ q: '', source: params.get('source') || '', status: '', agent: '', date: '' })
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const refreshInFlight = useRef(false)
  const fileRef = useRef()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    const refresh = async () => {
      if (refreshInFlight.current) return
      refreshInFlight.current = true
      try {
        await refreshLeads()
        setError('')
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        refreshInFlight.current = false
        setRefreshing(false)
      }
    }
    void refresh()
    const timer = window.setInterval(refresh, 20000)
    return () => window.clearInterval(timer)
  }, [refreshLeads])

  const onRefresh = () => {
    setRefreshing(true)
    setError('')
    if (refreshInFlight.current) return
    refreshInFlight.current = true
    refreshLeads()
      .then(() => setError(''))
      .catch((requestError) => setError(requestError.message))
      .finally(() => {
        refreshInFlight.current = false
        setRefreshing(false)
      })
  }

  const rows = leads.filter((l) =>
    (!f.q || `${l.name} ${l.phone}`.toLowerCase().includes(f.q.toLowerCase())) &&
    (!f.source || l.source === f.source) &&
    (!f.status || l.status === f.status) &&
    (!f.agent || String(l.agentId) === f.agent) &&
    (!f.date || l.date === f.date))

  const onCsv = async (e) => {
    const input = e.target
    const file = input.files[0]
    if (file) {
      try {
        const imported = parseCsv(await file.text())
        await importLeads(imported)
        setError('')
      } catch (requestError) {
        setError(requestError.message)
      }
    }
    input.value = ''
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateLead(editing.id, {
        name: editing.name,
        phone: editing.phone,
        email: editing.email || '',
        state: editing.state || '',
        city: editing.city || '',
        propertyType: editing.propertyType || '',
        score: editing.score,
        status: editing.status,
        notes: editing.notes || '',
        followUp: editing.followUp || '',
      })
      setEditing(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <Person name={r.name} sub={r.phone} /> },
    { key: 'source', label: 'Source', render: (r) => <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600"><SourceIcon source={r.source} size={12} />{r.source}</span> },
    { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
    { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'agent', label: 'Agent', render: (r) => agents.find((a) => a.id === r.agentId)?.name || <span className="text-slate-400">Unassigned</span> },
    { key: 'actions', label: 'Actions', render: (r) => <button type="button" className="btn-outline !px-2.5 !py-1.5 text-xs" onClick={() => setEditing({ ...r })}><Pencil size={14} /> Edit</button> },
  ]

  return (
    <>
      <PageHeader eyebrow="Lead Management" title="Central Lead Pool" subtitle="Facebook, Meta Ads, WhatsApp, Website and CSV leads in one place">
        <input ref={fileRef} type="file" accept=".csv" hidden onChange={onCsv} />
        <button className="btn-outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh leads
        </button>
        <button className="btn-primary" onClick={() => fileRef.current.click()}><Upload size={16} /> Upload CSV</button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', ...LEAD_SOURCES].map((s) => (
          <button key={s} onClick={() => setF({ ...f, source: s })} className={`${f.source === s ? 'btn-primary' : 'btn-outline'} !rounded-full !px-4 !py-1.5 !text-xs`}>
            {s && <SourceIcon source={s} size={12} />}{s || 'All'} ({s ? leads.filter((l) => l.source === s).length : leads.length})
          </button>
        ))}
      </div>
      <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !pl-10" placeholder="Search name / phone" value={f.q} onChange={set('q')} /></div>
        <select className="input" value={f.source} onChange={set('source')}>
          <option value="">All sources</option>{LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={f.status} onChange={set('status')}>
          <option value="">All statuses</option>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={f.agent} onChange={set('agent')}>
          <option value="">All agents</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input" type="date" value={f.date} onChange={set('date')} />
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <DataTable columns={columns} rows={rows} />
      {editing && (
        <div className="card mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Edit lead</h2>
            <button type="button" aria-label="Close edit form" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
          </div>
          <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['name', 'phone', 'email', 'state', 'city', 'propertyType', 'score', 'notes', 'followUp'].map((field) => (
              <label key={field} className="text-xs font-semibold capitalize text-slate-600">
                {field}
                <input className="input mt-1" type={field === 'score' ? 'number' : 'text'} min={field === 'score' ? 0 : undefined} max={field === 'score' ? 100 : undefined} value={editing[field] ?? ''} onChange={(event) => setEditing({ ...editing, [field]: event.target.value })} />
              </label>
            ))}
            <label className="text-xs font-semibold text-slate-600">Status
              <select className="input mt-1" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
                {LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <div className="flex items-end"><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save lead'}</button></div>
          </form>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">CSV columns: name, phone, email, state, city, propertyType, score. Leads are routed against employee availability and capacity.</p>
    </>
  )
}
