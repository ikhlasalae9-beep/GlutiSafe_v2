export default function OcrProgress({ progress, error, active }) {
  if (!progress && !error && !active) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black text-slate-950">Progression OCR</p>
        <p className="text-sm font-bold text-emerald-700">{active ? 'EasyOCR' : `${progress}%`}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(progress, active ? 35 : 0)}%` }} />
      </div>
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
