import { CheckCircle2, Image, ScanLine, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../lib/auth.js';
import { deleteAnalysis, getHistory, isSafeHistoryItem } from '../lib/history.js';
import { getSignedAnalysisImageUrl } from '../lib/storage.js';
import { getStatusStyle } from '../lib/status.js';
import { onUserScopedStateCleared } from '../lib/userScopedState.js';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [error, setError] = useState('');

  useEffect(() => onUserScopedStateCleared(() => {
    setHistory([]);
    setImageUrls({});
    setError('');
  }), []);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      const currentUser = await getStoredUser();
      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      const rows = await getHistory();
      if (!active) return;
      setHistory(rows);
      setImageUrls(await resolveSignedUrls(rows));
    }

    loadHistory().catch((loadError) => {
      if (active) setError(loadError.message || "Impossible de charger l'historique.");
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDelete = async (item) => {
    const confirmed = window.confirm('Supprimer cette analyse ? Cette action est irréversible.');
    if (!confirmed) return;

    try {
      const nextHistory = await deleteAnalysis(item.id, item.imagePath);
      setHistory(nextHistory);
      setImageUrls(await resolveSignedUrls(nextHistory));
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
          <p className="mt-3 brand-copy max-w-2xl">Consultez les produits analysés et les résultats sauvegardés pour ce profil.</p>
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
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} imageUrl={imageUrls[item.id]} onDelete={() => handleDelete(item)} />
          ))}
        </section>
      )}
    </div>
  );
}

function HistoryCard({ item, imageUrl, onDelete }) {
  const isSafe = isSafeHistoryItem(item);
  const status = item.analysis?.status || item.status;
  const style = getStatusStyle(status);
  const StatusIcon = isSafe ? CheckCircle2 : ShieldAlert;

  return (
    <article className="surface-card p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-[144px_1fr_auto] md:items-center">
        <HistoryThumbnail imageUrl={imageUrl} productName={item.productName} />

        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold text-[#1d252b]">{item.productName || 'Produit sans nom'}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`status-pill ${style.badge}`}>
              <StatusIcon className="h-4 w-4" aria-hidden="true" />
              {item.analysis?.label || style.label}
            </span>
            <span className="text-xs font-bold text-slate-500">{formatDate(item)}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{formatIngredients(item)}</p>
          <WordBadges item={item} />
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="secondary-btn border-red-200 text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 md:self-start"
          aria-label="Supprimer cette analyse"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Supprimer
        </button>
      </div>
    </article>
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

function HistoryThumbnail({ imageUrl, productName }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={productName || 'Produit analysé'}
        className="aspect-[4/3] w-full rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] object-cover md:h-32"
        loading="lazy"
      />
    );
  }

  return (
    <span className="flex aspect-[4/3] w-full items-center justify-center rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] text-[#008f45] md:h-32">
      <Image className="h-8 w-8" aria-hidden="true" />
    </span>
  );
}

async function resolveSignedUrls(rows) {
  const entries = await Promise.all(
    rows.map(async (item) => {
      if (!item.imagePath) return [item.id, ''];

      try {
        return [item.id, await getSignedAnalysisImageUrl(item.imagePath)];
      } catch {
        return [item.id, ''];
      }
    }),
  );

  return Object.fromEntries(entries);
}
