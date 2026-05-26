import { AlertTriangle, CheckCircle2, Crown, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminChartCard from './AdminChartCard.jsx';
import AdminStatCard from './AdminStatCard.jsx';

const COLORS = ['#008f45', '#d97706', '#dc2626', '#64748b', '#004b3a'];

export default function AdminOverviewPage({ dashboard }) {
  const stats = dashboard.scanStats;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={UserRound} label="Total utilisateurs" value={dashboard.usersCount} />
        <AdminStatCard icon={ScanLine} label="Total scans" value={dashboard.scansCount} />
        <AdminStatCard icon={AlertTriangle} label="Scans avec gluten" value={stats.glutenCount} tone="red" />
        <AdminStatCard icon={CheckCircle2} label="Scans sans gluten détecté" value={stats.noGlutenCount} tone="green" />
        <AdminStatCard icon={ShieldCheck} label="Risques possibles" value={stats.possibleRiskCount} />
        <AdminStatCard icon={ShieldCheck} label="Statut plateforme" value={dashboard.platformStatus} tone="green" />
        <AdminStatCard icon={Crown} label="Admin principal" value={dashboard.mainAdmin} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminChartCard title="Scans par statut" subtitle="Répartition globale des résultats">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.scansByStatus} dataKey="count" nameKey="status" innerRadius={64} outerRadius={96} paddingAngle={3}>
                  {stats.scansByStatus.map((item, index) => (
                    <Cell key={item.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AdminChartCard>

        <AdminChartCard title="Scans dans le temps" subtitle="Activité quotidienne">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.scansPerDay}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#008f45" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminChartCard>
      </section>

      <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#1d252b]">Dernières analyses</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {dashboard.latestAnalyses.length === 0 ? <p className="text-sm font-bold text-slate-500">Aucune analyse enregistrée.</p> : null}
          {dashboard.latestAnalyses.map((analysis) => (
            <article key={analysis.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#1d252b]">{analysis.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{analysis.userName}</p>
                </div>
                <span className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{analysis.status}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">{formatDateTime(analysis.createdAt)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
