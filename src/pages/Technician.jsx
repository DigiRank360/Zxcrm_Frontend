import { useState } from 'react'
import { CheckCircle2, MapPin, Phone, CalendarDays } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { fmtDate } from '../utils/helpers'
import { apiRequest } from '../utils/api'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

export default function Technician() {
  const { maintenance, setMaintenanceLocal, installations, customers } = useCrm()
  const { user, token } = useAuth()
  const workerId = user.id
  const [otps, setOtps] = useState({})
  const [input, setInput] = useState({})
  const [msg, setMsg] = useState({})

  const jobs = maintenance.filter((m) => m.workerId === workerId)

  const requestOtp = async (id) => {
    try {
      await apiRequest(`/api/maintenance/${id}/otp`, { method: 'POST', token })
      setOtps((p) => ({ ...p, [id]: true }))
      setMsg((p) => ({ ...p, [id]: 'OTP sent to customer\'s registered mobile' }))
    } catch (error) {
      setMsg((p) => ({ ...p, [id]: error.message }))
    }
  }

  const verify = async (id) => {
    try {
      await apiRequest(`/api/maintenance/${id}/verify-otp`, {
        method: 'POST',
        token,
        body: JSON.stringify({ otp: input[id] || '' }),
      })
      setMaintenanceLocal((p) => p.map((m) => (m.id === id ? { ...m, status: 'Completed' } : m)))
      setMsg((p) => ({ ...p, [id]: 'Verified. Admin notified.' }))
    } catch (error) {
      setMsg((p) => ({ ...p, [id]: error.message }))
    }
  }

  return (
    <>
      <PageHeader eyebrow="Field Technician" title="My Service Jobs" subtitle="Request OTP at customer site and verify to complete">
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {jobs.map((m) => {
          const inst = installations.find((i) => i.id === m.installationId)
          const customer = customers.find((item) => item.id === m.customerId)
          return (
            <div key={m.id} className="card card-hover">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Person name={customer?.name || inst?.customer || '?'} />
                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <p className="font-semibold text-slate-700">{m.title || 'Service job'}{m.priority ? ` · ${m.priority}` : ''}</p>
                    {m.description && <p>{m.description}</p>}
                    <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {inst?.address || customer?.address || 'No address recorded'}</p>
                    <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {customer?.phone || inst?.phone}</p>
                    <p className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" /> Due {fmtDate(m.dueDate)}</p>
                  </div>
                </div>
                <Badge>{m.status}</Badge>
              </div>
              {m.status === 'Pending' ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button className="btn-outline" onClick={() => requestOtp(m.id)}>Request Service OTP</button>
                  {otps[m.id] && (
                    <>
                      <input className="input sm:!w-32" maxLength={4} inputMode="numeric" placeholder="4-digit OTP" value={input[m.id] || ''} onChange={(e) => setInput({ ...input, [m.id]: e.target.value })} />
                      <button className="btn-primary" onClick={() => verify(m.id)}>Verify</button>
                    </>
                  )}
                </div>
              ) : (
                <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-green-700"><CheckCircle2 size={16} /> Service completed</p>
              )}
              {msg[m.id] && <p className="mt-2 text-xs text-slate-500">{msg[m.id]}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}
