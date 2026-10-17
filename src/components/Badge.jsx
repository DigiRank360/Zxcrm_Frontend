const colors = {
  New: 'bg-blue-50 text-blue-700 ring-blue-200',
  Interested: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Busy: 'bg-amber-50 text-amber-700 ring-amber-200',
  'Not Picked': 'bg-orange-50 text-orange-700 ring-orange-200',
  'Not Interested': 'bg-rose-50 text-rose-700 ring-rose-200',
  Converted: 'bg-green-50 text-green-700 ring-green-200',
  Present: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Half-day': 'bg-amber-50 text-amber-700 ring-amber-200',
  Absent: 'bg-rose-50 text-rose-700 ring-rose-200',
  'On-field': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Completed: 'bg-green-50 text-green-700 ring-green-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inactive: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export default function Badge({ children }) {
  return (
    <span className={`inline-flex h-fit w-fit shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors[children] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}
