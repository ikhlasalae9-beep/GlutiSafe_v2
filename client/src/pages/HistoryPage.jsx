import { CheckCircle2, Image, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../lib/auth.js';
import { deleteAnalysis, getHistory, isSafeHistoryItem } from '../lib/history.js';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    setHistory(getHistory(currentUser));
  }, [navigate]);

  const handleDelete = (id) => {
    setHistory(deleteAnalysis(id));
  };

  const formatDate = (item) => {
    if (item.date) return item.date;

    const fallbackDate = new Date(item.id || Date.now());
    return fallbackDate.toLocaleDateString();
  };

  const formatIngredients = (item) => {
    if (Array.isArray(item.ingredients)) {
      return item.ingredients.join(', ');
    }

    if (typeof item.ingredients === 'string' && item.ingredients.trim()) {
      return item.ingredients;
    }

    return item.fullText || item.textPreview || 'Aucun ingrédient enregistré';
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">History</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Previously analyzed products</h1>
          </div>
          <p className="max-w-xl leading-7 text-slate-600">
            Review past product checks, gluten status, and quick nutrition summaries.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-100">
                <tr>
                  {['Produit', 'Thumbnail', 'Status', 'Ingrédients', 'Actions'].map((heading) => (
                    <th key={heading} scope="col" className="px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {history.map((item) => {
                  const isSafe = isSafeHistoryItem(item);
                  const StatusIcon = isSafe ? CheckCircle2 : ShieldAlert;
                  const productName = item.name || 'Produit Scanné';
                  const dateLabel = formatDate(item);
                  const ingredients = formatIngredients(item);

                  return (
                    <tr key={item.id} className="transition hover:bg-cyan-50/40">
                      <td className="whitespace-nowrap px-5 py-4 align-middle">
                        <p className="font-bold text-slate-900">{productName}</p>
                        <p className="mt-1 text-sm text-slate-500">{dateLabel}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex h-14 w-16 items-center justify-center rounded-lg border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50">
                          <Image className="h-6 w-6 text-teal-600" aria-hidden="true" />
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${
                            isSafe ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {isSafe ? 'Safe' : 'Danger'}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <p className="line-clamp-2 max-w-md text-sm leading-6 text-slate-600">{ingredients}</p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
                          aria-label={`Delete ${productName}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {history.length === 0 ? (
            <div className="border-t border-slate-200 px-5 py-12 text-center">
              <p className="text-lg font-black text-slate-950">No saved analyses</p>
              <p className="mt-2 text-sm text-slate-500">Your saved scans will appear here for this signed-in email only.</p>
            </div>
          ) : null}
        </section>
    </div>
  );
}
