import { useState } from 'react'
import { ArrowRight, MapPinned } from 'lucide-react'
import { useCrm } from '../utils/CrmContext'
import { stateCities, states } from '../data/locations'
import { fmtDateTime } from '../utils/helpers'

const place = (city, state) => [city, state].filter(Boolean).join(', ') || 'Not set'

export default function LeadLocationTransfer({ lead, onTransferred }) {
  const { transferLeadLocation } = useCrm()
  const [form, setForm] = useState({ state: '', city: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const transfers = lead.transfers || []

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setDone('')
    try {
      const updated = await transferLeadLocation(lead.id, form)
      setForm({ state: '', city: '', note: '' })
      setDone(`Lead transferred to ${place(updated.city, updated.state)}.`)
      onTransferred?.(updated)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <h2 className="section-title flex items-center gap-2"><MapPinned size={17} className="text-brand-600" /> Transfer location / branch</h2>
      <p className="mb-4 text-sm text-slate-600">Current location: <b>{place(lead.city, lead.state)}</b></p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">Transfer to state
          <select required className="input mt-1" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value, city: '' })}>
            <option value="">Select state</option>
            {states.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">City / branch
          <select required disabled={!form.state} className="input mt-1 disabled:bg-slate-50" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            <option value="">{form.state ? 'Select city' : 'Select state first'}</option>
            {(stateCities[form.state] || []).map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Reason (optional)
          <input maxLength={300} className="input mt-1" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Customer shifted to Delhi" />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button className="btn-primary" disabled={busy}><ArrowRight size={16} /> {busy ? 'Transferring…' : 'Transfer location'}</button>
        </div>
      </form>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {done && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{done}</p>}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="mb-2 text-sm font-bold text-slate-800">Transfer history</h3>
        {transfers.length === 0 && <p className="text-sm text-slate-500">No transfers yet.</p>}
        <ul className="space-y-2">
          {transfers.map((item) => (
            <li key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-800">
                {place(item.fromCity, item.fromState)} <ArrowRight size={14} className="text-slate-400" /> {place(item.toCity, item.toState)}
              </p>
              <p className="text-xs text-slate-500">{fmtDateTime(item.transferredAt)} · by {item.transferredBy}{item.note ? ` · ${item.note}` : ''}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
