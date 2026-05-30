const STEP_LABELS = [
  'Préparation de l’image...',
  'Lecture de l’étiquette...',
  'Vérification du texte...',
  'Résultat prêt',
];

export default function OcrProgress({ progress, error, active, step }) {
  if (!progress && !error && !active) return null;

  const width = `${Math.max(progress, active ? 38 : 0)}%`;
  const currentStep = step || (active ? 'Lecture de l’étiquette...' : progress >= 100 ? 'Résultat prêt' : '');

  return (
    <div className="soft-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1d252b]">Analyse des ingrédients</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{currentStep || 'Lecture de l’étiquette'}</p>
        </div>
        <p className="text-sm font-bold text-[#008f45]">{error ? 'À reprendre' : `${Math.min(progress, 100)}%`}</p>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf3ed]">
        <div className="h-full rounded-full bg-[#008f45] transition-all duration-500" style={{ width }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {STEP_LABELS.map((label) => {
          const complete = STEP_LABELS.indexOf(label) <= STEP_LABELS.indexOf(currentStep);
          return (
            <div key={label} className={`rounded-xl px-3 py-2 text-xs font-bold ${complete ? 'bg-emerald-50 text-emerald-800' : 'bg-[#f7f8f6] text-slate-500'}`}>
              {label}
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">{error}</p> : null}
    </div>
  );
}
