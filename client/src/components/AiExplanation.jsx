import { Sparkles } from 'lucide-react';

export default function AiExplanation({ explanation, loading }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="text-emerald-600" size={20} />
        <h3 className="text-lg font-black text-slate-950">Explication IA</h3>
      </div>
      <p className="text-sm leading-6 text-slate-600">{loading ? 'Préparation d’une explication prudente...' : explanation}</p>
    </section>
  );
}
