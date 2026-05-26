import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const STATUSES = ['all', 'CONTAINS_GLUTEN', 'POSSIBLE_RISK', 'NO_GLUTEN_DETECTED', 'INSUFFICIENT_INFO'];

export default function AdminAnalysesPage({ analyses }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return analyses.filter((analysis) => {
      const haystack = `${analysis.userName} ${analysis.userEmail} ${analysis.productName} ${analysis.ocrText}`.toLowerCase();
      const date = analysis.createdAt ? analysis.createdAt.slice(0, 10) : '';
      return (
        (!query || haystack.includes(query)) &&
        (status === 'all' || analysis.status === status) &&
        (!dateFrom || date >= dateFrom) &&
        (!dateTo || date <= dateTo)
      );
    });
  }, [analyses, search, status, dateFrom, dateTo]);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:border-[#008f45] focus:ring-4 focus:ring-[#a8cfa5]/30" placeholder="Nom, email ou texte OCR" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none">
            {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm font-bold outline-none" />
        </div>
      </section>

      <section className="grid gap-3">
        {filtered.length === 0 ? <Empty text="Aucune analyse ne correspond aux filtres." /> : null}
        {filtered.slice(0, 100).map((analysis) => (
          <article key={analysis.id} className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{analysis.status}</Badge>
                  <span className="text-sm font-bold text-[#1d252b]">{analysis.label}</span>
                  <span className="text-xs font-semibold text-slate-500">{analysis.inputType}</span>
                </div>
                <p className="mt-2 text-base font-black text-[#1d252b]">{analysis.productName || 'Produit sans nom'}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{analysis.userName} {analysis.userEmail ? `(${analysis.userEmail})` : ''}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{analysis.ocrText || 'Aucun texte OCR enregistré.'}</p>
                <WordList words={analysis.detectedWords} />
              </div>
              <div className="flex flex-col gap-2 lg:items-end">
                <p className="text-xs font-bold text-slate-500">{formatDateTime(analysis.createdAt)}</p>
                <button type="button" onClick={() => setSelectedAnalysis(analysis)} className="rounded-2xl bg-[#008f45] px-4 py-2 text-sm font-black text-white hover:bg-[#004b3a]">Voir détails</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <AnalysisModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />
    </div>
  );
}

function AnalysisModal({ analysis, onClose }) {
  if (!analysis) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d252b]/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[1.25rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="brand-kicker">Détail analyse</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#1d252b]">{analysis.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-[#dfe8df] text-slate-500"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 grid gap-4">
          <Detail title="Texte OCR" value={analysis.ocrText || '-'} />
          <Detail title="Mots détectés" value={(analysis.detectedWords || []).join(', ') || '-'} />
          <Detail title="Mots possibles" value={(analysis.possibleWords || []).join(', ') || '-'} />
          <Detail title="Mentions sûres" value={(analysis.safeClaims || []).join(', ') || '-'} />
          <Detail title="Explication" value={analysis.explanation || '-'} />
          <Detail title="Confiance" value={analysis.confidence || '-'} />
        </div>
      </section>
    </div>
  );
}

function Detail({ title, value }) {
  return <div className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#1d252b]">{value}</p></div>;
}

function WordList({ words = [] }) {
  if (!words.length) return null;
  return <div className="mt-3 flex flex-wrap gap-2">{words.slice(0, 8).map((word) => <span key={word} className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">{word}</span>)}</div>;
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#dfe8df] bg-[#f7f8f6] px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function Empty({ text }) {
  return <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">{text}</section>;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
