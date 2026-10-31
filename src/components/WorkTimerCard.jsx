import { useMemo, useState } from 'react'
import { LogIn, LogOut, Timer } from 'lucide-react'
import { useCrm } from '../utils/CrmContext'
import { fmtDuration, istDate, istTime, workedSeconds } from '../utils/helpers'
import useNow from '../utils/useNow'

const SHIFT_SEC = 8 * 3600
const WORK_START_MINUTES = 10 * 60
const WORK_END_MINUTES = 20 * 60 + 30

const isWorkingHours = (date) => {
  const [hours, minutes] = istTime(date).split(':').map(Number)
  const time = hours * 60 + minutes
  return time >= WORK_START_MINUTES && time <= WORK_END_MINUTES
}

const sessionStart = (session) => new Date(
  session.checkInAt || `${session.date}T${session.checkIn}:00+05:30`
).getTime()

export default function WorkTimerCard({ employee, userId }) {
  const { attendance, setAttendance, uploadPhoto } = useCrm()
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const sessions = useMemo(() => attendance
    .filter((a) => (a.userId ? a.userId === userId : a.employee === employee) && a.date === istDate())
    .sort((a, b) => sessionStart(a) - sessionStart(b)), [attendance, employee, userId])
  const activeSession = sessions.find((session) => session.checkIn && !session.checkOut)
  const latestSession = sessions[sessions.length - 1]
  const me = activeSession || latestSession
  const running = !!activeSession
  const now = useNow()
  const withinWorkingHours = isWorkingHours(now)
  const secs = sessions.reduce((total, session) => total + workedSeconds(session, now), 0)
  const pct = Math.min(100, (secs / SHIFT_SEC) * 100)
  const update = (patch) => setAttendance((p) => p.map((a) => (a.id === me?.id ? { ...a, ...patch } : a)))
  const checkIn = async () => {
    if (!isWorkingHours(new Date())) {
      setError('Check-in is available only from 10:00 AM to 8:30 PM IST.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const photoUrl = photo ? await uploadPhoto(photo, 'attendance') : undefined
      const checkInAt = new Date()
      setAttendance((p) => [...p, {
        id: crypto.randomUUID(),
        userId,
        employee,
        date: istDate(),
        checkIn: istTime(checkInAt),
        checkInAt: checkInAt.toISOString(),
        checkOut: '',
        checkOutAt: '',
        status: 'Present',
        ...(photoUrl ? { photoUrl } : {}),
      }])
      setPhoto(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  const checkOut = () => {
    const now = new Date()
    if (!isWorkingHours(now)) {
      setError('Check-out is available only from 10:00 AM to 8:30 PM IST.')
      return
    }
    update({ checkOut: istTime(now), checkOutAt: now.toISOString() })
  }

  const state = running ? { label: 'Working', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' }
    : latestSession?.checkOut ? { label: 'Session complete', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' }
      : { label: 'Not checked in', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' }

  return (
    <div className="card relative mb-6 overflow-hidden !p-0">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-sun-400/30 to-orange-400/10 blur-2xl" />
      <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${state.chip}`}>
            <span className="relative flex h-2 w-2">
              {running && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${state.dot}`} />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${state.dot}`} />
            </span>
            {state.label}
          </span>
          <p className="mt-3 flex items-center gap-3 text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 md:text-5xl">
            <Timer size={32} className="text-brand-600" /> {fmtDuration(secs)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {me?.checkIn ? <>Last session: checked in at <b className="text-slate-700">{me.checkIn}</b>{me.checkOut && <> · checked out at <b className="text-slate-700">{me.checkOut}</b></>}</> : 'Start your day to begin tracking work hours'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Check-in and check-out available 10:00 AM–8:30 PM IST.</p>
          <div className="mt-4 max-w-md">
            <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-400"><span>Shift progress</span><span>{pct.toFixed(0)}% of 8h</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sun-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
            {!running && (
              <label className="mt-4 block max-w-md text-xs font-semibold text-slate-600">
                Optional check-in photo (JPEG, PNG, or WebP; up to 5 MB)
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="input mt-1" onChange={(event) => setPhoto(event.target.files?.[0] || null)} />
              </label>
            )}
            {latestSession?.photoUrl && <a className="mt-2 inline-block text-xs font-semibold text-brand-700 underline" href={latestSession.photoUrl} target="_blank" rel="noreferrer">View latest check-in photo</a>}
            {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
          </div>
        </div>
        <div className="flex gap-3 md:flex-col">
          {running ? (
            <button className="btn-primary flex-1 !bg-none !bg-rose-600 !shadow-rose-500/30 !py-3" disabled={!withinWorkingHours} onClick={checkOut}><LogOut size={18} /> Check-out</button>
          ) : (
            <button className="btn-primary flex-1 !py-3" disabled={saving || !withinWorkingHours} onClick={checkIn}><LogIn size={18} /> {saving ? 'Checking in…' : 'Check-in'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
