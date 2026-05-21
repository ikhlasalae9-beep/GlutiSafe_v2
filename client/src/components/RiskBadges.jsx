export default function RiskBadges({ detectedWords = [], possibleWords = [], safeClaims = [] }) {
  const hasWords = detectedWords.length > 0 || possibleWords.length > 0 || safeClaims.length > 0;

  if (!hasWords) {
    return <p className="text-sm text-slate-500">Aucun mot surveillé détecté.</p>;
  }

  return (
    <div className="space-y-3">
      {detectedWords.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-red-700">Mots directs</p>
          <div className="flex flex-wrap gap-2">
            {detectedWords.map((word) => (
              <span key={word} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      {possibleWords.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-amber-700">Termes à vérifier</p>
          <div className="flex flex-wrap gap-2">
            {possibleWords.map((word) => (
              <span key={word} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      {safeClaims.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Mentions rassurantes détectées</p>
          <div className="flex flex-wrap gap-2">
            {safeClaims.map((word) => (
              <span key={word} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
