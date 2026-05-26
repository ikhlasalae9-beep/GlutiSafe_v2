import { CheckCircle2, Image, ScanLine, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../lib/auth.js';
import { deleteAnalysis, getHistory, isSafeHistoryItem } from '../lib/history.js';
import { getStatusStyle } from '../lib/status.js';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const currentUser = await getStoredUser();
      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      const rows = await getHistory();
      if (active) setHistory(rows);
    }

    loadHistory().catch((loadError) => {
      if (active) setError(loadError.message || "Impossible de charger l'historique.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDelete = async (id) => {
    try {
      setHistory(await deleteAnalysis(id));
    } catch (deleteError) {
      setError(deleteError.message || "Impossible de supprimer l'analyse.");
    }
  };

  return (
    <div className="page-shell page-section">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="brand-kicker">Historique</p>
          <h1 className="mt-2 brand-heading">Analyses sauvegardées</h1>
          <p className="mt-3 brand-copy max-w-2xl">Consultez les résultats sauvegardés pour ce profil.</p>
        </div>
        <button type="button" onClick={() => navigate('/analyse')} className="primary-btn">
          <ScanLine className="h-4 w-4" aria-hidden="true" />
          Nouvelle analyse
        </button>
      </div>

      {error ? <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

      {history.length === 0 ? (
        <section className="surface-card grid min-h-80 place-items-center p-8 text-center">
          <div>
            <Image className="mx-auto h-12 w-12 text-[#a8cfa5]" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-extrabold text-[#1d252b]">Aucune analyse pour le moment</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Les analyses réalisées avec votre compte apparaîtront ici.
            </p>
          </div>
        </section>
      ) : (
        <section className="grid gap-4">
          {history.map((item) => {
            const isSafe = isSafeHistoryItem(item);
            const status = item.analysis?.status || item.status;
            const style = getStatusStyle(status);
            const StatusIcon = isSafe ? CheckCircle2 : ShieldAlert;

            return (
              <article key={item.id} className="surface-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                    <HistoryThumbnail item={item} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`status-pill ${style.badge}`}>
                          <StatusIcon className="h-4 w-4" aria-hidden="true" />
                          {item.analysis?.label || style.label}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{formatDate(item)}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{formatIngredients(item)}</p>
                      <WordBadges item={item} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="secondary-btn border-red-200 text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    aria-label="Supprimer cette analyse"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Supprimer
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function formatDate(item) {
  const value = item.createdAt || item.date || item.id || Date.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatIngredients(item) {
  if (Array.isArray(item.ingredients)) return item.ingredients.join(', ');
  if (typeof item.ingredients === 'string' && item.ingredients.trim()) return item.ingredients;
  return item.fullText || item.textPreview || 'Aucun ingrédient enregistré';
}

function getWords(item) {
  const detected = item.analysis?.detectedWords || [];
  const possible = item.analysis?.possibleWords || [];
  return [...detected, ...possible];
}

function WordBadges({ item }) {
  const words = getWords(item);
  if (words.length === 0) {
    return <p className="mt-2 text-xs font-bold text-slate-500">Aucun mot surveillé</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {words.slice(0, 8).map((word) => (
        <span key={word} className="rounded-full border border-[#dfe8df] bg-[#f7f8f6] px-3 py-1 text-xs font-bold text-slate-600">
          {word}
        </span>
      ))}
    </div>
  );
}

function HistoryThumbnail({ item }) {
  const src = item.imageData || item.imagePreview || item.preview || item.imageUrl;

  if (src) {
    return (
      <img
        src={src}
        alt="Étiquette sauvegardée"
        className="h-36 w-full shrink-0 rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] object-cover sm:h-28 sm:w-32"
        loading="lazy"
      />
    );
  }

  return (
    <span className="flex h-36 w-full shrink-0 items-center justify-center rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] text-[#008f45] sm:h-28 sm:w-32">
      <Image className="h-8 w-8" aria-hidden="true" />
    </span>
  );
}
