import { Eye, Trash2 } from 'lucide-react';
import { statusStyles } from '../lib/status.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function HistoryPanel({ items, selected, onSelect, onDelete, onClear }) {
  if (selected) return null;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Historique des analyses</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
          Aucune analyse sauvegardée pour le moment. Les prochains résultats peuvent être conservés localement sur cet
          appareil.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Historique des analyses</h2>
          <p className="mt-1 text-sm text-slate-600">Analyses sauvegardées localement sur cet appareil.</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700">
          Effacer l’historique
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const style = statusStyles[item.analysis.status] || statusStyles.INSUFFICIENT_INFO;
          return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${style.badge}`}>{item.analysis.label}</span>
                    <span className="text-xs font-bold text-slate-500">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-700">{item.textPreview}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    Mots détectés : {[...item.analysis.detectedWords, ...item.analysis.possibleWords].join(', ') || 'aucun'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-700 shadow-sm"
                  >
                    <Eye size={17} />
                    Détails
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-black text-red-700"
                  >
                    <Trash2 size={17} />
                    Supprimer
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
