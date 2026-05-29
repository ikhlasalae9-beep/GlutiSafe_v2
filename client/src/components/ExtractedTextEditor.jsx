import { RotateCcw, ShieldCheck } from 'lucide-react';

export default function ExtractedTextEditor({ title = 'Corriger le texte détecté', text, onChange, onAnalyze, onReset, loading }) {
  return (
    <div className="soft-card p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#1d252b]">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">Vérifiez les ingrédients lus ou saisissez-les manuellement avant l’analyse.</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#008f45]">{String(text || '').length} caractères</span>
      </div>
      <textarea
        value={text}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Collez ou corrigez ici la liste complète des ingrédients."
        className="field-control min-h-52 resize-y leading-6"
        aria-label={title}
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onAnalyze} disabled={loading || !String(text || '').trim()} className="primary-btn flex-1">
          <ShieldCheck size={19} aria-hidden="true" />
          {loading ? 'Analyse en cours...' : 'Analyser les ingrédients'}
        </button>
        <button type="button" onClick={onReset} className="secondary-btn">
          <RotateCcw size={18} aria-hidden="true" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
