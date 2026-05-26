import { Crown, LogOut, RefreshCw, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { signOut } from '../lib/auth.js';
import { fetchAdminDashboard, runAdminUserAction } from '../lib/adminStats.js';

export default function AdminPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      setDashboard(await fetchAdminDashboard());
    } catch (loadError) {
      setDashboard(null);
      setError(loadError.message || 'Impossible de charger les statistiques admin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  async function handleUserAction(user, action, body = {}) {
    setActionLoading(`${user.id}:${action}`);
    setError('');

    try {
      await runAdminUserAction(user.id, action, body);
      await loadDashboard();
    } catch (actionError) {
      setError(actionError.message || 'Action admin impossible.');
    } finally {
      setActionLoading('');
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="brand-kicker">Administration</p>
            <h1 className="mt-3 brand-heading">Dashboard Admin</h1>
            <p className="mt-3 brand-copy">Vue rapide de l'activité GlutiSafe.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={loadDashboard} disabled={loading}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualiser
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Déconnexion
            </Button>
          </div>
        </header>

        {loading ? <p className="surface-card p-5 text-sm font-bold text-slate-600">Chargement des statistiques...</p> : null}
        {error ? <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

        {!loading && dashboard ? (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={UserRound} label="Utilisateurs" value={dashboard.usersCount} />
              <KpiCard icon={ScanLine} label="Scans effectués" value={dashboard.scansCount} />
              <KpiCard icon={ShieldCheck} label="Statut plateforme" value={dashboard.platformStatus} accent />
              <KpiCard icon={Crown} label="Admin principal" value={dashboard.mainAdmin} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <UsersTable users={dashboard.users} actionLoading={actionLoading} onAction={handleUserAction} />
              <div className="space-y-6">
                <ScanStatistics stats={dashboard.scanStats} />
                <LatestAnalyses analyses={dashboard.latestAnalyses} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function KpiCard({ icon: Icon, label, value, accent = false }) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className={`mt-3 break-words text-3xl font-extrabold ${accent ? 'text-[#008f45]' : 'text-[#1d252b]'}`}>{value}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function UsersTable({ users, actionLoading, onAction }) {
  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="border-b border-[#dfe8df] p-5">
        <h2 className="text-xl font-extrabold text-[#1d252b]">Gestion des utilisateurs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#f7f8f6] text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-5 py-4">Nom</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Rôle</th>
              <th className="px-5 py-4">Pack</th>
              <th className="px-5 py-4">Fin</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfe8df]">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-5 py-4 font-bold text-[#1d252b]">{user.name}</td>
                <td className="px-5 py-4 text-slate-600">{user.email}</td>
                <td className="px-5 py-4">
                  <Badge>{user.role}</Badge>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {user.packStatus} / {user.packType}
                </td>
                <td className="px-5 py-4 text-slate-600">{formatDate(user.packEndAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <SmallAction disabled={actionLoading === `${user.id}:activate-pack`} onClick={() => onAction(user, 'activate-pack', { pack_type: 'monthly' })}>
                      Mensuel
                    </SmallAction>
                    <SmallAction disabled={actionLoading === `${user.id}:activate-pack`} onClick={() => onAction(user, 'activate-pack', { pack_type: 'yearly' })}>
                      Annuel
                    </SmallAction>
                    <SmallAction disabled={actionLoading === `${user.id}:expire-pack`} onClick={() => onAction(user, 'expire-pack')}>
                      Expirer
                    </SmallAction>
                    <SmallAction disabled={actionLoading === `${user.id}:block`} danger onClick={() => onAction(user, 'block')}>
                      Bloquer
                    </SmallAction>
                    {user.role !== 'admin' ? (
                      <SmallAction disabled={actionLoading === `${user.id}:make-admin`} onClick={() => onAction(user, 'make-admin')}>
                        Admin
                      </SmallAction>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LatestAnalyses({ analyses }) {
  return (
    <section className="surface-card p-5">
      <h2 className="text-xl font-extrabold text-[#1d252b]">Dernières analyses</h2>
      <div className="mt-4 space-y-3">
        {analyses.length === 0 ? <p className="text-sm font-semibold text-slate-500">Aucune analyse enregistrée.</p> : null}
        {analyses.map((analysis) => (
          <article key={analysis.id} className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-[#1d252b]">{analysis.label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{analysis.userName}</p>
              </div>
              <Badge>{analysis.inputType}</Badge>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{formatDate(analysis.createdAt)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScanStatistics({ stats }) {
  return (
    <section className="surface-card p-5">
      <h2 className="text-xl font-extrabold text-[#1d252b]">Statistiques des scans</h2>
      <div className="mt-4 space-y-3">
        {stats.length === 0 ? <p className="text-sm font-semibold text-slate-500">Aucun scan enregistré.</p> : null}
        {stats.map((item) => (
          <div key={item.status} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-4">
            <span className="text-sm font-bold text-slate-700">{item.status}</span>
            <span className="text-lg font-black text-[#1d252b]">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SmallAction({ children, danger = false, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-[#dfe8df] bg-white text-slate-700 hover:border-[#008f45] hover:text-[#008f45]'
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-black text-slate-600">{children}</span>;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}
