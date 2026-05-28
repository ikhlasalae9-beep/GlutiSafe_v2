import { AlertTriangle, CheckCircle2, Clock3, Crown, ScanLine, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AdminChartCard from './AdminChartCard.jsx';
import AdminStatCard from './AdminStatCard.jsx';

const COLORS = ['#008f45', '#d97706', '#dc2626', '#64748b', '#004b3a', '#94a3b8'];

export default function AdminOverviewPage({ dashboard }) {
  const stats = dashboard.scanStats;
  const recentRequests = dashboard.latestPendingRequests || [];
  const packDistribution = dashboard.packDistribution || [];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <AdminStatCard icon={UserRound} label="Total utilisateurs" value={dashboard.usersCount} />
        <AdminStatCard icon={UserRound} label="Utilisateurs Free" value={dashboard.freeUsersCount} />
        <AdminStatCard icon={Clock3} label="Demandes en attente" value={dashboard.pendingPaymentRequestsCount} />
        <AdminStatCard icon={WalletCards} label="Packs mensuels actifs" value={dashboard.activeMonthlyCount} />
        <AdminStatCard icon={Crown} label="Packs annuels actifs" value={dashboard.activeYearlyCount} />
        <AdminStatCard icon={ScanLine} label="Total scans" value={dashboard.scansCount} />
        <AdminStatCard icon={AlertTriangle} label="Scans avec gluten" value={stats.glutenCount} tone="red" />
        <AdminStatCard icon={CheckCircle2} label="Scans sans gluten detecte" value={stats.noGlutenCount} tone="green" />
        <AdminStatCard icon={ShieldCheck} label="Risques possibles" value={stats.possibleRiskCount} />
        <AdminStatCard icon={ShieldCheck} label="Statut plateforme" value={dashboard.platformStatus} tone="green" />
        <AdminStatCard icon={Crown} label="Admin principal" value={dashboard.mainAdmin} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Demandes recentes">
          <div className="grid gap-3">
            {recentRequests.length === 0 ? <Empty>Aucune demande en attente.</Empty> : null}
            {recentRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#1d252b]">{request.userName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{request.userEmail || '-'}</p>
                  </div>
                  <Badge>{formatDateTime(request.createdAt)}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{request.packLabel}</Badge>
                  <Badge>{request.paymentMethod === 'cashplus' ? 'CashPlus' : 'RIB'}</Badge>
                  <Badge>{request.amount ?? '-'} MAD</Badge>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Repartition des packs">
          <div className="grid gap-3">
            {packDistribution.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3">
                <span className="text-sm font-bold text-slate-700">{item.label}</span>
                <span className="text-lg font-black text-[#1d252b]">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Activite recente">
          <div className="grid gap-3">
            {dashboard.latestAnalyses.slice(0, 5).length === 0 ? <Empty>Aucune analyse enregistree.</Empty> : null}
            {dashboard.latestAnalyses.slice(0, 5).map((analysis) => (
              <article key={analysis.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#1d252b]">{analysis.productName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{analysis.userName} - {analysis.userEmail || '-'}</p>
                  </div>
                  <Badge>{analysis.status}</Badge>
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">{formatDateTime(analysis.createdAt)}</p>
              </article>
            ))}
          </div>
        </Panel>

        <AdminChartCard title="Scans par statut" subtitle="Repartition globale des resultats">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.scansByStatus} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {stats.scansByStatus.map((item, index) => (
                    <Cell key={item.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AdminChartCard>
      </section>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-[1.25rem] border border-[#dfe8df] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-[#1d252b]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function Empty({ children }) {
  return <p className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-5 text-center text-sm font-bold text-slate-500">{children}</p>;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
