import { Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import SourceIcon from '../components/SourceIcon'
import { SOURCE_META } from '../data/sourceMeta'
import { useRef } from 'react'
import { useCrm } from '../utils/CrmContext'
import { LEAD_SOURCES } from '../data/mockData'
import { parseCsv, roundRobinAssign } from '../utils/helpers'
import PageHeader from '../components/PageHeader'

const NAMES = ['Arjun Mehta', 'Pooja Nair', 'Sanjay Khan', 'Ritu Arora', 'Manoj Tiwari', 'Isha Bansal']

export default function LeadSources() {
  const { leads, setLeads, agents } = useCrm()
  const fileRef = useRef()

  const addDemoLead = (source) => {
    const n = Math.floor(Math.random() * 1e6)
    const lead = {
      id: Date.now(), name: NAMES[n % NAMES.length], phone: `98${String(n).padStart(8, '0')}`,
      source, status: 'New', agentId: null, date: new Date().toISOString().slice(0, 10), followUp: '',
    }
    setLeads((p) => roundRobinAssign([...p, lead], agents))
  }

  const onCsv = async (e) => {
    const input = e.target
    const file = input.files[0]
    if (file) {
      const imported = parseCsv(await file.text())
      setLeads((p) => roundRobinAssign([...p, ...imported], agents))
    }
    input.value = ''
  }

  return (
    <>
      <PageHeader eyebrow="Lead Management" title="Lead Sources" subtitle="All channels feed one central pool. New leads are auto-assigned round-robin." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {LEAD_SOURCES.map((s) => {
          const { desc, tone } = SOURCE_META[s]
          const mine = leads.filter((l) => l.source === s)
          return (
            <div key={s} className="card card-hover flex flex-col">
              <div className={`mb-4 w-fit rounded-2xl p-3.5 ${tone}`}><SourceIcon source={s} size={22} /></div>
              <h3 className="font-bold text-slate-900">{s}</h3>
              <p className="mb-3 text-sm text-slate-500">{desc}</p>
              <p className="mb-5 text-4xl font-extrabold tracking-tight text-brand-700">{mine.length} <span className="text-sm font-normal text-slate-500">leads</span></p>
              <div className="mt-auto flex gap-2">
                {s === 'CSV' ? (
                  <>
                    <input ref={fileRef} type="file" accept=".csv" hidden onChange={onCsv} />
                    <button className="btn-primary flex-1" onClick={() => fileRef.current.click()}><Upload size={16} /> Upload CSV</button>
                  </>
                ) : (
                  <button className="btn-outline flex-1" onClick={() => addDemoLead(s)}><Plus size={16} /> Simulate lead</button>
                )}
                <Link to={`/leads?source=${encodeURIComponent(s)}`} className="btn-outline">View</Link>
              </div>
            </div>
          )
        })}
      </div>
      <div className="card">
        <h2 className="section-title">How leads flow</h2>
        <ol className="grid gap-4 text-sm text-slate-600 md:grid-cols-4">
          {[
            ['Capture', 'Lead arrives from Meta Ads, WhatsApp, Website or CSV.'],
            ['Central Pool', 'Saved in one list with source and date.'],
            ['Auto-assign', 'Round-robin to active employees only.'],
            ['Follow-up', 'Employee calls, logs outcome and sets reminder.'],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl bg-slate-50 p-4">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{i + 1}</span>
              <p className="font-semibold text-slate-900">{t}</p>
              <p className="mt-1 text-xs leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-400">Live Meta/WhatsApp/Website integrations need backend webhooks; "Simulate lead" demonstrates the flow.</p>
      </div>
    </>
  )
}
