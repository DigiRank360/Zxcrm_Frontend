const tones = {
  brand: 'from-brand-500 to-brand-700 shadow-brand-200',
  green: 'from-emerald-400 to-emerald-600 shadow-emerald-200',
  amber: 'from-amber-400 to-orange-500 shadow-amber-200',
  rose: 'from-rose-400 to-rose-600 shadow-rose-200',
}

export default function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  return (
    <div className="card card-hover relative flex animate-fadeUp items-center gap-4 overflow-hidden">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 ${tones[tone]}`} />
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tones[tone]}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="relative">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-slate-900">{value}</p>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  )
}
