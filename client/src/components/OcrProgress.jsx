export default function OcrProgress({ progress, error, active }) {
  if (!progress && !error && !active) return null;

  const width = `${Math.max(progress, active ? 38 : 0)}%`;

  return (
    <div className="soft-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1d252b]">Progression OCR</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">EasyOCR lit le texte visible sur l'image.</p>
        </div>
        <p className="text-sm font-bold text-[#008f45]">{active ? 'En cours' : `${progress}%`}</p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf3ed]">
        <div className="h-full rounded-full bg-[#008f45] transition-all duration-500" style={{ width }} />
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
