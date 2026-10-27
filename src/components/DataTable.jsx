export default function DataTable({ columns, rows, empty = 'No records found' }) {
  return (
    <div className="animate-fadeUp overflow-x-auto rounded-2xl border border-white/80 bg-white/90 shadow-soft ring-1 ring-slate-900/5">
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>{columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="transition odd:bg-slate-50/40 hover:bg-brand-50/60">
              {columns.map((c) => <td key={c.key} className="td">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={columns.length} className="td py-12 text-center text-slate-400">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
