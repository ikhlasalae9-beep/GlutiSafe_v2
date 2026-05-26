export default function AdminStatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  const toneClass = tone === 'green' ? 'bg-[#e8f4e8] text-[#008f45]' : tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-white text-[#008f45]';

  return (
    <article className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-3 break-words text-3xl font-extrabold text-[#1d252b]">{value}</p>
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
