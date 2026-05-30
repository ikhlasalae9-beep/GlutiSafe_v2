import { AlertTriangle, CheckCircle2, Clock3, Crown, ScanLine, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AdminChartCard from './AdminChartCard.jsx';
import AdminStatCard from './AdminStatCard.jsx';

const COLORS = ['#008f45', '#d97706', '#dc2626', '#64748b', '#004b3a', '#94a3b8'];

export default function AdminOverviewPage({ dashboard }) {
  const stats = dashboard.scanStats;
  const recentRequests = dashboard.latestPendingRequests || [];
  const packDistribution = dashboard.packDistribution || [];
  const recentAnalyses = (dashboard.latestAnalyses || []).slice(0, 5);

  return (
    <div className="space-y-8">
      <KpiSection
        title="Vue generale"
        subtitle="Les indicateurs essentiels pour piloter la plateforme."
        cards={[
          { icon: UserRound, label: 'Total utilisateurs', value: dashboard.usersCount },
          { icon: Clock3, label: 'Demandes en attente', value: dashboard.pendingPaymentRequestsCount },
          { icon: ScanLine, label: 'Total analyses', value: dashboard.scansCount },
          { icon: ShieldCheck, label: 'Statut plateforme', value: dashboard.platformStatus, tone: 'green' },
        ]}
      />

      <KpiSection
        title="Packs"
        subtitle="Repartition rapide des abonnements actifs."
        columns="xl:grid-cols-3"
        cards={[
          { icon: UserRound, label: 'Utilisateurs Free', value: dashboard.freeUsersCount },
          { icon: WalletCards, label: 'Packs mensuels actifs', value: dashboard.activeMonthlyCount },
          { icon: Crown, label: 'Packs annuels actifs', value: dashboard.activeYearlyCount },
        ]}
      />

      <KpiSection
        title="Securite des scans"
        subtitle="Lecture synthetique des resultats detectes."
        columns="xl:grid-cols-3"
        cards={[
          { icon: AlertTriangle, label: 'Scans avec gluten', value: stats.glutenCount, tone: 'red' },
          { icon: CheckCircle2, label: 'Scans sans gluten detecte', value: stats.noGlutenCount, tone: 'green' },
          { icon: ShieldCheck, label: 'Risques possibles', value: stats.possibleRiskCount },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="grid gap-6">
          <Panel title="Demandes recentes" subtitle="Paiements manuels qui attendent une validation.">
            <div className="grid gap-3">
              {recentRequests.length === 0 ? <Empty>Aucune demande en attente.</Empty> : null}
              {recentRequests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#1d252b]">{request.userName}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{request.userEmail || '-'}</p>
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

          <Panel title="Activite recente" subtitle="Dernieres analyses effectuees par les utilisateurs.">
            <div className="grid gap-3">
              {recentAnalyses.length === 0 ? <Empty>Aucune activite recente.</Empty> : null}
              {recentAnalyses.map((analysis) => (
                <article key={analysis.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#1d252b]">{analysis.productName}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                        {analysis.userName} - {analysis.userEmail || '-'}
                      </p>
                    </div>
                    <Badge>{analysis.status}</Badge>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">{formatDateTime(analysis.createdAt)}</p>
                </article>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Repartition des packs" subtitle="Etat courant des types de packs utilisateurs.">
            <div className="grid gap-3">
              {packDistribution.length === 0 ? <Empty>Aucune donnee de packs disponible.</Empty> : null}
              {packDistribution.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-bold text-slate-700">{item.label}</span>
                  <span className="shrink-0 text-lg font-black text-[#1d252b]">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <AdminChartCard title="Scans par statut" subtitle="Repartition globale des resultats">
            {stats.scansByStatus?.length ? (
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
            ) : (
              <Empty>Aucune donnee de scans disponible.</Empty>
            )}
          </AdminChartCard>
        </div>
      </section>
    </div>
  );
}

function KpiSection({ title, subtitle, cards, columns = 'xl:grid-cols-4' }) {
  return (
    <section className="space-y-4">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className={`grid gap-4 sm:grid-cols-2 ${columns}`}>
        {cards.map((card, index) => (
          <AdminStatCard key={card.label} {...card} delay={index * 40} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-[#1d252b]">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="admin-card p-6">
      <h2 className="text-lg font-extrabold text-[#1d252b]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Badge({ children }) {
  return <span className="inline-flex max-w-full rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function Empty({ children }) {
  return <p className="rounded-2xl border border-dashed border-[#cbdccb] bg-[#f7f8f6] p-6 text-center text-sm font-bold text-slate-500">{children}</p>;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
