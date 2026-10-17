export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

export const hoursBetween = (inTime, outTime) => {
  if (!inTime || !outTime) return 0
  const [h1, m1] = inTime.split(':').map(Number)
  const [h2, m2] = outTime.split(':').map(Number)
  return Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60)
}

// Quarterly schedule: every 3 months from installation date, for one year
export const generateQuarterlySchedule = (installDate, count = 4) => {
  const base = new Date(installDate)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() + 3 * (i + 1))
    return d.toISOString().slice(0, 10)
  })
}

export const daysUntil = (date) =>
  Math.ceil((new Date(date) - new Date()) / 86400000)

export const roundRobinAssign = (leads, agents) => {
  const active = agents.filter((a) => a.active)
  if (!active.length) return leads
  let i = 0
  return leads.map((l) => (l.agentId ? l : { ...l, agentId: active[i++ % active.length].id }))
}

export const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000))

export const parseCsv = (text) => {
  const [head, ...rows] = text.trim().split(/\r?\n/)
  const keys = head.split(',').map((k) => k.trim().toLowerCase())
  return rows.map((r, i) => {
    const v = r.split(',').map((x) => x.trim())
    const o = Object.fromEntries(keys.map((k, j) => [k, v[j]]))
    return { id: Date.now() + i, name: o.name, phone: o.phone, source: 'CSV', status: 'New', agentId: null, date: new Date().toISOString().slice(0, 10), followUp: '' }
  })
}

const TZ = 'Asia/Kolkata'
export const istTime = (d = new Date()) => d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
export const istDate = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ })

// seconds worked in a session; open sessions keep counting against `now`
export const workedSeconds = (row, now = new Date()) => {
  if (!row?.checkIn) return 0
  const start = row.checkInAt ? new Date(row.checkInAt) : new Date(`${istDate(now)}T${row.checkIn}:00+05:30`)
  if (row.checkOut) {
    if (row.checkInAt && row.checkOutAt) return Math.max(0, (new Date(row.checkOutAt) - start) / 1000)
    return hoursBetween(row.checkIn, row.checkOut) * 3600
  }
  return Math.max(0, (now - start) / 1000)
}

export const fmtDuration = (sec) => {
  const s = Math.floor(sec)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}
