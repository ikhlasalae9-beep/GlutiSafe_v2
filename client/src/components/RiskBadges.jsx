export default function RiskBadges({ detectedWords = [], possibleWords = [], safeClaims = [] }) {
  const hasWords = detectedWords.length > 0 || possibleWords.length > 0 || safeClaims.length > 0;

  if (!hasWords) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        Aucun mot surveillé lié au gluten n'a été détecté dans le texte analysé.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <BadgeGroup
        title="Mots directs"
        tone="red"
        words={detectedWords}
        emptyLabel="Aucun ingrédient direct détecté"
      />
      <BadgeGroup
        title="Termes à vérifier"
        tone="amber"
        words={possibleWords}
        emptyLabel="Aucun terme ambigu détecté"
      />
      <BadgeGroup
        title="Mentions rassurantes"
        tone="emerald"
        words={safeClaims}
        emptyLabel="Aucune mention rassurante détectée"
      />
    </div>
  );
}

function BadgeGroup({ title, words, tone, emptyLabel }) {
  const tones = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
      {words.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {words.map((word) => (
            <span key={word} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${tones[tone]}`}>
              {word}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      )}
    </div>
  );
}
