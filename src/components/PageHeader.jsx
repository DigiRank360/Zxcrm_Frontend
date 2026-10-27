export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-7 flex animate-fadeUp flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            {eyebrow}
          </span>
        )}
        <h1 className="bg-gradient-to-r from-brand-900 to-brand-600 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-2xl lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex w-full flex-wrap gap-2 sm:w-auto">{children}</div>}
    </div>
  )
}
