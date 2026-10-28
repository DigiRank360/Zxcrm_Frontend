import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, UserRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import { useAuth } from '../utils/AuthContext'
import { apiRequest } from '../utils/api'
import { fmtDateTime } from '../utils/helpers'

export default function Customers() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState([])
  const [query, setQuery] = useState('')
  const [params] = useSearchParams()
  const [selectedId, setSelectedId] = useState(params.get('customer') || '')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/api/customers', { token })
      .then((data) => {
        if (!active) return
        setCustomers(data)
        setSelectedId((current) => current || data[0]?.id || '')
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [token])

  const visible = customers.filter((customer) =>
    `${customer.name} ${customer.phone} ${customer.email} ${customer.city} ${customer.state}`.toLowerCase().includes(query.toLowerCase()))
  const selected = visible.find((customer) => customer.id === selectedId) || visible[0]

  return (
    <>
      <PageHeader eyebrow="Customer lifecycle" title="Customer 360" subtitle="A persistent customer profile with lead, application, installation, and service history." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_2fr]">
        <section className="card !p-3">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !pl-9" placeholder="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="max-h-[68vh] space-y-1 overflow-y-auto">
            {visible.map((customer) => (
              <button key={customer.id} onClick={() => setSelectedId(customer.id)} className={`w-full rounded-xl p-3 text-left ${selected?.id === customer.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}>
                <span className="flex items-center gap-2 font-semibold text-slate-800"><UserRound size={16} />{customer.name}</span>
                <span className="mt-1 block text-xs text-slate-500">{customer.phone} · {[customer.city, customer.state].filter(Boolean).join(', ') || 'Location not captured'}</span>
              </button>
            ))}
            {!visible.length && <p className="p-4 text-sm text-slate-500">No customer profiles are available.</p>}
          </div>
        </section>
        {selected ? (
          <section className="space-y-4">
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Profile</p><h2 className="mt-1 text-2xl font-bold">{selected.name}</h2></div>
                <Badge>{selected.propertyType || 'Customer'}</Badge>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {[['Phone', selected.phone], ['Email', selected.email], ['Address', selected.address], ['Location', [selected.city, selected.state].filter(Boolean).join(', ')]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-400">{label}</dt><dd className="mt-1 text-slate-700">{value || '—'}</dd></div>)}
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Leads', selected.leads.length], ['Applications', selected.applications.length], ['Installations', selected.installations.length], ['Service tickets', selected.tickets.length]].map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-bold text-brand-700">{count}</p><p className="text-xs text-slate-500">{label}</p></div>)}
              </div>
            </div>
            <div className="card">
              <h3 className="section-title">Customer history</h3>
              <ol className="space-y-3">
                {selected.history.map((event) => <li key={event.id} className="flex gap-3 border-l-2 border-brand-100 pl-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-brand-500" />
                  <div><p className="text-sm font-medium text-slate-700">{event.summary}</p><p className="mt-1 text-xs text-slate-400">{fmtDateTime(event.occurredAt)}</p></div>
                </li>)}
                {!selected.history.length && <li className="text-sm text-slate-500">No activity recorded yet.</li>}
              </ol>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="card"><h3 className="section-title">Installation history</h3>
                {selected.installations.map((item) => <div key={item.id} className="border-t border-slate-100 py-3 text-sm"><p className="font-semibold">{item.address || 'Installation'}</p><p className="text-slate-500">Installed {item.installDate || '—'} · {item.status}</p></div>)}
                {!selected.installations.length && <p className="text-sm text-slate-500">No installation records.</p>}
              </div>
              <div className="card"><h3 className="section-title">Service tickets</h3>
                {selected.tickets.map((item) => <div key={item.id} className="border-t border-slate-100 py-3 text-sm"><p className="font-semibold">{item.title || 'Service job'}</p><p className="text-slate-500">{item.description || '—'} · Due {item.dueDate} · {item.status}</p></div>)}
                {!selected.tickets.length && <p className="text-sm text-slate-500">No service tickets.</p>}
              </div>
            </div>
          </section>
        ) : <div className="card text-sm text-slate-500">Customer data appears here as CRM records are created.</div>}
      </div>
    </>
  )
}
