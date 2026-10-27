import { useState } from 'react'
import { Camera, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../utils/AuthContext'
import { useCrm } from '../utils/CrmContext'
import { fmtDateTime } from '../utils/helpers'

export default function Visits() {
  const { user } = useAuth()
  const { visits, addVisit, uploadPhoto } = useCrm()
  const canRecord = user.role === 'employee'
  const [form, setForm] = useState({ kind: 'Site visit', customer: '', note: '' })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const context = form.kind === 'Site visit' ? 'site-visit' : 'sales-visit'
      const photoUrl = await uploadPhoto(photo, context)
      await addVisit({ ...form, photoUrl })
      setForm({ kind: 'Site visit', customer: '', note: '' })
      setPhoto(null)
      event.target.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Field activity" title="Site & sales visits" subtitle={canRecord ? 'Record a customer visit with photo evidence.' : 'Review employee site and sales visits.'} />
      {canRecord && <form onSubmit={submit} className="card mb-6">
        <h2 className="section-title flex items-center gap-2"><Camera size={18} /> Record a visit</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-600">Visit type
            <select className="input mt-1" value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
              <option>Site visit</option>
              <option>Sales visit</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Customer / site
            <input required maxLength={150} className="input mt-1" value={form.customer} onChange={(event) => setForm((current) => ({ ...current, customer: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Visit notes
            <textarea maxLength={2000} className="input mt-1 min-h-20" value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
          </label>
          <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Photo evidence (required; JPEG, PNG, or WebP up to 5 MB)
            <input required type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="input mt-1" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
          </label>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={saving || !photo} className="btn-primary mt-4"><Plus size={16} /> {saving ? 'Uploading…' : 'Save visit'}</button>
      </form>}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead><tr><th className="th">Visit</th><th className="th">Employee</th><th className="th">Customer / site</th><th className="th">Notes</th><th className="th">Photo</th><th className="th">Date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((visit) => <tr key={visit.id}>
                <td className="td">{visit.kind}</td>
                <td className="td">{visit.employee}</td>
                <td className="td">{visit.customer}</td>
                <td className="td max-w-64 whitespace-pre-wrap">{visit.note || '—'}</td>
                <td className="td"><a href={visit.photoUrl} target="_blank" rel="noreferrer"><img src={visit.photoUrl} alt={`${visit.kind} at ${visit.customer}`} className="h-12 w-16 rounded-lg object-cover" /></a></td>
                <td className="td">{fmtDateTime(visit.visitedAt)}</td>
              </tr>)}
              {!visits.length && <tr><td className="px-5 py-10 text-center text-sm text-slate-400" colSpan={6}>No visits recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
