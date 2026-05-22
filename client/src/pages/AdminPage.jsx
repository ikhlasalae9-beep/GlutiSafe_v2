import { Crown, LogOut, ScanLine, ShieldCheck, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { clearPrincipalAdminSession } from '../lib/adminAuth.js';
import { getAdminStats } from '../lib/scanStats.js';

export default function AdminPage() {
  const navigate = useNavigate();
  const stats = useMemo(() => getAdminStats(), []);

  const handleLogout = () => {
    clearPrincipalAdminSession();
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-8 text-[#1d252b] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="brand-kicker">Administration</p>
            <h1 className="mt-3 brand-heading">Dashboard Admin</h1>
            <p className="mt-3 brand-copy">Vue rapide de l’activité GlutiSafe.</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Déconnexion
          </Button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={UserRound} label="Utilisateurs" value={stats.usersCount} />
          <KpiCard icon={ScanLine} label="Scans effectués" value={stats.scansCount} />
          <KpiCard icon={ShieldCheck} label="Statut plateforme" value={stats.status} accent />
          <KpiCard icon={Crown} label="Admin principal" value="Alae" />
        </section>
      </div>
    </main>
  );
}

function KpiCard({ icon: Icon, label, value, accent = false }) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className={`mt-3 text-3xl font-extrabold ${accent ? 'text-[#008f45]' : 'text-[#1d252b]'}`}>{value}</p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f4e8] text-[#008f45]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
