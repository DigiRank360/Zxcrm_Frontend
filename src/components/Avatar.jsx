const palette = [
  'from-brand-500 to-brand-700',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-violet-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
]

export default function Avatar({ name = '?', size = 'h-9 w-9', className = '' }) {
  const color = palette[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length]
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-sm ${color} ${className}`}>
      {initials}
    </span>
  )
}

export function Person({ name, sub }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}
