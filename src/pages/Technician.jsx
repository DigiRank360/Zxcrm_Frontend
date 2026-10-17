import { useState } from 'react'
import { CheckCircle2, MapPin, Phone, CalendarDays } from 'lucide-react'
import { Person } from '../components/Avatar'
import { useCrm } from '../utils/CrmContext'
import { useAuth } from '../utils/AuthContext'
import { fmtDate, generateOtp } from '../utils/helpers'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'

export default function Technician() {
  const { maintenance, setMaintenance, installations } = useCrm()
  const { user } = useAuth()
  const workerId = user.id
  const [otps, setOtps] = useState({})
  const [input, setInput] = useState({})
  const [msg, setMsg] = useState({})

  const jobs = maintenance.filter((m) => m.workerId === Number(workerId))

  const requestOtp = (id) => {
    setOtps((p) => ({ ...p, [id]: generateOtp() }))
    setMsg((p) => ({ ...p, [id]: 'OTP sent to customer\'s registered mobile' }))
  }

  const verify = (id) => {
    if (input[id] === otps[id]) {
      setMaintenance((p) => p.map((m) => (m.id === id ? { ...m, status: 'Completed' } : m)))
      setMsg((p) => ({ ...p, [id]: 'Verified. Admin notified.' }))
    } else setMsg((p) => ({ ...p, [id]: 'Invalid OTP' }))
  }

  return (
    <>
      <PageHeader eyebrow="Field Technician" title="My Service Jobs" subtitle="Request OTP at customer site and verify to complete">
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {jobs.map((m) => {
          const inst = installations.find((i) => i.id === m.installationId)
          return (
            <div key={m.id} className="card card-hover">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Person name={inst?.customer || '?'} />
                  <div className="mt-3 space-y-1 text-sm text-slate-500">
                    <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {inst?.address}</p>
                    <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {inst?.phone}</p>
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
              {otps[m.id] && m.status === 'Pending' && <p className="mt-1 text-xs text-amber-600">Demo OTP (would be SMS): {otps[m.id]}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}
