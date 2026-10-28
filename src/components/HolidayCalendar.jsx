import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCrm } from '../utils/CrmContext'
import { istDate } from '../utils/helpers'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad = (n) => String(n).padStart(2, '0')

// attendanceByDate: { 'YYYY-MM-DD': status } for the signed-in employee (omit for admin/hr views)
export default function HolidayCalendar({ canManage, attendanceByDate }) {
  const { holidays, addHoliday, removeHoliday } = useCrm()
  const today = istDate()
  const [cursor, setCursor] = useState(today.slice(0, 7))
  const [form, setForm] = useState({ date: '', name: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [year, month] = cursor.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const holidayByDate = new Map(holidays.map((item) => [item.date, item]))
  const monthHolidays = holidays.filter((item) => item.date.startsWith(`${cursor}-`))
  const upcoming = holidays.filter((item) => item.date >= today).slice(0, 5)
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  const shift = (delta) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1))
    setCursor(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}`)
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await addHoliday({ date: form.date, name: form.name })
      setForm({ date: '', name: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    setError('')
    try { await removeHoliday(id) } catch (err) { setError(err.message) }
  }

  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => `${cursor}-${pad(index + 1)}`),
  ]

  const cellTone = (date) => {
    const holiday = holidayByDate.get(date)
    const sunday = new Date(`${date}T00:00:00Z`).getUTCDay() === 0
    const status = attendanceByDate?.[date]
    if (holiday) return 'border-rose-200 bg-rose-50 text-rose-800'
    if (status === 'Present' || status === 'On-field') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    if (status) return 'border-amber-200 bg-amber-50 text-amber-800'
    if (sunday) return 'border-slate-200 bg-slate-100 text-slate-500'
    return 'border-slate-200 bg-white text-slate-700'
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><CalendarDays size={18} /> Holiday calendar</h2>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <span className="min-w-36 text-center text-sm font-semibold">{monthLabel}</span>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {WEEKDAYS.map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, index) => date ? (
              <div key={date} title={holidayByDate.get(date)?.name || attendanceByDate?.[date] || ''} className={`min-h-14 rounded-lg border p-1 text-xs ${cellTone(date)} ${date === today ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="font-bold">{Number(date.slice(8))}</div>
                <div className="truncate text-[10px] leading-tight">{holidayByDate.get(date)?.name || attendanceByDate?.[date] || ''}</div>
              </div>
            ) : <div key={`blank-${index}`} />)}
          </div>
          <p className="mt-2 text-xs text-slate-500">Red = holiday, grey = Sunday off{attendanceByDate ? ', green = present, amber = other status' : ''}. Holidays are paid and not counted as absences in payroll.</p>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-bold text-slate-800">This month</h3>
            {monthHolidays.length === 0 && <p className="text-sm text-slate-500">No holidays defined.</p>}
            <ul className="space-y-1">
              {monthHolidays.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-2 py-1 text-sm">
                  <span><b>{item.date.slice(8)}</b> · {item.name}</span>
                  {canManage && <button type="button" aria-label={`Delete ${item.name}`} onClick={() => remove(item.id)} className="text-rose-600 hover:text-rose-800"><Trash2 size={14} /></button>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-bold text-slate-800">Upcoming</h3>
            {upcoming.length === 0 && <p className="text-sm text-slate-500">Nothing upcoming.</p>}
            <ul className="space-y-1 text-sm text-slate-700">
              {upcoming.map((item) => <li key={item.id}>{item.date} · {item.name}</li>)}
            </ul>
          </div>
          {canManage && (
            <form onSubmit={submit} className="space-y-2 border-t border-slate-200 pt-3">
              <h3 className="text-sm font-bold text-slate-800">Add holiday</h3>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              <input required maxLength={100} placeholder="Holiday name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
              <button disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"><Plus size={14} /> {saving ? 'Adding…' : 'Add holiday'}</button>
            </form>
          )}
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        </div>
      </div>
    </section>
  )
}
