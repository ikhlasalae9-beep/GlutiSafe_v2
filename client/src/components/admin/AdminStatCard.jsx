export default function AdminStatCard({ icon: Icon, label, value, hint, tone = 'default', delay = 0 }) {
  const toneClass = tone === 'green' ? 'bg-[#e8f4e8] text-[#008f45]' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-[#f0f7f1] text-[#008f45]';

  return (
    <article className="admin-card admin-card-hover admin-stagger min-h-[130px] p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex h-full items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-5 text-slate-500">{label}</p>
          <p className="mt-4 overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-extrabold leading-tight text-[#1d252b]" title={String(value ?? '-')}>
            {value ?? '-'}
          </p>
          {hint ? <p className="mt-2 text-xs font-semibold text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
