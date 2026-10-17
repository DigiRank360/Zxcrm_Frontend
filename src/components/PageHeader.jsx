export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-7 flex animate-fadeUp flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {eyebrow}
          </span>
        )}
        <h1 className="bg-gradient-to-r from-brand-900 to-brand-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
