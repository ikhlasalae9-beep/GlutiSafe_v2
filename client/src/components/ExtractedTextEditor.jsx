import { RotateCcw, ShieldCheck } from 'lucide-react';

export default function ExtractedTextEditor({ title = 'Texte extrait', text, onChange, onAnalyze, onReset, loading }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">Corrigez le texte si nécessaire avant l’analyse.</p>
      </div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Collez ou corrigez ici la liste complète des ingrédients."
        className="min-h-48 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none ring-emerald-500/20 focus:border-emerald-500 focus:ring-4"
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="primary-btn inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-4 font-black disabled:opacity-55"
        >
          <ShieldCheck size={19} />
          {loading ? 'Analyse en cours' : 'Analyser les ingrédients'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="secondary-btn inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-black"
        >
          <RotateCcw size={18} />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
