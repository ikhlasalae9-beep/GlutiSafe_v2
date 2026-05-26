import { BrainCircuit, CalendarClock, FileText, Sparkles } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminChartCard from './AdminChartCard.jsx';
import AdminStatCard from './AdminStatCard.jsx';

export default function AdminAiUsagePage({ aiUsage }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Sparkles} label="Explications IA générées" value={aiUsage.explanationsGenerated} />
        <AdminStatCard icon={FileText} label="Analyses avec explication" value={aiUsage.analysesWithExplanation} />
        <AdminStatCard icon={CalendarClock} label="Dernière utilisation IA" value={formatDate(aiUsage.latestAiUse)} />
        <AdminStatCard icon={BrainCircuit} label="Fournisseur IA utilisé" value={aiUsage.provider} />
      </section>

      <section className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
        Le suivi détaillé de l’utilisation IA n’est pas encore activé.
      </section>

      <AdminChartCard title="Utilisation IA dans le temps" subtitle="Estimée depuis les analyses avec explication">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aiUsage.usageByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#008f45" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminChartCard>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Dernières explications IA</h2>
        <div className="mt-4 grid gap-3">
          {aiUsage.latestExplanations.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucune explication IA enregistrée.</p> : null}
          {aiUsage.latestExplanations.map((analysis) => (
            <article key={analysis.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
              <p className="font-black text-[#1d252b]">{analysis.label}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{analysis.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
